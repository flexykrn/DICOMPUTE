package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

// MockBackend simulates M2's backend API for local testing
type MockBackend struct {
	jobs      map[uint64]*JobRecord
	heartbeats map[uint64][]HeartbeatRecord
	mu        sync.RWMutex
	jobCounter uint64
}

type JobRecord struct {
	ID            uint64    `json:"id"`
	State         string    `json:"state"`
	ContainerID   string    `json:"container_id,omitempty"`
	ResultCID     string    `json:"result_cid,omitempty"`
	Logs          string    `json:"logs,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}

type HeartbeatRecord struct {
	JobID         uint64    `json:"job_id"`
	BlockNumber   uint64    `json:"block_number"`
	UptimeSeconds uint64    `json:"uptime_seconds"`
	CPUPercent    float64   `json:"cpu_percent"`
	RAMPercent    float64   `json:"ram_percent"`
	VRAMPercent   float64   `json:"vram_percent"`
	Timestamp     time.Time `json:"timestamp"`
	Signature     string    `json:"signature"`
}

func NewMockBackend() *MockBackend {
	mb := &MockBackend{
		jobs:       make(map[uint64]*JobRecord),
		heartbeats: make(map[uint64][]HeartbeatRecord),
	}

	// Pre-create a demo job that will be assigned after 5 seconds
	go mb.createDemoJob()

	return mb
}

func (mb *MockBackend) createDemoJob() {
	time.Sleep(5 * time.Second)
	mb.mu.Lock()
	defer mb.mu.Unlock()

	mb.jobCounter++
	jobID := mb.jobCounter
	mb.jobs[jobID] = &JobRecord{
		ID:        jobID,
		State:     "pending",
		CreatedAt: time.Now(),
	}

	fmt.Printf("\033[92m[MOCK BACKEND] Created demo job %d\033[0m\n", jobID)
	fmt.Printf("\033[94m[MOCK BACKEND] Job will be available at /api/provider/assignments/pending\033[0m\n")
}

func (mb *MockBackend) handlePendingAssignments(w http.ResponseWriter, r *http.Request) {
	mb.mu.RLock()
	defer mb.mu.RUnlock()

	var assignments []map[string]interface{}
	for id, job := range mb.jobs {
		if job.State == "pending" {
			assignments = append(assignments, map[string]interface{}{
				"job_id":        id,
				"chain_job_id":  id,
				"user_address":  "0xDemoUser1234567890abcdef",
				"spec": map[string]interface{}{
					"docker_uri":          "nginx:alpine",
					"cpu_milli":           2000,
					"ram_mib":             4096,
					"vram_mib":            0,
					"duration_blocks":     100,
					"max_price_per_block": 1000000000000000,
				},
				"deposit":     100000000000000000,
				"assigned_at": time.Now(),
				"input_cid":   "QmDemoInputCID123",
			})
			// Mark as assigned so it's not returned again
			job.State = "assigned"
		}
	}

	if len(assignments) == 0 {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(assignments)
}

func (mb *MockBackend) handleHeartbeat(w http.ResponseWriter, r *http.Request) {
	var hb HeartbeatRecord
	if err := json.NewDecoder(r.Body).Decode(&hb); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	mb.mu.Lock()
	defer mb.mu.Unlock()

	mb.heartbeats[hb.JobID] = append(mb.heartbeats[hb.JobID], hb)

	fmt.Printf("\033[94m[MOCK BACKEND] Heartbeat received for job %d | CPU: %.1f%% | RAM: %.1f%% | VRAM: %.1f%%\033[0m\n",
		hb.JobID, hb.CPUPercent, hb.RAMPercent, hb.VRAMPercent)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (mb *MockBackend) handleStatus(w http.ResponseWriter, r *http.Request) {
	var update struct {
		JobID       uint64 `json:"job_id"`
		State       string `json:"state"`
		ContainerID string `json:"container_id"`
		Logs        string `json:"logs"`
	}
	if err := json.NewDecoder(r.Body).Decode(&update); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	mb.mu.Lock()
	defer mb.mu.Unlock()

	if job, exists := mb.jobs[update.JobID]; exists {
		job.State = update.State
		job.ContainerID = update.ContainerID
		job.Logs = update.Logs
	}

	fmt.Printf("\033[93m[MOCK BACKEND] Job %d status updated: %s\033[0m\n", update.JobID, update.State)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (mb *MockBackend) handleResult(w http.ResponseWriter, r *http.Request) {
	var result struct {
		JobID            uint64 `json:"job_id"`
		ResultCID        string `json:"result_cid"`
		InstructionCount uint64 `json:"instruction_count"`
	}
	if err := json.NewDecoder(r.Body).Decode(&result); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	mb.mu.Lock()
	defer mb.mu.Unlock()

	if job, exists := mb.jobs[result.JobID]; exists {
		job.ResultCID = result.ResultCID
		job.State = "completed"
	}

	fmt.Printf("\033[92m[MOCK BACKEND] Job %d COMPLETED | Result CID: %s\033[0m\n", result.JobID, result.ResultCID)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (mb *MockBackend) handleGetHeartbeats(w http.ResponseWriter, r *http.Request) {
	mb.mu.RLock()
	defer mb.mu.RUnlock()

	// Extract job_id from URL
	jobID := uint64(1) // Simplified

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(mb.heartbeats[jobID])
}

func main() {
	mb := NewMockBackend()

	http.HandleFunc("/api/provider/assignments/pending", mb.handlePendingAssignments)
	http.HandleFunc("/api/jobs/", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case "POST":
			if len(r.URL.Path) > len("/api/jobs/") {
				suffix := r.URL.Path[len("/api/jobs/"):]
				if len(suffix) > 10 && suffix[len(suffix)-10:] == "/heartbeat" {
					mb.handleHeartbeat(w, r)
					return
				}
				if len(suffix) > 7 && suffix[len(suffix)-7:] == "/status" {
					mb.handleStatus(w, r)
					return
				}
				if len(suffix) > 7 && suffix[len(suffix)-7:] == "/result" {
					mb.handleResult(w, r)
					return
				}
			}
			mb.handleGetHeartbeats(w, r)
		}
	})

	fmt.Println("\033[96m=============================================")
	fmt.Println("  DICOMPUTE Mock Backend Server")
	fmt.Println("  Running on http://localhost:8000")
	fmt.Println("=============================================")
	fmt.Println("  Endpoints:")
	fmt.Println("    GET  /api/provider/assignments/pending")
	fmt.Println("    POST /api/jobs/{id}/heartbeat")
	fmt.Println("    POST /api/jobs/{id}/status")
	fmt.Println("    POST /api/jobs/{id}/result")
	fmt.Println("=============================================")
	fmt.Println("  Demo job will appear in 5 seconds...")
	fmt.Println("=============================================\033[0m")

	if err := http.ListenAndServe(":8000", nil); err != nil {
		fmt.Printf("Server error: %v\n", err)
	}
}
