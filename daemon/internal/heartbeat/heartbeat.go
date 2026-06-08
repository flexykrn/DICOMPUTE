package heartbeat

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/math"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/signer/core/apitypes"
	"go.uber.org/zap"

	"github.com/flexykrn/dicompute/daemon/internal/models"
)

// Generator creates and signs EIP-712 heartbeat messages
type Generator struct {
	privateKey    string
	providerAddr  common.Address
	chainID       int64
	jobEscrowAddr common.Address
	logger        *zap.Logger
}

// NewGenerator creates a new heartbeat generator
func NewGenerator(privateKey string, providerAddr common.Address, chainID int64, jobEscrowAddr common.Address, logger *zap.Logger) *Generator {
	return &Generator{
		privateKey:    privateKey,
		providerAddr:  providerAddr,
		chainID:       chainID,
		jobEscrowAddr: jobEscrowAddr,
		logger:        logger,
	}
}

// GenerateHeartbeat creates a signed EIP-712 heartbeat
func (g *Generator) GenerateHeartbeat(jobID, blockNumber, uptimeSeconds uint64, cpuPercent, ramPercent, vramPercent float64) (*models.HeartbeatResponse, error) {
	timestamp := uint64(time.Now().Unix())

	// Convert percentages to uint64 (multiply by 100 for 2 decimal precision)
	cpuUint := uint64(cpuPercent * 100)
	ramUint := uint64(ramPercent * 100)
	vramUint := uint64(vramPercent * 100)

	// Build EIP-712 typed data
	typedData := apitypes.TypedData{
		Types: apitypes.Types{
			"EIP712Domain": []apitypes.Type{
				{Name: "name", Type: "string"},
				{Name: "version", Type: "string"},
				{Name: "chainId", Type: "uint256"},
				{Name: "verifyingContract", Type: "address"},
			},
			"Heartbeat": []apitypes.Type{
				{Name: "jobId", Type: "uint256"},
				{Name: "blockNumber", Type: "uint256"},
				{Name: "uptimeSeconds", Type: "uint256"},
				{Name: "cpuPercent", Type: "uint256"},
				{Name: "ramPercent", Type: "uint256"},
				{Name: "vramPercent", Type: "uint256"},
				{Name: "timestamp", Type: "uint256"},
			},
		},
		PrimaryType: "Heartbeat",
		Domain: apitypes.TypedDataDomain{
			Name:              "DICOMPUTE",
			Version:           "1",
			ChainId:           (*math.HexOrDecimal256)(big.NewInt(g.chainID)),
			VerifyingContract: g.jobEscrowAddr.Hex(),
		},
		Message: apitypes.TypedDataMessage{
			"jobId":         fmt.Sprintf("%d", jobID),
			"blockNumber":   fmt.Sprintf("%d", blockNumber),
			"uptimeSeconds": fmt.Sprintf("%d", uptimeSeconds),
			"cpuPercent":    fmt.Sprintf("%d", cpuUint),
			"ramPercent":    fmt.Sprintf("%d", ramUint),
			"vramPercent":   fmt.Sprintf("%d", vramUint),
			"timestamp":     fmt.Sprintf("%d", timestamp),
		},
	}

	// Sign the typed data
	signature, err := g.signTypedData(typedData)
	if err != nil {
		return nil, fmt.Errorf("failed to sign heartbeat: %w", err)
	}

	return &models.HeartbeatResponse{
		JobID:         jobID,
		BlockNumber:   blockNumber,
		UptimeSeconds: uptimeSeconds,
		CPUPercent:    cpuPercent,
		RAMPercent:    ramPercent,
		VRAMPercent:   vramPercent,
		Timestamp:     time.Unix(int64(timestamp), 0),
		Signature:     signature,
	}, nil
}

func (g *Generator) signTypedData(typedData apitypes.TypedData) (string, error) {
	// Remove 0x prefix if present
	keyHex := g.privateKey
	if len(keyHex) > 2 && keyHex[:2] == "0x" {
		keyHex = keyHex[2:]
	}

	privateKey, err := crypto.HexToECDSA(keyHex)
	if err != nil {
		return "", fmt.Errorf("invalid private key: %w", err)
	}

	// Hash the typed data according to EIP-712
	domainSeparator, err := typedData.HashStruct("EIP712Domain", typedData.Domain.Map())
	if err != nil {
		return "", fmt.Errorf("failed to hash domain: %w", err)
	}

	typedDataHash, err := typedData.HashStruct(typedData.PrimaryType, typedData.Message)
	if err != nil {
		return "", fmt.Errorf("failed to hash message: %w", err)
	}

	// Final digest: keccak256("\x19\x01" || domainSeparator || structHash)
	rawData := []byte(fmt.Sprintf("\x19\x01%s%s", string(domainSeparator), string(typedDataHash)))
	digest := crypto.Keccak256Hash(rawData)

	// Sign
	signature, err := crypto.Sign(digest.Bytes(), privateKey)
	if err != nil {
		return "", fmt.Errorf("failed to sign: %w", err)
	}

	// Adjust V value for Ethereum (add 27)
	signature[64] += 27

	return fmt.Sprintf("0x%x", signature), nil
}

// Sender transmits heartbeats to M2's backend
type Sender struct {
	backendURL string
	apiKey     string
	logger     *zap.Logger
}

// NewSender creates a new heartbeat sender
func NewSender(backendURL, apiKey string, logger *zap.Logger) *Sender {
	return &Sender{
		backendURL: backendURL,
		apiKey:     apiKey,
		logger:     logger,
	}
}

// Send transmits a heartbeat to the backend API
func (s *Sender) Send(ctx context.Context, heartbeat *models.HeartbeatResponse) error {
	body, err := json.Marshal(heartbeat)
	if err != nil {
		return fmt.Errorf("failed to marshal heartbeat: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", s.backendURL+"/api/jobs/"+fmt.Sprintf("%d", heartbeat.JobID)+"/heartbeat", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send heartbeat: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusAccepted {
		return fmt.Errorf("backend returned %d", resp.StatusCode)
	}

	s.logger.Debug("heartbeat sent",
		zap.Uint64("job_id", heartbeat.JobID),
		zap.Uint64("block_number", heartbeat.BlockNumber),
	)

	return nil
}
