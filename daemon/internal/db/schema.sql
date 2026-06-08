-- DICOMPUTE Event Indexer Schema
-- Run this to initialize PostgreSQL for the daemon

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
