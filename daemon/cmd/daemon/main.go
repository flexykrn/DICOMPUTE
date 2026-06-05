package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"go.uber.org/zap"

	"github.com/flexykrn/dicompute/daemon/internal/config"
	"github.com/flexykrn/dicompute/daemon/internal/db"
	"github.com/flexykrn/dicompute/daemon/internal/heartbeat"
	"github.com/flexykrn/dicompute/daemon/internal/indexer"
	"github.com/flexykrn/dicompute/daemon/internal/models"
	"github.com/flexykrn/dicompute/daemon/internal/provisioner"
	"github.com/flexykrn/dicompute/daemon/internal/watcher"
	"github.com/flexykrn/dicompute/daemon/internal/ws"
)

// Provisioner interface abstracts Docker vs Mock
type Provisioner interface {
	PullImage(ctx context.Context, imageRef string) error
	CreateContainer(ctx context.Context, job *models.Job, cfg *models.ContainerConfig) (string, error)
	StartContainer(ctx context.Context, containerID string) error
	StopContainer(ctx context.Context, containerID string, timeout time.Duration) error
	RemoveContainer(ctx context.Context, containerID string) error
	GetContainerLogs(ctx context.Context, containerID string) (string, error)
	IsContainerRunning(ctx context.Context, containerID string) (bool, error)
	GetContainerStats(ctx context.Context, containerID string) (*models.ResourceMetrics, error)
	Close() error
}

func main() {
	// Setup logger
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	// Load config
	cfg, err := config.Load()
	if err != nil {
		logger.Fatal("failed to load config", zap.Error(err))
	}

	logger.Info("starting DICOMPUTE daemon",
		zap.String("backend", cfg.BackendURL),
		zap.String("rpc", cfg.RPCURL),
	)

	// Initialize provisioner (Docker or Mock)
	var prov Provisioner
	dockerProv, err := provisioner.NewDockerProvisioner(cfg.DockerHost, cfg.MockGPU, logger)
	if err != nil {
		logger.Warn("Docker unavailable, using mock provisioner", zap.Error(err))
		prov = provisioner.NewMockProvisioner(logger)
	} else {
		logger.Info("Docker provisioner ready")
		prov = dockerProv
	}
	defer prov.Close()

	// Initialize backend client (watcher)
	backendClient := watcher.NewBackendClient(cfg.BackendURL, cfg.BackendAPIKey, logger)
	jobWatcher := watcher.NewWatcher(backendClient, cfg.PollInterval, logger)

	// Initialize heartbeat generator
	providerAddr := common.HexToAddress(os.Getenv("PROVIDER_ADDRESS"))
	hbGen := heartbeat.NewGenerator(cfg.PrivateKey, providerAddr, cfg.ChainID, common.HexToAddress(cfg.JobEscrowAddress), logger)
	hbSender := heartbeat.NewSender(cfg.BackendURL, cfg.BackendAPIKey, logger)

	// Initialize WebSocket broadcaster
	broadcaster := ws.NewBroadcaster(logger)

	// Initialize database (optional — for indexer)
	var eventStore *db.EventStore
	if cfg.DatabaseURL != "" {
		eventStore, err = db.NewEventStore(cfg.DatabaseURL, logger)
		if err != nil {
			logger.Warn("failed to connect to database, indexer will run without persistence", zap.Error(err))
		} else {
			defer eventStore.Close()
			if err := eventStore.InitializeSchema(context.Background()); err != nil {
				logger.Warn("failed to initialize schema", zap.Error(err))
			}
		}
	}

	// Initialize event indexer (if contract address is set)
	var eventIndexer *indexer.EventIndexer
	if cfg.JobEscrowAddress != "" {
		eventIndexer, err = indexer.NewEventIndexer(cfg.RPCURL, cfg.JobEscrowAddress, eventStore, logger)
		if err != nil {
			logger.Warn("failed to create event indexer", zap.Error(err))
		} else {
			// Wire broadcaster to indexer
			eventIndexer.SetBroadcastFunc(func(event string, data interface{}) {
				broadcaster.Broadcast(event, data)
			})
		}
	}

	// Register job handler
	jobWatcher.RegisterHandler(func(ctx context.Context, assignment watcher.JobAssignment) error {
		logger.Info("handling job assignment",
			zap.Int("job_id", assignment.ID),
			zap.String("image", assignment.DockerURI),
		)

		// Build job model
		job := &models.Job{
			ID:          uint64(assignment.ID),
			ChainJobID:  uint64(assignment.ChainJobID),
			UserAddress: assignment.UserAddress,
			Spec: models.JobSpec{
				DockerURI: assignment.DockerURI,
				CPUMilli:  uint64(assignment.CPUMilli),
				RAMMiB:    uint64(assignment.RAMMiB),
				VRAMMiB:   uint64(assignment.VRAMMiB),
			},
			Deposit: 0, // parse from string if needed
			State:   models.JobStateActive,
		}

		// Build container config
		containerCfg := provisioner.BuildContainerConfig(job, cfg.DataVolumePath)

		// Pull image
		if err := prov.PullImage(ctx, containerCfg.Image); err != nil {
			logger.Error("failed to pull image", zap.Error(err))
			return fmt.Errorf("pull image: %w", err)
		}

		// Create container
		containerID, err := prov.CreateContainer(ctx, job, containerCfg)
		if err != nil {
			logger.Error("failed to create container", zap.Error(err))
			return fmt.Errorf("create container: %w", err)
		}
		job.ContainerID = containerID

		// Start container
		if err := prov.StartContainer(ctx, containerID); err != nil {
			logger.Error("failed to start container", zap.Error(err))
			return fmt.Errorf("start container: %w", err)
		}

		// Report status
		if err := backendClient.ReportJobStatus(ctx, job.ID, models.JobStateActive, containerID, ""); err != nil {
			logger.Warn("failed to report status", zap.Error(err))
		}

		// Start heartbeat loop
		go runHeartbeatLoop(ctx, job, hbGen, hbSender, prov, backendClient, cfg, logger)

		return nil
	})

	// Context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Handle shutdown signals
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	// Start watcher
	go func() {
		if err := jobWatcher.Start(ctx); err != nil {
			logger.Error("watcher stopped", zap.Error(err))
		}
	}()

	// Start WebSocket broadcaster
	go broadcaster.Start(ctx)

	// Start HTTP server for WebSocket endpoint
	go func() {
		http.Handle("/ws", broadcaster)
		http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			fmt.Fprintf(w, `{"status":"ok","clients":%d}`, broadcaster.GetClientCount())
		})
		logger.Info("HTTP server starting on :8080")
		if err := http.ListenAndServe(":8080", nil); err != nil {
			logger.Error("HTTP server failed", zap.Error(err))
		}
	}()

	// Start indexer if available
	if eventIndexer != nil {
		go func() {
			if err := eventIndexer.Start(ctx, 10*time.Second); err != nil {
				logger.Error("indexer stopped", zap.Error(err))
			}
		}()
	}

	logger.Info("daemon running — waiting for jobs")
	logger.Info("WebSocket endpoint: ws://localhost:8080/ws")
	logger.Info("Health endpoint: http://localhost:8080/health")

	// Wait for shutdown signal
	<-sigCh
	logger.Info("shutting down gracefully...")
	cancel()
}

func runHeartbeatLoop(
	ctx context.Context,
	job *models.Job,
	hbGen *heartbeat.Generator,
	hbSender *heartbeat.Sender,
	prov Provisioner,
	backendClient *watcher.BackendClient,
	cfg *config.Config,
	logger *zap.Logger,
) {
	logger.Info("starting heartbeat loop",
		zap.Uint64("job_id", job.ID),
		zap.Int("count", cfg.HeartbeatCount),
	)

	var uptime uint64
	for i := 0; i < cfg.HeartbeatCount; i++ {
		select {
		case <-ctx.Done():
			logger.Info("heartbeat loop cancelled", zap.Uint64("job_id", job.ID))
			return
		case <-time.After(cfg.HeartbeatInterval):
		}

		// Check if container is still running
		running, err := prov.IsContainerRunning(ctx, job.ContainerID)
		if err != nil {
			logger.Warn("failed to check container status", zap.Error(err))
		}

		if !running {
			logger.Info("container stopped", zap.Uint64("job_id", job.ID))
			break
		}

		uptime += uint64(cfg.HeartbeatInterval.Seconds())

		// Get real container stats (or mock if Docker unavailable)
		var cpuPercent, ramPercent, vramPercent float64
		stats, err := prov.GetContainerStats(ctx, job.ContainerID)
		if err != nil {
			logger.Warn("failed to get container stats, using mock", zap.Error(err))
			cpuPercent = 45.0 + float64(i)*2
			ramPercent = 60.0 + float64(i)*3
			vramPercent = 30.0 + float64(i)
		} else {
			cpuPercent = stats.CPUPercent
			ramPercent = stats.RAMPercent
			vramPercent = stats.VRAMPercent
			uptime = stats.UptimeSeconds
		}

		// Generate heartbeat with real or mock metrics
		hb, err := hbGen.GenerateHeartbeat(
			job.ChainJobID,
			0, // block number — backend fills this
			uptime,
			cpuPercent,
			ramPercent,
			vramPercent,
		)
		if err != nil {
			logger.Error("failed to generate heartbeat", zap.Error(err))
			continue
		}

		// Send to backend
		if err := hbSender.Send(ctx, hb); err != nil {
			logger.Warn("failed to send heartbeat", zap.Error(err))
		} else {
			logger.Info("heartbeat sent",
				zap.Uint64("job_id", job.ID),
				zap.Int("seq", i+1),
			)
		}
	}

	// Stop container
	if err := prov.StopContainer(ctx, job.ContainerID, 30*time.Second); err != nil {
		logger.Warn("failed to stop container", zap.Error(err))
	}

	// Get logs
	logs, _ := prov.GetContainerLogs(ctx, job.ContainerID)

	// Remove container
	if err := prov.RemoveContainer(ctx, job.ContainerID); err != nil {
		logger.Warn("failed to remove container", zap.Error(err))
	}

	// Report completion
	if err := backendClient.ReportJobStatus(ctx, job.ID, models.JobStateCompleted, "", logs); err != nil {
		logger.Warn("failed to report completion", zap.Error(err))
	}

	// Submit result (mock CID)
	if err := backendClient.SubmitResult(ctx, job.ID, "QmPyTorchTrainingDemo1234567890abcdef", 1000000); err != nil {
		logger.Warn("failed to submit result", zap.Error(err))
	}

	logger.Info("job completed",
		zap.Uint64("job_id", job.ID),
		zap.String("result_cid", "QmPyTorchTrainingDemo1234567890abcdef"),
	)
}
