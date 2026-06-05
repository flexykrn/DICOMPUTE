package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"go.uber.org/zap"

	"github.com/flexykrn/dicompute/daemon/internal/config"
	"github.com/flexykrn/dicompute/daemon/internal/heartbeat"
	"github.com/flexykrn/dicompute/daemon/internal/models"
	"github.com/flexykrn/dicompute/daemon/internal/provisioner"
	"github.com/flexykrn/dicompute/daemon/internal/watcher"
)

// MockBackendServer for testing
type MockBackendServer struct {
	assignments []watcher.JobAssignment
	heartbeats  []models.HeartbeatResponse
}

func (m *MockBackendServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	switch r.URL.Path {
	case "/api/provider/assignments/pending":
		if len(m.assignments) > 0 {
			fmt.Fprintf(w, `[{
				"job_id": %d,
				"chain_job_id": %d,
				"user_address": "0xDemoUser",
				"spec": {
					"docker_uri": "nginx:alpine",
					"cpu_milli": 2000,
					"ram_mib": 4096,
					"vram_mib": 0,
					"duration_blocks": 100,
					"max_price_per_block": 1000000000000000
				},
				"deposit": 100000000000000000,
				"assigned_at": "%s"
			}]`, m.assignments[0].JobID, m.assignments[0].ChainJobID, time.Now().Format(time.RFC3339))
			m.assignments = nil // Clear so it's only returned once
		} else {
			w.WriteHeader(http.StatusNoContent)
		}
	case "/api/jobs/1/heartbeat":
		fmt.Println("\033[94m[BACKEND] Heartbeat received\033[0m")
		w.WriteHeader(http.StatusOK)
	case "/api/jobs/1/status":
		fmt.Println("\033[93m[BACKEND] Status update received\033[0m")
		w.WriteHeader(http.StatusOK)
	case "/api/jobs/1/result":
		fmt.Println("\033[92m[BACKEND] Result submitted\033[0m")
		w.WriteHeader(http.StatusOK)
	default:
		w.WriteHeader(http.StatusNotFound)
	}
}

func main() {
	fmt.Println("\033[96m=========================================")
	fmt.Println("  DICOMPUTE Daemon E2E Test")
	fmt.Println("=========================================\033[0m")

	// Start mock backend
	mock := &MockBackendServer{
		assignments: []watcher.JobAssignment{{
			JobID:       1,
			ChainJobID:  1,
			UserAddress: "0xDemoUser",
			Spec: models.JobSpec{
				DockerURI:        "nginx:alpine",
				CPUMilli:         2000,
				RAMMiB:           4096,
				VRAMMiB:          0,
				DurationBlocks:   100,
				MaxPricePerBlock: 1000000000000000,
			},
			Deposit: 100000000000000000,
		}},
	}

	go func() {
		fmt.Println("\033[94m[TEST] Mock backend starting on :18000\033[0m")
		http.ListenAndServe(":18000", mock)
	}()

	time.Sleep(1 * time.Second)

	// Setup env
	os.Setenv("PROVIDER_PRIVATE_KEY", "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")
	os.Setenv("PROVIDER_ADDRESS", "0xMockProvider1234567890abcdef")
	os.Setenv("BACKEND_URL", "http://localhost:18000")
	os.Setenv("BACKEND_API_KEY", "test-key")
	os.Setenv("HEARTBEAT_INTERVAL", "2s")
	os.Setenv("HEARTBEAT_COUNT", "3")
	os.Setenv("DATA_VOLUME_PATH", "/tmp/dicompute-data")
	os.Setenv("LOG_LEVEL", "info")

	// Load config
	cfg, err := config.Load()
	if err != nil {
		fmt.Printf("Failed to load config: %v\n", err)
		os.Exit(1)
	}

	logger, _ := zap.NewDevelopment()
	defer logger.Sync()

	// Use mock provisioner
	prov := provisioner.NewMockProvisioner(logger)
	defer prov.Close()

	// Setup components
	backendClient := watcher.NewBackendClient(cfg.BackendURL, cfg.BackendAPIKey, logger)
	jobWatcher := watcher.NewWatcher(backendClient, cfg.PollInterval, logger)

	providerAddr := common.HexToAddress(os.Getenv("PROVIDER_ADDRESS"))
	hbGen := heartbeat.NewGenerator(cfg.PrivateKey, providerAddr, cfg.ChainID, common.HexToAddress(cfg.JobEscrowAddress), logger)
	hbSender := heartbeat.NewSender(cfg.BackendURL, cfg.BackendAPIKey, logger)

	// Register handler
	jobWatcher.RegisterHandler(func(ctx context.Context, assignment watcher.JobAssignment) error {
		fmt.Printf("\033[92m[DAEMON] Job %d assigned! Image: %s\033[0m\n", assignment.JobID, assignment.Spec.DockerURI)

		job := &models.Job{
			ID:          assignment.JobID,
			ChainJobID:  assignment.ChainJobID,
			UserAddress: assignment.UserAddress,
			Spec:        assignment.Spec,
			Deposit:     assignment.Deposit,
			State:       models.JobStateActive,
		}

		containerCfg := provisioner.BuildContainerConfig(job, cfg.DataVolumePath)

		if err := prov.PullImage(ctx, containerCfg.Image); err != nil {
			return err
		}

		containerID, err := prov.CreateContainer(ctx, job, containerCfg)
		if err != nil {
			return err
		}
		job.ContainerID = containerID

		if err := prov.StartContainer(ctx, containerID); err != nil {
			return err
		}

		// Run heartbeat loop synchronously for test
		runTestHeartbeatLoop(ctx, job, hbGen, hbSender, prov, backendClient, cfg, logger)

		return nil
	})

	// Run watcher with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	fmt.Println("\033[94m[TEST] Starting daemon, waiting for job assignment...\033[0m")

	if err := jobWatcher.Start(ctx); err != nil {
		fmt.Printf("\033[92m[TEST] Test completed: %v\033[0m\n", err)
	}

	fmt.Println("\033[96m=========================================")
	fmt.Println("  E2E Test Complete!")
	fmt.Println("=========================================\033[0m")
}

func runTestHeartbeatLoop(
	ctx context.Context,
	job *models.Job,
	hbGen *heartbeat.Generator,
	hbSender *heartbeat.Sender,
	prov *provisioner.MockProvisioner,
	backendClient *watcher.BackendClient,
	cfg *config.Config,
	logger *zap.Logger,
) {
	fmt.Printf("\033[93m[DAEMON] Starting heartbeat loop for job %d (3 heartbeats, 2s interval)\033[0m\n", job.ID)

	var uptime uint64
	for i := 0; i < cfg.HeartbeatCount; i++ {
		select {
		case <-ctx.Done():
			return
		case <-time.After(cfg.HeartbeatInterval):
		}

		running, _ := prov.IsContainerRunning(ctx, job.ContainerID)
		if !running {
			break
		}

		uptime += uint64(cfg.HeartbeatInterval.Seconds())

		// Get real stats from mock
		stats, _ := prov.GetContainerStats(ctx, job.ContainerID)

		hb, err := hbGen.GenerateHeartbeat(
			job.ChainJobID,
			0,
			uptime,
			stats.CPUPercent,
			stats.RAMPercent,
			stats.VRAMPercent,
		)
		if err != nil {
			logger.Error("failed to generate heartbeat", zap.Error(err))
			continue
		}

		if err := hbSender.Send(ctx, hb); err != nil {
			logger.Warn("failed to send heartbeat", zap.Error(err))
		} else {
			fmt.Printf("\033[92m[DAEMON] Heartbeat %d/3 sent | CPU: %.1f%% | RAM: %.1f%%\033[0m\n",
				i+1, stats.CPUPercent, stats.RAMPercent)
		}
	}

	prov.StopContainer(ctx, job.ContainerID, 5*time.Second)
	logs, _ := prov.GetContainerLogs(ctx, job.ContainerID)
	prov.RemoveContainer(ctx, job.ContainerID)

	backendClient.ReportJobStatus(ctx, job.ID, models.JobStateCompleted, "", logs)
	backendClient.SubmitResult(ctx, job.ID, "QmResultCID123", 1000000)

	fmt.Printf("\033[92m[DAEMON] Job %d COMPLETED! Result CID: QmResultCID123\033[0m\n", job.ID)
	fmt.Println("\033[92m[DAEMON] Mock logs:\033[0m")
	fmt.Println(logs)
}
