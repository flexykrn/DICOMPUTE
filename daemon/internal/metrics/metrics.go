package metrics

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"runtime"
	"time"

	"go.uber.org/zap"
)

// Server provides /metrics and /health endpoints
type Server struct {
	logger     *zap.Logger
	startTime  time.Time
	port       int
	wsClients  func() int
	jobCount   func() int
	activeJobs func() int
}

// NewServer creates a metrics server
func NewServer(port int, logger *zap.Logger) *Server {
	return &Server{
		logger:    logger,
		startTime: time.Now(),
		port:      port,
	}
}

// SetProviders sets callback functions for dynamic metrics
func (s *Server) SetProviders(wsClients, jobCount, activeJobs func() int) {
	s.wsClients = wsClients
	s.jobCount = jobCount
	s.activeJobs = activeJobs
}

// Start begins serving metrics
func (s *Server) Start(ctx context.Context) error {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", s.handleHealth)
	mux.HandleFunc("/metrics", s.handleMetrics)
	mux.HandleFunc("/ready", s.handleReady)

	server := &http.Server{
		Addr:    fmt.Sprintf(":%d", s.port),
		Handler: mux,
	}

	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		server.Shutdown(shutdownCtx)
	}()

	s.logger.Info("metrics server starting", zap.Int("port", s.port))
	return server.ListenAndServe()
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)

	response := map[string]interface{}{
		"status":      "healthy",
		"uptime":      time.Since(s.startTime).String(),
		"goroutines":  runtime.NumGoroutine(),
		"memory_mb":   memStats.Alloc / 1024 / 1024,
		"timestamp":   time.Now().UTC(),
	}

	if s.wsClients != nil {
		response["ws_clients"] = s.wsClients()
	}
	if s.activeJobs != nil {
		response["active_jobs"] = s.activeJobs()
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (s *Server) handleMetrics(w http.ResponseWriter, r *http.Request) {
	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)

	response := map[string]interface{}{
		"daemon": map[string]interface{}{
			"uptime_seconds": time.Since(s.startTime).Seconds(),
			"goroutines":     runtime.NumGoroutine(),
			"memory": map[string]interface{}{
				"alloc_mb":       memStats.Alloc / 1024 / 1024,
				"total_alloc_mb": memStats.TotalAlloc / 1024 / 1024,
				"sys_mb":         memStats.Sys / 1024 / 1024,
				"gc_count":       memStats.NumGC,
			},
		},
	}

	if s.wsClients != nil {
		response["websocket_clients"] = s.wsClients()
	}
	if s.jobCount != nil {
		response["total_jobs"] = s.jobCount()
	}
	if s.activeJobs != nil {
		response["active_jobs"] = s.activeJobs()
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (s *Server) handleReady(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"ready":     true,
		"timestamp": time.Now().UTC(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
