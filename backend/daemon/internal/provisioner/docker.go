package provisioner

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/mount"
	"github.com/docker/docker/client"
	"go.uber.org/zap"

	"github.com/flexykrn/dicompute/daemon/internal/models"
)

// DockerProvisioner manages container lifecycle
type DockerProvisioner struct {
	client     *client.Client
	gpuManager GPUManagerInterface
	logger     *zap.Logger
}

// NewDockerProvisioner creates a new Docker provisioner
func NewDockerProvisioner(dockerHost string, mockGPU bool, logger *zap.Logger) (*DockerProvisioner, error) {
	opts := []client.Opt{}
	if dockerHost != "" {
		opts = append(opts, client.WithHost(dockerHost))
	}

	cli, err := client.NewClientWithOpts(opts...)
	if err != nil {
		return nil, fmt.Errorf("failed to create docker client: %w", err)
	}

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if _, err := cli.Ping(ctx); err != nil {
		return nil, fmt.Errorf("docker daemon unreachable: %w", err)
	}

	// Detect GPUs (real or mock)
	var gpuManager GPUManagerInterface
	if mockGPU {
		logger.Info("using mock GPU manager")
		gpuManager = NewMockGPUManager(logger)
	} else {
		gpuManager = NewGPUManager(logger)
	}

	return &DockerProvisioner{
		client:     cli,
		gpuManager: gpuManager,
		logger:     logger,
	}, nil
}

// PullImage pulls a Docker image
func (dp *DockerProvisioner) PullImage(ctx context.Context, imageRef string) error {
	dp.logger.Info("pulling image", zap.String("image", imageRef))

	reader, err := dp.client.ImagePull(ctx, imageRef, types.ImagePullOptions{})
	if err != nil {
		return fmt.Errorf("failed to pull image %s: %w", imageRef, err)
	}
	defer reader.Close()

	// Drain the output
	io.Copy(io.Discard, reader)

	dp.logger.Info("image pulled", zap.String("image", imageRef))
	return nil
}

// CreateContainer creates a new container with resource limits
func (dp *DockerProvisioner) CreateContainer(ctx context.Context, job *models.Job, cfg *models.ContainerConfig) (string, error) {
	dp.logger.Info("creating container",
		zap.Uint64("job_id", job.ID),
		zap.String("image", cfg.Image),
	)

	// Prepare environment variables
	env := append(cfg.Env,
		fmt.Sprintf("JOB_ID=%d", job.ID),
		fmt.Sprintf("CHAIN_JOB_ID=%d", job.ChainJobID),
		fmt.Sprintf("USER_ADDRESS=%s", job.UserAddress),
	)

	// Prepare mounts
	var mounts []mount.Mount
	for _, m := range cfg.Mounts {
		// Ensure source directory exists
		if err := os.MkdirAll(m.Source, 0755); err != nil {
			return "", fmt.Errorf("failed to create mount source %s: %w", m.Source, err)
		}
		mounts = append(mounts, mount.Mount{
			Type:     mount.TypeBind,
			Source:   m.Source,
			Target:   m.Target,
			ReadOnly: m.ReadOnly,
		})
	}

	// Resource limits via cgroups
	resources := &container.Resources{
		CPUQuota:   cfg.Resources.CPUQuota,
		CPUPeriod:  int64(cfg.Resources.CPUPeriod),
		Memory:     cfg.Resources.MemoryLimit,
		MemorySwap: cfg.Resources.MemorySwap,
	}

	// Container config
	containerConfig := &container.Config{
		Image: cfg.Image,
		Cmd:   cfg.Cmd,
		Env:   env,
		Labels: map[string]string{
			"dicompute.job_id":       fmt.Sprintf("%d", job.ID),
			"dicompute.chain_job_id": fmt.Sprintf("%d", job.ChainJobID),
			"dicompute.user":         job.UserAddress,
		},
	}

	hostConfig := &container.HostConfig{
		Mounts:      mounts,
		Resources:   *resources,
		AutoRemove:  false,
		NetworkMode: container.NetworkMode(cfg.NetworkMode),
	}

	// GPU support — add device requests if VRAM required
	if job.Spec.VRAMMiB > 0 && dp.gpuManager.IsAvailable() {
		gpuConfig, err := dp.gpuManager.GetContainerGPUConfig(job.Spec.VRAMMiB)
		if err == nil && gpuConfig != nil {
			hostConfig.Resources.DeviceRequests = []container.DeviceRequest{*gpuConfig}
			dp.logger.Info("GPU allocated for container",
				zap.Uint64("vram_mib", job.Spec.VRAMMiB),
			)
		}
	}

	// Create container
	resp, err := dp.client.ContainerCreate(ctx, containerConfig, hostConfig, nil, nil, "")
	if err != nil {
		return "", fmt.Errorf("failed to create container: %w", err)
	}

	dp.logger.Info("container created",
		zap.String("container_id", resp.ID[:12]),
		zap.Uint64("job_id", job.ID),
	)

	return resp.ID, nil
}

// StartContainer starts a container
func (dp *DockerProvisioner) StartContainer(ctx context.Context, containerID string) error {
	dp.logger.Info("starting container", zap.String("container_id", containerID[:12]))

	if err := dp.client.ContainerStart(ctx, containerID, container.StartOptions{}); err != nil {
		return fmt.Errorf("failed to start container %s: %w", containerID[:12], err)
	}

	dp.logger.Info("container started", zap.String("container_id", containerID[:12]))
	return nil
}

// StopContainer stops a container gracefully
func (dp *DockerProvisioner) StopContainer(ctx context.Context, containerID string, timeout time.Duration) error {
	dp.logger.Info("stopping container", zap.String("container_id", containerID[:12]))

	timeoutSec := int(timeout.Seconds())
	if err := dp.client.ContainerStop(ctx, containerID, container.StopOptions{Timeout: &timeoutSec}); err != nil {
		return fmt.Errorf("failed to stop container %s: %w", containerID[:12], err)
	}

	dp.logger.Info("container stopped", zap.String("container_id", containerID[:12]))
	return nil
}

// RemoveContainer removes a container
func (dp *DockerProvisioner) RemoveContainer(ctx context.Context, containerID string) error {
	dp.logger.Info("removing container", zap.String("container_id", containerID[:12]))

	if err := dp.client.ContainerRemove(ctx, containerID, container.RemoveOptions{Force: true}); err != nil {
		return fmt.Errorf("failed to remove container %s: %w", containerID[:12], err)
	}

	dp.logger.Info("container removed", zap.String("container_id", containerID[:12]))
	return nil
}

// GetContainerLogs retrieves container logs
func (dp *DockerProvisioner) GetContainerLogs(ctx context.Context, containerID string) (string, error) {
	options := container.LogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Tail:       "100",
	}

	reader, err := dp.client.ContainerLogs(ctx, containerID, options)
	if err != nil {
		return "", fmt.Errorf("failed to get logs: %w", err)
	}
	defer reader.Close()

	logs, err := io.ReadAll(reader)
	if err != nil {
		return "", fmt.Errorf("failed to read logs: %w", err)
	}

	return string(logs), nil
}

// IsContainerRunning checks if a container is still running
func (dp *DockerProvisioner) IsContainerRunning(ctx context.Context, containerID string) (bool, error) {
	inspect, err := dp.client.ContainerInspect(ctx, containerID)
	if err != nil {
		return false, fmt.Errorf("failed to inspect container: %w", err)
	}
	return inspect.State.Running, nil
}

// Close closes the Docker client
func (dp *DockerProvisioner) Close() error {
	return dp.client.Close()
}

// BuildContainerConfig builds container config from job spec
func BuildContainerConfig(job *models.Job, dataPath string) *models.ContainerConfig {
	// Convert resource specs to Docker limits
	cpuQuota := int64(job.Spec.CPUMilli) * 100 // milliCPU to quota
	memLimit := int64(job.Spec.RAMMiB) * 1024 * 1024 // MiB to bytes

	inputDir := filepath.Join(dataPath, fmt.Sprintf("job_%d", job.ID), "input")
	outputDir := filepath.Join(dataPath, fmt.Sprintf("job_%d", job.ID), "output")

	// Build env vars including dataset CID and expected output
	env := []string{}
	if job.Spec.InputDataCid != "" {
		env = append(env, fmt.Sprintf("DATASET_CID=%s", job.Spec.InputDataCid))
	}
	if job.Spec.ExpectedOutput != "" {
		env = append(env, fmt.Sprintf("EXPECTED_OUTPUT=%s", job.Spec.ExpectedOutput))
	}

	return &models.ContainerConfig{
		Image: job.Spec.DockerURI,
		Cmd:   []string{"python", "-u", "train.py"}, // Default; override via metadata
		Env:   env,
		Mounts: []models.VolumeMount{
			{Source: inputDir, Target: "/data/input", ReadOnly: true},
			{Source: outputDir, Target: "/data/output", ReadOnly: false},
		},
		Resources: models.ContainerResources{
			CPUQuota:    cpuQuota,
			CPUPeriod:   100000, // 100ms default
			MemoryLimit: memLimit,
			MemorySwap:  memLimit, // Disable swap
		},
		NetworkMode: "bridge",
	}
}
