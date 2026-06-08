package indexer

import (
	"context"
	"fmt"
	"math/big"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"go.uber.org/zap"

	"github.com/flexykrn/dicompute/daemon/internal/db"
)

// EventIndexer reads blockchain events and indexes them into PostgreSQL
type EventIndexer struct {
	client        *ethclient.Client
	jobEscrowAddr common.Address
	jobEscrowABI  abi.ABI
	store         *db.EventStore
	broadcast     func(event string, data interface{})
	lastBlock     uint64
	logger        *zap.Logger
}

// NewEventIndexer creates a new event indexer
func NewEventIndexer(rpcURL string, jobEscrowAddr string, store *db.EventStore, logger *zap.Logger) (*EventIndexer, error) {
	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to RPC: %w", err)
	}

	jobEscrowABI, err := abi.JSON(strings.NewReader(jobEscrowABIJSON))
	if err != nil {
		return nil, fmt.Errorf("failed to parse ABI: %w", err)
	}

	return &EventIndexer{
		client:        client,
		jobEscrowAddr: common.HexToAddress(jobEscrowAddr),
		jobEscrowABI:  jobEscrowABI,
		store:         store,
		logger:        logger,
	}, nil
}

// SetBroadcastFunc sets the broadcast function for WebSocket
func (ei *EventIndexer) SetBroadcastFunc(fn func(event string, data interface{})) {
	ei.broadcast = fn
}

// Start begins indexing events from the blockchain
func (ei *EventIndexer) Start(ctx context.Context, pollInterval time.Duration) error {
	ei.logger.Info("starting event indexer", zap.String("address", ei.jobEscrowAddr.Hex()))

	// Load last block from DB if available
	if ei.store != nil {
		lastBlock, err := ei.store.GetLastBlock(ctx)
		if err == nil && lastBlock > 0 {
			ei.lastBlock = lastBlock
			ei.logger.Info("resumed from last block", zap.Uint64("block", lastBlock))
		} else {
			// Get current block as starting point
			header, err := ei.client.HeaderByNumber(ctx, nil)
			if err != nil {
				return fmt.Errorf("failed to get current block: %w", err)
			}
			ei.lastBlock = header.Number.Uint64()
		}
	} else {
		header, err := ei.client.HeaderByNumber(ctx, nil)
		if err != nil {
			return fmt.Errorf("failed to get current block: %w", err)
		}
		ei.lastBlock = header.Number.Uint64()
	}

	ticker := time.NewTicker(pollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
			if err := ei.pollEvents(ctx); err != nil {
				ei.logger.Warn("failed to poll events", zap.Error(err))
			}
		}
	}
}

func (ei *EventIndexer) pollEvents(ctx context.Context) error {
	currentBlock, err := ei.client.BlockNumber(ctx)
	if err != nil {
		return fmt.Errorf("failed to get block number: %w", err)
	}

	if currentBlock <= ei.lastBlock {
		return nil
	}

	// Limit batch size to avoid RPC timeouts
	batchEnd := currentBlock
	if batchEnd-ei.lastBlock > 1000 {
		batchEnd = ei.lastBlock + 1000
	}

	query := ethereum.FilterQuery{
		FromBlock: big.NewInt(int64(ei.lastBlock + 1)),
		ToBlock:   big.NewInt(int64(batchEnd)),
		Addresses: []common.Address{ei.jobEscrowAddr},
		Topics: [][]common.Hash{
			{
				ei.jobEscrowABI.Events["JobSubmitted"].ID,
				ei.jobEscrowABI.Events["JobClaimed"].ID,
				ei.jobEscrowABI.Events["HeartbeatReceived"].ID,
				ei.jobEscrowABI.Events["JobCompleted"].ID,
			},
		},
	}

	logs, err := ei.client.FilterLogs(ctx, query)
	if err != nil {
		return fmt.Errorf("failed to filter logs: %w", err)
	}

	for _, log := range logs {
		ei.processLog(ctx, log)
	}

	ei.lastBlock = batchEnd

	// Update last block in DB
	if ei.store != nil {
		if err := ei.store.UpdateLastBlock(ctx, ei.lastBlock); err != nil {
			ei.logger.Warn("failed to update last block", zap.Error(err))
		}
	}

	return nil
}

func (ei *EventIndexer) processLog(ctx context.Context, log types.Log) {
	if len(log.Topics) == 0 {
		return
	}

	eventID := log.Topics[0]

	switch {
	case eventID == ei.jobEscrowABI.Events["JobSubmitted"].ID:
		ei.handleJobSubmitted(ctx, log)
	case eventID == ei.jobEscrowABI.Events["JobClaimed"].ID:
		ei.handleJobClaimed(ctx, log)
	case eventID == ei.jobEscrowABI.Events["HeartbeatReceived"].ID:
		ei.handleHeartbeatReceived(ctx, log)
	case eventID == ei.jobEscrowABI.Events["JobCompleted"].ID:
		ei.handleJobCompleted(ctx, log)
	}
}

func (ei *EventIndexer) handleJobSubmitted(ctx context.Context, log types.Log) {
	jobId := log.Topics[1].Big().Uint64()
	user := common.HexToAddress(log.Topics[2].Hex())

	ei.logger.Info("indexed JobSubmitted",
		zap.Uint64("job_id", jobId),
		zap.String("user", user.Hex()),
		zap.Uint64("block", log.BlockNumber),
	)

	payload := map[string]interface{}{
		"user":   user.Hex(),
		"block":  log.BlockNumber,
		"txHash": log.TxHash.Hex(),
	}

	if ei.store != nil {
		if err := ei.store.SaveEvent(ctx, "JobSubmitted", &jobId, user.Hex(), "", log.BlockNumber, log.TxHash.Hex(), int(log.Index), payload); err != nil {
			ei.logger.Warn("failed to save event", zap.Error(err))
		}
	}

	if ei.broadcast != nil {
		ei.broadcast("job.submitted", map[string]interface{}{
			"job_id": jobId,
			"user":   user.Hex(),
			"block":  log.BlockNumber,
		})
	}
}

func (ei *EventIndexer) handleJobClaimed(ctx context.Context, log types.Log) {
	jobId := log.Topics[1].Big().Uint64()
	provider := common.HexToAddress(log.Topics[2].Hex())

	ei.logger.Info("indexed JobClaimed",
		zap.Uint64("job_id", jobId),
		zap.String("provider", provider.Hex()),
		zap.Uint64("block", log.BlockNumber),
	)

	payload := map[string]interface{}{
		"provider": provider.Hex(),
		"block":    log.BlockNumber,
		"txHash":   log.TxHash.Hex(),
	}

	if ei.store != nil {
		if err := ei.store.SaveEvent(ctx, "JobClaimed", &jobId, "", provider.Hex(), log.BlockNumber, log.TxHash.Hex(), int(log.Index), payload); err != nil {
			ei.logger.Warn("failed to save event", zap.Error(err))
		}
	}

	if ei.broadcast != nil {
		ei.broadcast("job.claimed", map[string]interface{}{
			"job_id":   jobId,
			"provider": provider.Hex(),
			"block":    log.BlockNumber,
		})
	}
}

func (ei *EventIndexer) handleHeartbeatReceived(ctx context.Context, log types.Log) {
	jobId := log.Topics[1].Big().Uint64()

	ei.logger.Info("indexed HeartbeatReceived",
		zap.Uint64("job_id", jobId),
		zap.Uint64("block", log.BlockNumber),
	)

	payload := map[string]interface{}{
		"block":  log.BlockNumber,
		"txHash": log.TxHash.Hex(),
	}

	if ei.store != nil {
		if err := ei.store.SaveEvent(ctx, "HeartbeatReceived", &jobId, "", "", log.BlockNumber, log.TxHash.Hex(), int(log.Index), payload); err != nil {
			ei.logger.Warn("failed to save event", zap.Error(err))
		}
	}

	if ei.broadcast != nil {
		ei.broadcast("heartbeat.received", map[string]interface{}{
			"job_id": jobId,
			"block":  log.BlockNumber,
		})
	}
}

func (ei *EventIndexer) handleJobCompleted(ctx context.Context, log types.Log) {
	jobId := log.Topics[1].Big().Uint64()
	provider := common.HexToAddress(log.Topics[2].Hex())

	ei.logger.Info("indexed JobCompleted",
		zap.Uint64("job_id", jobId),
		zap.String("provider", provider.Hex()),
		zap.Uint64("block", log.BlockNumber),
	)

	payload := map[string]interface{}{
		"provider": provider.Hex(),
		"block":    log.BlockNumber,
		"txHash":   log.TxHash.Hex(),
	}

	if ei.store != nil {
		if err := ei.store.SaveEvent(ctx, "JobCompleted", &jobId, "", provider.Hex(), log.BlockNumber, log.TxHash.Hex(), int(log.Index), payload); err != nil {
			ei.logger.Warn("failed to save event", zap.Error(err))
		}
	}

	if ei.broadcast != nil {
		ei.broadcast("job.completed", map[string]interface{}{
			"job_id":   jobId,
			"provider": provider.Hex(),
			"block":    log.BlockNumber,
		})
	}
}

// Minimal ABI JSON for event parsing
const jobEscrowABIJSON = `[
	{
		"anonymous": false,
		"inputs": [
			{"indexed": true, "name": "jobId", "type": "uint256"},
			{"indexed": true, "name": "user", "type": "address"},
			{"indexed": false, "name": "deposit", "type": "uint256"}
		],
		"name": "JobSubmitted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{"indexed": true, "name": "jobId", "type": "uint256"},
			{"indexed": true, "name": "provider", "type": "address"},
			{"indexed": false, "name": "startedAt", "type": "uint256"}
		],
		"name": "JobClaimed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{"indexed": true, "name": "jobId", "type": "uint256"},
			{"indexed": false, "name": "blockNumber", "type": "uint256"},
			{"indexed": false, "name": "uptimeSeconds", "type": "uint256"}
		],
		"name": "HeartbeatReceived",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{"indexed": true, "name": "jobId", "type": "uint256"},
			{"indexed": true, "name": "provider", "type": "address"},
			{"indexed": false, "name": "payout", "type": "uint256"}
		],
		"name": "JobCompleted",
		"type": "event"
	}
]`
