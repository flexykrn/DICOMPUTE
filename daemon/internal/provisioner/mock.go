package provisioner

import (
	"context"
	"fmt"
	"time"

	"go.uber.org/zap"

	"github.com/flexykrn/dicompute/daemon/internal/models"
)

// MockProvisioner simulates Docker operations without needing Docker engine
// Use this for testing when Docker is not available
type MockProvisioner struct {
	logger      *zap.Logger
	containers  map[string]*mockContainer
}

type mockContainer struct {
	id        string
	jobID     uint64
	image     string
	running   bool
	startTime time.Time
}

// NewMockProvisioner creates a mock provisioner for testing
func NewMockProvisioner(logger *zap.Logger) *MockProvisioner {
	return &MockProvisioner{
		logger:     logger,
		containers: make(map[string]*mockContainer),
	}
}

// PullImage simulates pulling an image
func (mp *MockProvisioner) PullImage(ctx context.Context, imageRef string) error {
	mp.logger.Info("[MOCK] pulling image", zap.String("image", imageRef))
	time.Sleep(500 * time.Millisecond) // Simulate network delay
	mp.logger.Info("[MOCK] image pulled", zap.String("image", imageRef))
	return nil
}

// CreateContainer simulates creating a container
func (mp *MockProvisioner) CreateContainer(ctx context.Context, job *models.Job, cfg *models.ContainerConfig) (string, error) {
	mp.logger.Info("[MOCK] creating container",
		zap.Uint64("job_id", job.ID),
		zap.String("image", cfg.Image),
	)

	containerID := fmt.Sprintf("mock-%d-%d", job.ID, time.Now().Unix())
	mp.containers[containerID] = &mockContainer{
		id:        containerID,
		jobID:     job.ID,
		image:     cfg.Image,
		running:   false,
		startTime: time.Time{},
	}

	mp.logger.Info("[MOCK] container created", zap.String("container_id", containerID))
	return containerID, nil
}

// StartContainer simulates starting a container
func (mp *MockProvisioner) StartContainer(ctx context.Context, containerID string) error {
	mp.logger.Info("[MOCK] starting container", zap.String("container_id", containerID))

	c, exists := mp.containers[containerID]
	if !exists {
		return fmt.Errorf("container not found: %s", containerID)
	}

	c.running = true
	c.startTime = time.Now()

	mp.logger.Info("[MOCK] container started", zap.String("container_id", containerID))
	return nil
}

// StopContainer simulates stopping a container
func (mp *MockProvisioner) StopContainer(ctx context.Context, containerID string, timeout time.Duration) error {
	mp.logger.Info("[MOCK] stopping container", zap.String("container_id", containerID))

	c, exists := mp.containers[containerID]
	if !exists {
		return fmt.Errorf("container not found: %s", containerID)
	}

	c.running = false
	mp.logger.Info("[MOCK] container stopped", zap.String("container_id", containerID))
	return nil
}

// RemoveContainer simulates removing a container
func (mp *MockProvisioner) RemoveContainer(ctx context.Context, containerID string) error {
	mp.logger.Info("[MOCK] removing container", zap.String("container_id", containerID))
	delete(mp.containers, containerID)
	mp.logger.Info("[MOCK] container removed", zap.String("container_id", containerID))
	return nil
}

// GetContainerLogs returns mock logs
func (mp *MockProvisioner) GetContainerLogs(ctx context.Context, containerID string) (string, error) {
	return fmt.Sprintf("[MOCK] Logs for container %s\nTraining completed successfully\nEpoch 1/10: loss=0.45\nEpoch 10/10: loss=0.02\n", containerID), nil
}

// IsContainerRunning checks mock container state
func (mp *MockProvisioner) IsContainerRunning(ctx context.Context, containerID string) (bool, error) {
	c, exists := mp.containers[containerID]
	if !exists {
		return false, fmt.Errorf("container not found: %s", containerID)
	}
	return c.running, nil
}

// GetContainerStats returns mock resource stats
func (mp *MockProvisioner) GetContainerStats(ctx context.Context, containerID string) (*models.ResourceMetrics, error) {
	c, exists := mp.containers[containerID]
	if !exists {
		return nil, fmt.Errorf("container not found: %s", containerID)
	}

	if !c.running {
		return &models.ResourceMetrics{CPUPercent: 0, RAMPercent: 0, VRAMPercent: 0}, nil
	}

	uptime := uint64(time.Since(c.startTime).Seconds())

	// Simulate realistic metrics
	return &models.ResourceMetrics{
		CPUPercent:    45.0 + float64(uptime%20),
		RAMPercent:    60.0 + float64(uptime%15),
		VRAMPercent:   30.0 + float64(uptime%10),
		UptimeSeconds: uptime,
	}, nil
}

// Close is a no-op for mock
func (mp *MockProvisioner) Close() error {
	mp.logger.Info("[MOCK] provisioner closed")
	return nil
}
