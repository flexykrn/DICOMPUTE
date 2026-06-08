package db

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

// EventStore handles PostgreSQL operations for indexed events
type EventStore struct {
	pool   *pgxpool.Pool
	logger *zap.Logger
}

// NewEventStore creates a new event store
func NewEventStore(databaseURL string, logger *zap.Logger) (*EventStore, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse database URL: %w", err)
	}

	config.MaxConns = 10
	config.MinConns = 2
	config.MaxConnLifetime = time.Hour

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	// Test connection
	if err := pool.Ping(context.Background()); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &EventStore{
		pool:   pool,
		logger: logger,
	}, nil
}

// Close closes the database connection
func (es *EventStore) Close() {
	es.pool.Close()
}

// SaveEvent stores an indexed event
func (es *EventStore) SaveEvent(ctx context.Context, eventType string, jobID *uint64, userAddr, providerAddr string, blockNumber uint64, txHash string, logIndex int, payload map[string]interface{}) error {
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	query := `
		INSERT INTO indexed_events (event_type, job_id, user_address, provider_address, block_number, tx_hash, log_index, payload)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`

	_, err = es.pool.Exec(ctx, query, eventType, jobID, userAddr, providerAddr, blockNumber, txHash, logIndex, payloadJSON)
	if err != nil {
		return fmt.Errorf("failed to insert event: %w", err)
	}

	es.logger.Debug("event saved",
		zap.String("type", eventType),
		zap.Uint64("block", blockNumber),
	)

	return nil
}

// GetLastBlock returns the last indexed block
func (es *EventStore) GetLastBlock(ctx context.Context) (uint64, error) {
	var lastBlock uint64
	err := es.pool.QueryRow(ctx, "SELECT last_block FROM indexer_state WHERE id = 1").Scan(&lastBlock)
	if err != nil {
		return 0, fmt.Errorf("failed to get last block: %w", err)
	}
	return lastBlock, nil
}

// UpdateLastBlock updates the last indexed block
func (es *EventStore) UpdateLastBlock(ctx context.Context, blockNumber uint64) error {
	_, err := es.pool.Exec(ctx,
		"UPDATE indexer_state SET last_block = $1, updated_at = NOW() WHERE id = 1",
		blockNumber,
	)
	if err != nil {
		return fmt.Errorf("failed to update last block: %w", err)
	}
	return nil
}

// GetEventsByJob returns all events for a job
func (es *EventStore) GetEventsByJob(ctx context.Context, jobID uint64) ([]EventRecord, error) {
	rows, err := es.pool.Query(ctx,
		"SELECT id, event_type, job_id, user_address, provider_address, block_number, tx_hash, payload, created_at FROM indexed_events WHERE job_id = $1 ORDER BY block_number",
		jobID,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to query events: %w", err)
	}
	defer rows.Close()

	return pgx.CollectRows(rows, pgx.RowToStructByName[EventRecord])
}

// GetRecentEvents returns recent events with pagination
func (es *EventStore) GetRecentEvents(ctx context.Context, eventType string, limit, offset int) ([]EventRecord, error) {
	rows, err := es.pool.Query(ctx,
		"SELECT id, event_type, job_id, user_address, provider_address, block_number, tx_hash, payload, created_at FROM indexed_events WHERE event_type = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
		eventType, limit, offset,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to query events: %w", err)
	}
	defer rows.Close()

	return pgx.CollectRows(rows, pgx.RowToStructByName[EventRecord])
}

// EventRecord represents a stored event
type EventRecord struct {
	ID               int64     `db:"id"`
	EventType        string    `db:"event_type"`
	JobID            *uint64   `db:"job_id"`
	UserAddress      string    `db:"user_address"`
	ProviderAddress  string    `db:"provider_address"`
	BlockNumber      uint64    `db:"block_number"`
	TxHash           string    `db:"tx_hash"`
	Payload          []byte    `db:"payload"`
	CreatedAt        time.Time `db:"created_at"`
}

// InitializeSchema creates tables if they don't exist
func (es *EventStore) InitializeSchema(ctx context.Context) error {
	schema := `
	CREATE TABLE IF NOT EXISTS indexed_events (
		id              SERIAL PRIMARY KEY,
		event_type      VARCHAR(50) NOT NULL,
		job_id          BIGINT,
		user_address    VARCHAR(42),
		provider_address VARCHAR(42),
		block_number    BIGINT NOT NULL,
		tx_hash         VARCHAR(66),
		log_index       INTEGER,
		payload         JSONB,
		created_at      TIMESTAMP DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_events_type ON indexed_events(event_type);
	CREATE INDEX IF NOT EXISTS idx_events_job_id ON indexed_events(job_id);
	CREATE INDEX IF NOT EXISTS idx_events_block ON indexed_events(block_number);
	CREATE INDEX IF NOT EXISTS idx_events_created ON indexed_events(created_at);

	CREATE TABLE IF NOT EXISTS indexer_state (
		id              INTEGER PRIMARY KEY DEFAULT 1,
		last_block      BIGINT NOT NULL DEFAULT 0,
		chain_id        BIGINT NOT NULL,
		updated_at      TIMESTAMP DEFAULT NOW()
	);

	INSERT INTO indexer_state (id, last_block, chain_id)
	VALUES (1, 0, 51)
	ON CONFLICT (id) DO NOTHING;
	`

	_, err := es.pool.Exec(ctx, schema)
	if err != nil {
		return fmt.Errorf("failed to initialize schema: %w", err)
	}

	es.logger.Info("database schema initialized")
	return nil
}
