package provisioner

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"go.uber.org/zap"

	"github.com/flexykrn/dicompute/daemon/internal/models"
)

// dockerStatsJSON matches Docker stats API response
type dockerStatsJSON struct {
	Read      time.Time `json:"read"`
	PidsStats struct {
		Current uint64 `json:"current,omitempty"`
	} `json:"pids_stats,omitempty"`
	MemoryStats struct {
		Usage  uint64 `json:"usage,omitempty"`
		Limit  uint64 `json:"limit,omitempty"`
		Stats  map[string]interface{} `json:"stats,omitempty"`
	} `json:"memory_stats,omitempty"`
	CPUStats struct {
		CPUUsage struct {
			TotalUsage  uint64   `json:"total_usage,omitempty"`
			PercpuUsage []uint64 `json:"percpu_usage,omitempty"`
		} `json:"cpu_usage,omitempty"`
		SystemUsage uint64 `json:"system_cpu_usage,omitempty"`
		OnlineCPUs  uint32 `json:"online_cpus,omitempty"`
	} `json:"cpu_stats,omitempty"`
	PreCPUStats struct {
		CPUUsage struct {
			TotalUsage  uint64   `json:"total_usage,omitempty"`
			PercpuUsage []uint64 `json:"percpu_usage,omitempty"`
		} `json:"cpu_usage,omitempty"`
		SystemUsage uint64 `json:"system_cpu_usage,omitempty"`
	} `json:"precpu_stats,omitempty"`
}

// GetContainerStats retrieves real CPU and memory stats from Docker
func (dp *DockerProvisioner) GetContainerStats(ctx context.Context, containerID string) (*models.ResourceMetrics, error) {
	stats, err := dp.client.ContainerStats(ctx, containerID, false)
	if err != nil {
		return nil, fmt.Errorf("failed to get container stats: %w", err)
	}
	defer stats.Body.Close()

	var v dockerStatsJSON
	if err := json.NewDecoder(stats.Body).Decode(&v); err != nil {
		return nil, fmt.Errorf("failed to decode stats: %w", err)
	}

	// Calculate CPU percentage
	cpuPercent := calculateCPUPercent(v)

	// Calculate memory percentage
	memPercent := 0.0
	if v.MemoryStats.Limit > 0 {
		memPercent = (float64(v.MemoryStats.Usage) / float64(v.MemoryStats.Limit)) * 100
	}

	// Calculate uptime from read timestamp
	uptime := uint64(time.Since(v.Read).Seconds())

	// Get GPU stats if available
	var vramPercent float64
	if dp.gpuManager != nil && dp.gpuManager.IsAvailable() {
		vramPercent = dp.gpuManager.GetAverageVRAMPercent()
	}

	return &models.ResourceMetrics{
		CPUPercent:    cpuPercent,
		RAMPercent:    memPercent,
		VRAMPercent:   vramPercent,
		UptimeSeconds: uptime,
	}, nil
}

// calculateCPUPercent computes CPU usage percentage from Docker stats
func calculateCPUPercent(v dockerStatsJSON) float64 {
	if v.CPUStats.SystemUsage == 0 || v.PreCPUStats.SystemUsage == 0 {
		return 0
	}

	cpuDelta := float64(v.CPUStats.CPUUsage.TotalUsage) - float64(v.PreCPUStats.CPUUsage.TotalUsage)
	systemDelta := float64(v.CPUStats.SystemUsage) - float64(v.PreCPUStats.SystemUsage)

	if systemDelta > 0 && cpuDelta > 0 {
		cpuCount := float64(v.CPUStats.OnlineCPUs)
		if cpuCount == 0 {
			cpuCount = float64(len(v.CPUStats.CPUUsage.PercpuUsage))
		}
		if cpuCount == 0 {
			cpuCount = 1
		}
		return (cpuDelta / systemDelta) * cpuCount * 100
	}

	return 0
}

// StreamContainerStats continuously streams stats from a container
func (dp *DockerProvisioner) StreamContainerStats(ctx context.Context, containerID string, interval time.Duration, metricsCh chan<- *models.ResourceMetrics) error {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
			stats, err := dp.GetContainerStats(ctx, containerID)
			if err != nil {
				dp.logger.Warn("failed to get stats", zap.Error(err))
				continue
			}
			metricsCh <- stats
		}
	}
}
