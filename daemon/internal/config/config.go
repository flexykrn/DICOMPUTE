package config

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

// Config holds all daemon configuration
type Config struct {
	// Blockchain
	RPCURL           string
	ChainID          int64
	JobEscrowAddress string
	PrivateKey       string

	// Backend API (M2)
	BackendURL       string
	BackendAPIKey    string
	PollInterval     time.Duration

	// Docker
	DockerHost       string
	DockerNetwork    string
	DataVolumePath   string

	// Database (for indexer)
	DatabaseURL      string

	// Heartbeat
	HeartbeatInterval time.Duration
	HeartbeatCount   int

	// Resources
	MaxCPUCores      float64
	MaxRAMGiB        float64
	MaxVRAMGiB       float64
	MockGPU          bool

	// Logging
	LogLevel         string
}

// Load reads configuration from environment variables
func Load() (*Config, error) {
	_ = godotenv.Load(".env")
	_ = godotenv.Load("/etc/dicompute/daemon.env")

	cfg := &Config{
		RPCURL:            getEnv("RPC_URL", "https://erpc.apothem.network"),
		ChainID:           getEnvInt64("CHAIN_ID", 51),
		JobEscrowAddress:  getEnv("JOB_ESCROW_ADDRESS", ""),
		PrivateKey:        getEnv("PROVIDER_PRIVATE_KEY", ""),
		BackendURL:        getEnv("BACKEND_URL", "http://localhost:8000"),
		BackendAPIKey:     getEnv("BACKEND_API_KEY", ""),
		PollInterval:      getEnvDuration("POLL_INTERVAL", 5*time.Second),
		DockerHost:        getEnv("DOCKER_HOST", "unix:///var/run/docker.sock"),
		DockerNetwork:     getEnv("DOCKER_NETWORK", "dicompute"),
		DataVolumePath:    getEnv("DATA_VOLUME_PATH", "/var/lib/dicompute/data"),
		DatabaseURL:       getEnv("DATABASE_URL", "postgres://dicompute:dicompute@localhost:5432/dicompute?sslmode=disable"),
		HeartbeatInterval: getEnvDuration("HEARTBEAT_INTERVAL", 30*time.Second),
		HeartbeatCount:    getEnvInt("HEARTBEAT_COUNT", 6),
		MaxCPUCores:       getEnvFloat64("MAX_CPU_CORES", 8),
		MaxRAMGiB:         getEnvFloat64("MAX_RAM_GIB", 32),
		MaxVRAMGiB:        getEnvFloat64("MAX_VRAM_GIB", 16),
		MockGPU:           getEnv("MOCK_GPU", "") == "true",
		LogLevel:          getEnv("LOG_LEVEL", "info"),
	}

	if cfg.PrivateKey == "" {
		return nil, fmt.Errorf("PROVIDER_PRIVATE_KEY is required")
	}

	return cfg, nil
}

func getEnv(key, defaultValue string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if v := os.Getenv(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return defaultValue
}

func getEnvInt64(key string, defaultValue int64) int64 {
	if v := os.Getenv(key); v != "" {
		if i, err := strconv.ParseInt(v, 10, 64); err == nil {
			return i
		}
	}
	return defaultValue
}

func getEnvFloat64(key string, defaultValue float64) float64 {
	if v := os.Getenv(key); v != "" {
		if f, err := strconv.ParseFloat(v, 64); err == nil {
			return f
		}
	}
	return defaultValue
}

func getEnvDuration(key string, defaultValue time.Duration) time.Duration {
	if v := os.Getenv(key); v != "" {
		if d, err := time.ParseDuration(v); err == nil {
			return d
		}
	}
	return defaultValue
}
