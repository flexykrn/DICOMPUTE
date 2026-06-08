package watcher

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"go.uber.org/zap"

	"github.com/flexykrn/dicompute/daemon/internal/models"
)

// BackendClient polls M2's backend API for job assignments
type BackendClient struct {
	baseURL    string
	apiKey     string
	httpClient *http.Client
	logger     *zap.Logger
}

// NewBackendClient creates a new backend API client
func NewBackendClient(baseURL, apiKey string, logger *zap.Logger) *BackendClient {
	return &BackendClient{
		baseURL: baseURL,
		apiKey:  apiKey,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		logger: logger,
	}
}

// JobAssignment represents a job from the backend API
type JobAssignment struct {
	ID              int             `json:"id"`
	ChainJobID      int             `json:"chain_job_id"`
	UserAddress     string          `json:"user_address"`
	DockerURI       string          `json:"docker_uri"`
	CPUMilli        int             `json:"cpu_milli"`
	RAMMiB          int             `json:"ram_mib"`
	VRAMMiB         int             `json:"vram_mib"`
	DurationBlocks  int             `json:"duration_blocks"`
	MaxPricePerBlock string         `json:"max_price_per_block"`
	Deposit         string          `json:"deposit"`
	State           string          `json:"state"`
	CreatedAt       string          `json:"created_at"`
}

// GetPendingAssignments fetches pending job assignments from the backend
func (bc *BackendClient) GetPendingAssignments(ctx context.Context) ([]JobAssignment, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", bc.baseURL+"/api/jobs/pending", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+bc.apiKey)
	req.Header.Set("Accept", "application/json")

	resp, err := bc.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch assignments: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNoContent {
		return nil, nil
	}

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("backend returned %d: %s", resp.StatusCode, string(body))
	}

	var assignments []JobAssignment
	if err := json.NewDecoder(resp.Body).Decode(&assignments); err != nil {
		return nil, fmt.Errorf("failed to decode assignments: %w", err)
	}

	return assignments, nil
}

// ReportJobStatus reports job status updates to the backend
func (bc *BackendClient) ReportJobStatus(ctx context.Context, jobID uint64, state models.JobState, containerID string, logs string) error {
	payload := map[string]interface{}{
		"job_id":       jobID,
		"state":        string(state),
		"container_id": containerID,
		"logs":         logs,
		"timestamp":    time.Now().UTC(),
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal status: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", bc.baseURL+"/api/jobs/"+fmt.Sprintf("%d", jobID)+"/status", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+bc.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := bc.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to report status: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusAccepted {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("backend returned %d: %s", resp.StatusCode, string(respBody))
	}

	return nil
}

// SubmitResult submits job results to the backend
func (bc *BackendClient) SubmitResult(ctx context.Context, jobID uint64, resultCID string, instructionCount uint64) error {
	payload := map[string]interface{}{
		"job_id":            jobID,
		"result_cid":        resultCID,
		"instruction_count": instructionCount,
		"timestamp":         time.Now().UTC(),
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal result: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", bc.baseURL+"/api/jobs/"+fmt.Sprintf("%d", jobID)+"/result", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+bc.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := bc.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to submit result: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusAccepted {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("backend returned %d: %s", resp.StatusCode, string(respBody))
	}

	return nil
}

// Watcher continuously polls for new job assignments
type Watcher struct {
	client       *BackendClient
	pollInterval time.Duration
	logger       *zap.Logger
	handlers     []AssignmentHandler
}

// AssignmentHandler is called when a new job assignment is received
type AssignmentHandler func(ctx context.Context, assignment JobAssignment) error

// NewWatcher creates a new job watcher
func NewWatcher(client *BackendClient, pollInterval time.Duration, logger *zap.Logger) *Watcher {
	return &Watcher{
		client:       client,
		pollInterval: pollInterval,
		logger:       logger,
		handlers:     make([]AssignmentHandler, 0),
	}
}

// RegisterHandler adds a handler for new assignments
func (w *Watcher) RegisterHandler(handler AssignmentHandler) {
	w.handlers = append(w.handlers, handler)
}

// Start begins polling for assignments
func (w *Watcher) Start(ctx context.Context) error {
	w.logger.Info("starting job watcher", zap.Duration("interval", w.pollInterval))

	ticker := time.NewTicker(w.pollInterval)
	defer ticker.Stop()

	// Immediate first poll
	w.poll(ctx)

	for {
		select {
		case <-ctx.Done():
			w.logger.Info("watcher stopped")
			return ctx.Err()
		case <-ticker.C:
			w.poll(ctx)
		}
	}
}

func (w *Watcher) poll(ctx context.Context) {
	assignments, err := w.client.GetPendingAssignments(ctx)
	if err != nil {
		w.logger.Warn("failed to fetch assignments", zap.Error(err))
		return
	}

	if len(assignments) == 0 {
		return
	}

	w.logger.Info("new assignments received", zap.Int("count", len(assignments)))

	for _, assignment := range assignments {
		for _, handler := range w.handlers {
			if err := handler(ctx, assignment); err != nil {
				w.logger.Error("handler failed",
					zap.Int("job_id", assignment.ID),
					zap.Error(err),
				)
			}
		}
	}
}
