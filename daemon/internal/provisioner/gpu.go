package provisioner

import (
	"fmt"
	"os"
	"os/exec"
	"strconv"
	"strings"

	"github.com/docker/docker/api/types/container"
	"go.uber.org/zap"
)

// GPUManagerInterface defines GPU operations
type GPUManagerInterface interface {
	IsAvailable() bool
	GetGPUCount() int
	GetContainerGPUConfig(vramMiB uint64) (*container.DeviceRequest, error)
	GetAverageVRAMPercent() float64
}

// GPUManager handles NVIDIA GPU detection and configuration
type GPUManager struct {
	logger          *zap.Logger
	nvidiaAvailable bool
	gpuCount        int
	gpuMemory       map[int]uint64 // GPU index -> total VRAM in MiB
}

// NewGPUManager detects NVIDIA GPUs and returns manager
func NewGPUManager(logger *zap.Logger) GPUManagerInterface {
	gm := &GPUManager{
		logger:    logger,
		gpuMemory: make(map[int]uint64),
	}
	gm.detectGPUs()
	return gm
}

// detectGPUs checks for nvidia-smi and GPU availability
func (gm *GPUManager) detectGPUs() {
	cmd := exec.Command("nvidia-smi", "--query-gpu=count", "--format=csv,noheader")
	output, err := cmd.Output()
	if err != nil {
		gm.logger.Info("NVIDIA GPUs not detected", zap.Error(err))
		gm.nvidiaAvailable = false
		return
	}

	countStr := strings.TrimSpace(string(output))
	count, err := strconv.Atoi(countStr)
	if err != nil {
		gm.logger.Warn("failed to parse GPU count", zap.Error(err))
		gm.nvidiaAvailable = false
		return
	}

	gm.gpuCount = count
	gm.nvidiaAvailable = count > 0

	if gm.nvidiaAvailable {
		gm.logger.Info("NVIDIA GPUs detected", zap.Int("count", count))
		gm.queryGPUMemory()
	}
}

// queryGPUMemory gets VRAM for each GPU
func (gm *GPUManager) queryGPUMemory() {
	cmd := exec.Command("nvidia-smi", "--query-gpu=index,memory.total", "--format=csv,noheader,nounits")
	output, err := cmd.Output()
	if err != nil {
		gm.logger.Warn("failed to query GPU memory", zap.Error(err))
		return
	}

	lines := strings.Split(strings.TrimSpace(string(output)), "\n")
	for _, line := range lines {
		parts := strings.Split(strings.TrimSpace(line), ",")
		if len(parts) != 2 {
			continue
		}

		index, err := strconv.Atoi(strings.TrimSpace(parts[0]))
		if err != nil {
			continue
		}

		memStr := strings.TrimSpace(parts[1])
		memMiB, err := strconv.ParseUint(memStr, 10, 64)
		if err != nil {
			continue
		}

		gm.gpuMemory[index] = memMiB
		gm.logger.Info("GPU memory detected",
			zap.Int("gpu_index", index),
			zap.Uint64("memory_mib", memMiB),
		)
	}
}

// IsAvailable returns true if NVIDIA GPUs are available
func (gm *GPUManager) IsAvailable() bool {
	return gm.nvidiaAvailable
}

// GetGPUCount returns number of GPUs
func (gm *GPUManager) GetGPUCount() int {
	return gm.gpuCount
}

// GetContainerGPUConfig returns Docker GPU device config
func (gm *GPUManager) GetContainerGPUConfig(vramMiB uint64) (*container.DeviceRequest, error) {
	if !gm.nvidiaAvailable {
		return nil, fmt.Errorf("no NVIDIA GPUs available")
	}

	gpusNeeded := 1
	if vramMiB > 0 {
		for i := 0; i < gm.gpuCount; i++ {
			if gm.gpuMemory[i] >= vramMiB {
				gpusNeeded = 1
				break
			}
		}
	}

	deviceIDs := []string{}
	for i := 0; i < gpusNeeded && i < gm.gpuCount; i++ {
		deviceIDs = append(deviceIDs, fmt.Sprintf("%d", i))
	}

	return &container.DeviceRequest{
		Driver:       "nvidia",
		Count:        -1,
		DeviceIDs:    deviceIDs,
		Capabilities: [][]string{{"gpu"}},
		Options: map[string]string{
			"nvidia-disable-require": "true",
		},
	}, nil
}

// GetAverageVRAMPercent returns average VRAM usage across all GPUs
func (gm *GPUManager) GetAverageVRAMPercent() float64 {
	if !gm.nvidiaAvailable {
		return 0
	}

	cmd := exec.Command("nvidia-smi",
		"--query-gpu=memory.used,memory.total",
		"--format=csv,noheader,nounits")
	output, err := cmd.Output()
	if err != nil {
		return 0
	}

	var totalPercent float64
	var count int
	lines := strings.Split(strings.TrimSpace(string(output)), "\n")
	for _, line := range lines {
		parts := strings.Split(strings.TrimSpace(line), ",")
		if len(parts) != 2 {
			continue
		}

		used, _ := strconv.ParseUint(strings.TrimSpace(parts[0]), 10, 64)
		total, _ := strconv.ParseUint(strings.TrimSpace(parts[1]), 10, 64)

		if total > 0 {
			totalPercent += (float64(used) / float64(total)) * 100
			count++
		}
	}

	if count == 0 {
		return 0
	}
	return totalPercent / float64(count)
}

// MockGPUManager simulates NVIDIA GPU for testing in VMs
type MockGPUManager struct {
	gpuCount   int
	vramPerGPU uint64
	logger     *zap.Logger
}

// NewMockGPUManager creates a simulated GPU manager
func NewMockGPUManager(logger *zap.Logger) GPUManagerInterface {
	return &MockGPUManager{
		gpuCount:   1,
		vramPerGPU: 8192,
		logger:     logger,
	}
}

// IsAvailable always returns true for mock
func (m *MockGPUManager) IsAvailable() bool {
	return true
}

// GetGPUCount returns simulated GPU count
func (m *MockGPUManager) GetGPUCount() int {
	return m.gpuCount
}

// GetContainerGPUConfig returns simulated GPU config
func (m *MockGPUManager) GetContainerGPUConfig(vramMiB uint64) (*container.DeviceRequest, error) {
	m.logger.Info("allocating mock GPU",
		zap.Uint64("vram_required", vramMiB),
		zap.Int("gpu_count", m.gpuCount),
	)

	return &container.DeviceRequest{
		Driver:       "nvidia",
		Count:        -1,
		Capabilities: [][]string{{"gpu"}},
		Options: map[string]string{
			"capabilities": "compute,utility",
		},
	}, nil
}

// GetAverageVRAMPercent returns simulated VRAM usage
func (m *MockGPUManager) GetAverageVRAMPercent() float64 {
	return 25.0 + float64(os.Getpid()%30)
}
