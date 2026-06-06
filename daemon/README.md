# DICOMPUTE Daemon (M4 — DevOps/Infrastructure)

Go-based provider daemon for DICOMPUTE. Manages Docker containers, generates EIP-712 heartbeats, and indexes blockchain events.

## Architecture

```
daemon/
├── cmd/daemon/           # Entry point
├── internal/
│   ├── config/           # Env config loader
│   ├── provisioner/      # Docker container lifecycle
│   ├── watcher/          # Poll M2 backend for jobs
│   ├── heartbeat/        # EIP-712 heartbeat signing
│   ├── indexer/          # Blockchain event indexer
│   └── models/           # Shared types
├── deployments/          # Docker + Compose
└── scripts/              # Helper scripts
```

## Quick Start

```bash
cd daemon

# 1. Copy env and fill in your keys
cp .env.example .env
# Edit .env with PROVIDER_PRIVATE_KEY, PROVIDER_ADDRESS, BACKEND_URL

# 2. Build
go build ./cmd/daemon

# 3. Run
./daemon
```

## Docker Deployment

```bash
cd deployments
docker-compose up -d
```

## What It Does

1. **Polls M2 backend** every 5s for new job assignments
2. **Pulls Docker image** and creates container with cgroup limits
3. **Starts container** and monitors health
4. **Sends heartbeats** every 30s (EIP-712 signed, sent to M2 backend)
5. **Stops container** after N heartbeats
6. **Submits result** CID to backend
7. **Indexes events** from blockchain (read-only)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| PROVIDER_PRIVATE_KEY | Yes | Wallet private key for signing |
| PROVIDER_ADDRESS | Yes | Provider wallet address |
| BACKEND_URL | Yes | M2 backend API URL |
| BACKEND_API_KEY | Yes | API auth key |
| RPC_URL | No | Blockchain RPC for indexer |
| JOB_ESCROW_ADDRESS | No | Contract address for indexer |
| DOCKER_HOST | No | Docker socket path |
| HEARTBEAT_INTERVAL | No | Default 30s |
| HEARTBEAT_COUNT | No | Default 6 |

## Integration Points

- **M2 Backend**: `GET /api/provider/assignments/pending`, `POST /api/jobs/{id}/heartbeat`, `POST /api/jobs/{id}/status`
- **Docker Engine**: Local socket or remote host
- **Blockchain**: Read-only event indexing via RPC
