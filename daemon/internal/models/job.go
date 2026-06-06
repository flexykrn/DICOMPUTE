package models

import "time"

// JobState represents the current state of a job
type JobState string

const (
	JobStatePending    JobState = "pending"
	JobStateActive     JobState = "active"
	JobStateCompleted  JobState = "completed"
	JobStateFailed     JobState = "failed"
	JobStateCancelled  JobState = "cancelled"
)

// JobSpec defines the resource requirements for a job
type JobSpec struct {
	DockerURI        string  `json:"docker_uri"`
	CPUMilli         uint64  `json:"cpu_milli"`
	RAMMiB           uint64  `json:"ram_mib"`
	VRAMMiB          uint64  `json:"vram_mib"`
	DurationBlocks   uint64  `json:"duration_blocks"`
	MaxPricePerBlock uint64  `json:"max_price_per_block"`
	InputDataCid     string  `json:"input_data_cid,omitempty"`
	ExpectedOutput   string  `json:"expected_output,omitempty"`
}

// Job represents a compute job assignment from the backend
type Job struct {
	ID               uint64    `json:"id"`
	ChainJobID       uint64    `json:"chain_job_id"`
	UserAddress      string    `json:"user_address"`
	ProviderAddress  string    `json:"provider_address"`
	Spec             JobSpec   `json:"spec"`
	Deposit          uint64    `json:"deposit"`
	State            JobState  `json:"state"`
	StartedAt        time.Time `json:"started_at"`
	CompletedAt      time.Time `json:"completed_at,omitempty"`
	ResultCID        string    `json:"result_cid,omitempty"`
	ContainerID      string    `json:"container_id,omitempty"`
}

// HeartbeatPayload is the EIP-712 structured data for heartbeats
type HeartbeatPayload struct {
	JobID        uint64 `json:"jobId"`
	BlockNumber  uint64 `json:"blockNumber"`
	UptimeSeconds uint64 `json:"uptimeSeconds"`
	CPUPercent   uint64 `json:"cpuPercent"`
	RAMPercent   uint64 `json:"ramPercent"`
	VRAMPercent  uint64 `json:"vramPercent"`
	Timestamp    uint64 `json:"timestamp"`
}

// HeartbeatResponse is sent to the backend API
type HeartbeatResponse struct {
	JobID        uint64    `json:"job_id"`
	BlockNumber  uint64    `json:"block_number"`
	UptimeSeconds uint64    `json:"uptime_seconds"`
	CPUPercent   float64   `json:"cpu_percent"`
	RAMPercent   float64   `json:"ram_percent"`
	VRAMPercent  float64   `json:"vram_percent"`
	Timestamp    time.Time `json:"timestamp"`
	Signature    string    `json:"signature"` // EIP-712 signature
}

// ContainerResources defines cgroup limits for a container
type ContainerResources struct {
	CPUQuota     int64  // CPU quota in microseconds
	CPUPeriod    uint64 // CPU period in microseconds
	MemoryLimit  int64  // Memory limit in bytes
	MemorySwap   int64  // Memory + swap limit in bytes
	DeviceShares int64  // GPU device shares (for nvidia-docker)
}

// ContainerConfig holds Docker container configuration
type ContainerConfig struct {
	Image        string
	Cmd          []string
	Env          []string
	Mounts       []VolumeMount
	Resources    ContainerResources
	NetworkMode  string
}

// VolumeMount defines a host-to-container volume mapping
type VolumeMount struct {
	Source   string
	Target   string
	ReadOnly bool
}

// ResourceMetrics holds real-time container resource usage
type ResourceMetrics struct {
	CPUPercent   float64
	RAMPercent   float64
	VRAMPercent  float64
	UptimeSeconds uint64
}
