# DICOMPUTE — Project Documentation

> **Verifiable GPU Compute on XDC Apothem**
> Decentralized marketplace for GPU-accelerated computing with on-chain proof-of-execution.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Solution Overview](#solution-overview)
4. [Key Innovations](#key-innovations)
5. [Architecture](#architecture)
6. [Tech Stack](#tech-stack)
7. [Smart Contracts](#smart-contracts)
8. [Project Structure](#project-structure)
9. [API Reference](#api-reference)
10. [Setup Instructions](#setup-instructions)
11. [Deployment Guide](#deployment-guide)
12. [End-to-End User Flow](#end-to-end-user-flow)
13. [Security Considerations](#security-considerations)
14. [Future Roadmap](#future-roadmap)
15. [Team](#team)
16. [License](#license)

---

## Executive Summary

DICOMPUTE is a decentralized GPU compute marketplace that enables users to submit Docker-based workloads and have them executed by providers with NVIDIA GPUs. Every execution is cryptographically proven on-chain through heartbeat attestations, and completion is memorialized as a ProofReceipt NFT.

**Live Deployment:**
- Frontend: https://dicompute.onrender.com
- Backend API: https://dicompute-backend.onrender.com
- Blockchain: XDC Apothem Testnet (Chain 51)

**Current Status:** MVP complete with working frontend, backend, smart contracts, and provider daemon. End-to-end flow functional pending provider node activation.

---

## Problem Statement

### The Challenge

Machine Learning researchers, data scientists, and developers require access to powerful GPU resources for training models, running simulations, and performing compute-intensive tasks. The current landscape presents several critical issues:

| Issue | Impact |
|-------|--------|
| **Cloud GPU pricing** | AWS p4d.24xlarge costs $32.77/hour; researchers burn through grants quickly |
| **No execution proof** | You pay for compute but cannot cryptographically verify what was executed |
| **Centralized control** | Single points of failure, censorship risk, vendor lock-in |
| **Underutilized hardware** | Individual GPU owners have idle capacity with no monetization path |
| **Trust assumptions** | Must blindly trust that the provider actually ran your workload |

### Market Context

- Global GPU cloud market: $25B+ (2024), growing 25% annually
- AI/ML training costs increasing 10x every 2 years
- Individual GPU owners (gamers, miners) have $10B+ in idle hardware
- No existing solution provides cryptographic proof-of-compute

### Target Users

| User Type | Pain Point | How DICOMPUTE Helps |
|-----------|-----------|---------------------|
| ML Researchers | Grant money burns fast on cloud GPUs | 60-80% cost reduction with verified execution |
| Data Scientists | Need on-demand compute for experiments | Pay-per-job with no long-term contracts |
| GPU Owners | Hardware sits idle 70% of the time | Passive income by renting spare capacity |
| Hackathon Teams | Need quick, cheap compute for demos | Sub-dollar jobs with instant verification |

---

## Solution Overview

DICOMPUTE is a **decentralized GPU compute marketplace** built on the XDC Apothem testnet (EVM-compatible, 2-second block time, near-zero gas fees).

### Core Value Proposition

1. **Submit** — Define Docker workload, resource requirements, and bounty
2. **Execute** — Provider claims and runs job with GPU passthrough
3. **Prove** — Heartbeat attestations cryptographically verify execution
4. **Verify** — ProofReceipt NFT provides immutable audit trail
5. **Pay** — Smart contract escrow releases funds only on verified completion

### Trust Model

| Mechanism | Purpose |
|-----------|---------|
| Escrow contract | Funds locked until completion or cancellation |
| Provider stake | 0.1 XDC collateral slashed for cheating |
| Heartbeat attestations | EIP-712 signed proofs sent every 30 seconds |
| ProofReceipt NFT | Immutable execution certificate |
| Dispute resolution | Challengers rewarded for catching bad actors |

---

## Key Innovations

### 1. On-Chain Job Escrow

Funds are locked in the JobEscrow contract until the provider submits verified results. This eliminates payment risk for both parties.

```solidity
function submitJob(JobSpec calldata spec, uint256 deposit) 
    external 
    payable 
    returns (uint256 jobId);
```

### 2. EIP-712 Heartbeat Attestations

Providers sign cryptographic attestations every 30 seconds during job execution. These prove the container is running and can be challenged if missing.

```solidity
function heartbeat(uint256 jobId, bytes32 executionHash) 
    external 
    onlyClaimedJob(jobId);
```

### 3. GPU Passthrough with Docker

NVIDIA Container Toolkit enables direct GPU access inside Docker containers. Providers can offer RTX 4090, A100, H100, and other accelerators.

### 4. ProofReceipt NFT

On successful completion, an ERC-721 token is minted to the tenant containing:
- Job specification and parameters
- Execution logs CID (IPFS)
- Provider address and reputation score
- Timestamp and block number

### 5. Slashing Mechanism

Providers who miss heartbeats or fail to complete jobs lose their staked collateral. Challengers who catch bad actors receive the slashed funds as reward.

---

## Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DICOMPUTE ARCHITECTURE                           │
└─────────────────────────────────────────────────────────────────────────┘

  TENANT (User)                    GPU PROVIDER (Teammate)
  ┌─────────────────┐              ┌─────────────────┐
  │  Next.js 14     │ ─submitJob──▶│  Go Daemon      │
  │  Frontend       │              │  + Docker       │
  │  (Render)       │ ◀─completed──│  (Local GPU)    │
  └────────┬────────┘              └────────┬────────┘
           │                                │
           │                                │ claimJob
           │                                │ submitResults
           │                                ▼
           │                         ┌─────────────────┐
           │                         │ XDC Apothem     │
           │                         │ Blockchain      │
           │                         │ Chain 51        │
           │                         └────────┬────────┘
           │                                │
           │                                │ events
           ▼                                ▼
  ┌─────────────────┐              ┌─────────────────┐
  │ FastAPI         │ ◀──indexer───│ Smart Contracts │
  │ Backend         │              │ JobEscrow       │
  │ (Render)        │              │ GPURegistry     │
  └─────────────────┘              │ ProofReceipt    │
                                   └─────────────────┘
```

### Data Flow

```
1. User submits job → MetaMask signs → JobEscrow.submitJob()
2. Contract emits JobSubmitted event
3. Backend indexer captures event → SQLite database
4. Provider daemon detects pending job → claimJob()
5. Docker container starts with GPU passthrough
6. Heartbeat attestations sent every 30s via HTTP
7. Container completes → logs uploaded to IPFS
8. submitResults() called with IPFS CID
9. Contract verifies → mints ProofReceipt NFT → releases payment
```

### Component Responsibilities

| Component | Technology | Role |
|-----------|-----------|------|
| Frontend | Next.js 14, wagmi, RainbowKit | User interface, wallet connection, blockchain interactions |
| Backend | FastAPI, SQLAlchemy, SQLite | REST API, event indexing, job state management |
| Daemon | Go, go-ethereum, Docker SDK | Provider node: claim jobs, execute containers, submit results |
| Contracts | Solidity, Foundry | Escrow, registry, reputation, dispute resolution |

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14 | React framework with App Router |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Utility-first styling |
| shadcn/ui | latest | Accessible UI components |
| wagmi | 2.x | React hooks for Ethereum |
| RainbowKit | 2.x | Wallet connection modal |
| viem | 2.x | Ethereum client |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| FastAPI | 0.110+ | High-performance REST API |
| SQLAlchemy | 2.x | ORM for database |
| SQLite | 3.x | Database (PostgreSQL-ready) |
| Uvicorn | 0.27+ | ASGI server |
| WebSockets | native | Real-time updates |

### Blockchain

| Technology | Version | Purpose |
|------------|---------|---------|
| Solidity | ^0.8.24 | Smart contract language |
| Foundry | latest | Development framework |
| XDC Apothem | Chain 51 | EVM-compatible testnet |
| go-ethereum | latest | Go blockchain client |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| Render | Frontend + backend hosting |
| IPFS (Pinata) | Decentralized file storage |
| Docker | Container runtime |
| NVIDIA Container Toolkit | GPU passthrough |

---

## Smart Contracts

### Deployed Addresses (XDC Apothem Testnet)

| Contract | Address | Purpose |
|----------|---------|---------|
| **JobEscrow** | `0x2Ff9B760510fc0aAd51a59f8aDA62F8B2631a075` | Job lifecycle, escrow, payments |
| **GPURegistry** | `0xCEf0f0E74e618A95Da97e1216F81d74eA01dE77C` | Provider registration and staking |
| **ProofReceipt** | `0xb35EfE4E7071B1c7ce7f00CC7BB667cEc706DBa2` | ERC-721 receipt NFT |
| **DICOToken** | `0xdA08a27339E2EA93AfCe6270c14FA35C1bE48bf4` | Payment token (ERC-20) |
| **ReputationSystem** | `0xf02ac8fDab069bd62B2CE9F53Ea0d09c725880E3` | Provider reputation scores |
| **DisputeResolution** | `0x15076c075c39BD2F1D10dcf5dC9063Ae808ab019` | Challenge and slash mechanism |
| **ComputeMarketplace** | `0xFD0F04eEC204b2cf1Af7f3a6f9145F12B5C78293` | Job discovery and matching |

### Contract Interactions

```
User ──submitJob()──────────▶ JobEscrow
Provider ──registerProvider()──▶ GPURegistry
Provider ──claimJob()─────────▶ JobEscrow
Provider ──heartbeat()────────▶ JobEscrow
Provider ──submitResults()────▶ JobEscrow
JobEscrow ──mint()────────────▶ ProofReceipt
Challenger ──challengeJob()───▶ DisputeResolution
DisputeResolution ──slash()───▶ GPURegistry
```

### JobEscrow.sol

Core contract managing job lifecycle:

```solidity
// Job states: Pending → Active → Completed | Cancelled | Slashed

function submitJob(JobSpec calldata spec, uint256 deposit) 
    external payable returns (uint256 jobId);

function claimJob(uint256 jobId) 
    external onlyRegisteredProvider;

function heartbeat(uint256 jobId, bytes32 executionHash) 
    external onlyClaimedJob(jobId);

function submitResults(uint256 jobId, string calldata resultCID) 
    external onlyClaimedJob(jobId);

function cancelJob(uint256 jobId) 
    external onlyJobOwner(jobId);

function challengeJob(uint256 jobId) 
    external;
```

### GPURegistry.sol

Provider registration and reputation:

```solidity
function registerProvider(string calldata metadataURI) 
    external payable;

function updateProvider(string calldata metadataURI) 
    external onlyRegistered;

function unregisterProvider() 
    external onlyRegistered;
```

### ProofReceipt.sol

Execution certificate NFT:

```solidity
function mint(
    address to,
    uint256 jobId,
    string calldata resultCID,
    uint256 instructionCount
) external onlyJobEscrow;
```

---

## Project Structure

```
DICOMPUTE/
├── client/                          # Next.js 14 Frontend
│   ├── app/                         # App router pages
│   │   ├── page.tsx                 # Landing page with stats
│   │   ├── wizard/                  # Job submission wizard
│   │   ├── marketplace/             # GPU provider listings
│   │   ├── explorer/                # Job explorer with search
│   │   ├── dashboard/               # Network statistics
│   │   ├── provider/                # Provider registration
│   │   └── layout.tsx               # Root layout with providers
│   ├── components/                  # Reusable UI components
│   │   ├── Navigation.tsx           # Top navigation bar
│   │   ├── landing/                 # Landing page sections
│   │   │   ├── StatsBar.tsx
│   │   │   ├── WhyDiCompute.tsx
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── Pricing.tsx
│   │   │   ├── Providers.tsx
│   │   │   ├── UseCases.tsx
│   │   │   ├── ProofReceipt.tsx
│   │   │   ├── CTA.tsx
│   │   │   └── Footer.tsx
│   │   └── ui/                      # shadcn/ui components
│   ├── lib/                         # Utilities and configs
│   │   ├── contracts/               # Contract ABIs and addresses
│   │   │   └── JobEscrow.ts
│   │   └── wagmi.ts                 # Wagmi configuration
│   ├── context/                     # React context providers
│   │   └── ThemeContext.tsx         # Dark/light mode
│   ├── hooks/                       # Custom React hooks
│   ├── public/                      # Static assets
│   ├── .env.local                   # Environment variables
│   ├── next.config.js               # Next.js configuration
│   └── package.json
│
├── backend/                         # FastAPI Backend
│   ├── main.py                      # REST API endpoints
│   ├── models.py                    # SQLAlchemy database models
│   ├── database.py                  # Database connection
│   ├── indexer.py                   # Blockchain event listener
│   ├── health_check.py              # Health check endpoints
│   ├── job_scheduler.py             # Job state transitions
│   ├── gpu_provider.py              # Provider management
│   ├── ipfs_client.py               # Pinata IPFS integration
│   ├── docker_manager.py            # Docker operations
│   ├── requirements.txt             # Python dependencies
│   ├── Procfile                     # Render deployment config
│   └── .env                         # Environment variables
│
├── daemon/                          # Go Provider Daemon
│   ├── cmd/daemon/                  # Entry point
│   │   └── main.go
│   ├── internal/                    # Internal packages
│   │   ├── blockchain/              # XDC contract interactions
│   │   │   └── client.go
│   │   ├── config/                  # Environment configuration
│   │   │   └── config.go
│   │   ├── docker/                  # Container management
│   │   ├── ipfs/                    # IPFS upload/download
│   │   │   └── uploader.go
│   │   ├── heartbeat/               # EIP-712 signing
│   │   │   └── heartbeat.go
│   │   ├── indexer/                 # Block indexing
│   │   │   └── indexer.go
│   │   ├── provisioner/             # Docker execution
│   │   │   ├── docker.go
│   │   │   ├── gpu.go
│   │   │   └── mock.go
│   │   ├── watcher/                 # Job polling
│   │   │   └── watcher.go
│   │   └── ws/                      # WebSocket broadcasting
│   │       └── broadcast.go
│   ├── deployments/                 # Deployment configs
│   │   ├── Dockerfile
│   │   ├── docker-compose.yml
│   │   └── dicompute-daemon.service
│   ├── scripts/                     # Utility scripts
│   ├── go.mod
│   ├── go.sum
│   └── .env.example
│
├── contracts/                       # Solidity Smart Contracts
│   ├── src/
│   │   ├── JobEscrow.sol            # Main job contract
│   │   ├── GPURegistry.sol          # Provider registry
│   │   ├── ProofReceipt.sol         # Receipt NFT
│   │   ├── DICOToken.sol            # Payment token
│   │   ├── ReputationSystem.sol     # Reputation tracking
│   │   ├── DisputeResolution.sol    # Challenge mechanism
│   │   └── ComputeMarketplace.sol   # Job matching
│   ├── test/                        # Foundry tests
│   │   └── JobEscrow.t.sol
│   ├── script/                      # Deployment scripts
│   │   └── Deploy.s.sol
│   └── foundry.toml
│
├── scripts/                         # Utility scripts
│   ├── register_provider.py         # Provider registration helper
│   └── deploy.js                    # Hardhat deployment
│
├── deployed-addresses.json          # Contract addresses
├── render.yaml                      # Render infrastructure config
├── README.md                        # Quick start guide
├── PROJECT_DOCUMENTATION.md         # This file
├── DEMO-SETUP.md                    # Hackathon demo guide
└── USER-FLOW-COMPARISON.md          # UX analysis
```

---

## API Reference

### Base URLs

| Environment | URL |
|-------------|-----|
| Production | `https://dicompute-backend.onrender.com` |
| Local | `http://localhost:8001` |

### Health & Documentation

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info and available endpoints |
| GET | `/health` | Health check with service status |
| GET | `/docs` | Swagger UI (interactive) |
| GET | `/redoc` | ReDoc documentation |

### Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | List all jobs (paginated) |
| GET | `/api/jobs?limit=10&offset=0` | Paginated list |
| GET | `/api/jobs/{id}` | Get job by chain ID |
| GET | `/api/jobs/{id}/heartbeats` | Get job heartbeats |
| POST | `/api/jobs/{id}/heartbeats` | Submit heartbeat |

### Providers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/providers` | List all registered providers |
| GET | `/api/providers/{address}` | Get provider details |
| GET | `/api/providers/{address}/jobs` | Get provider's job history |

### Statistics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Network-wide statistics |
| GET | `/api/stats/jobs` | Job statistics |
| GET | `/api/stats/providers` | Provider statistics |

### Receipts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/receipts` | List all ProofReceipt NFTs |
| GET | `/api/receipts/{tokenId}` | Get receipt details |

### IPFS

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ipfs/upload` | Upload file to IPFS |
| GET | `/api/ipfs/download/{cid}` | Download from IPFS |

### Example Response: GET /api/stats

```json
{
  "total_jobs": 2,
  "active_jobs": 0,
  "completed_jobs": 1,
  "slashed_jobs": 0,
  "total_providers": 0,
  "active_providers": 0,
  "total_receipts": 1
}
```

---

## Setup Instructions

### Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Node.js | 18+ | Frontend runtime |
| Python | 3.11+ | Backend runtime |
| Go | 1.21+ | Daemon compilation |
| Docker | latest | Container runtime |
| NVIDIA Container Toolkit | latest | GPU passthrough |
| MetaMask | latest | Web3 wallet |

### 1. Clone Repository

```bash
git clone https://github.com/flexykrn/DICOMPUTE.git
cd DICOMPUTE
```

### 2. Backend Setup

```bash
cd backend

# Create environment file
cp .env.example .env

# Edit .env with your credentials
# PINATA_JWT=your_pinata_api_key
# CORS_ORIGINS=https://dicompute.onrender.com,http://localhost:3000

# Install dependencies
pip install -r requirements.txt

# Start server
python main.py
```

Backend available at `http://localhost:8001`

### 3. Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Start development server
npm run dev
```

Frontend available at `http://localhost:3000`

### 4. Provider Daemon Setup

```bash
cd daemon

# Create environment file
cp .env.example .env

# Edit .env with provider credentials
# PROVIDER_PRIVATE_KEY=0x...
# RPC_URL=https://erpc.apothem.network

# Build
go build -o dicompute-daemon cmd/daemon/main.go

# Run
./dicompute-daemon
```

Daemon available at `http://localhost:8080`

### Environment Variables

#### Backend (.env)

```env
PINATA_JWT=your_pinata_jwt_token
CORS_ORIGINS=https://dicompute.onrender.com,http://localhost:3000
DATABASE_URL=sqlite:///./dicompute.db
RPC_URL=https://erpc.apothem.network
CHAIN_ID=51
```

#### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_JOB_ESCROW_ADDRESS=0x2Ff9B760510fc0aAd51a59f8aDA62F8B2631a075
NEXT_PUBLIC_GPU_REGISTRY_ADDRESS=0xCEf0f0E74e618A95Da97e1216F81d74eA01dE77C
NEXT_PUBLIC_PROOF_RECEIPT_ADDRESS=0xb35EfE4E7071B1c7ce7f00CC7BB667cEc706DBa2
NEXT_PUBLIC_CHAIN_ID=51
NEXT_PUBLIC_RPC_URL=https://erpc.apothem.network
```

#### Daemon (.env)

```env
RPC_URL=https://erpc.apothem.network
CHAIN_ID=51
JOB_ESCROW_ADDRESS=0x2Ff9B760510fc0aAd51a59f8aDA62F8B2631a075
PROOF_RECEIPT_ADDRESS=0xb35EfE4E7071B1c7ce7f00CC7BB667cEc706DBa2
PROVIDER_PRIVATE_KEY=0x...
PROVIDER_ADDRESS=0x...
BACKEND_URL=https://dicompute-backend.onrender.com
DOCKER_HOST=unix:///var/run/docker.sock
PINATA_JWT=your_pinata_jwt
HEARTBEAT_INTERVAL=30s
MAX_CPU_CORES=8
MAX_RAM_GIB=32
MAX_VRAM_GIB=16
```

---

## Deployment Guide

### Render Deployment (Current)

Both frontend and backend are deployed on Render:

| Service | Type | Build Command | Start Command |
|---------|------|---------------|---------------|
| Frontend | Static Site | `npm install && npm run build` | `npm start` |
| Backend | Web Service | `pip install -r requirements.txt` | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

**Frontend Settings:**
- Build directory: `client/dist`
- Environment: `NODE_ENV=production`

**Backend Settings:**
- Procfile: `web: uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment variables: All secrets in Render dashboard

### Contract Deployment

```bash
cd contracts

# Set environment variables
export PRIVATE_KEY=0x...
export RPC_URL=https://erpc.apothem.network

# Deploy
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

### Provider Node Deployment

```bash
# Option 1: Systemd service
sudo cp daemon/deployments/dicompute-daemon.service /etc/systemd/system/
sudo systemctl enable dicompute-daemon
sudo systemctl start dicompute-daemon

# Option 2: Docker Compose
cd daemon/deployments
docker-compose up -d
```

---

## End-to-End User Flow

### For Job Submitters (Tenants)

```
1. Visit https://dicompute.onrender.com
2. Connect MetaMask (XDC Apothem Testnet, Chain 51)
3. Navigate to /wizard
4. Enter job specification:
   ├─ Docker image URI (e.g., pytorch/pytorch:latest)
   ├─ CPU requirements (milli-cores)
   ├─ RAM requirements (MiB)
   ├─ VRAM requirements (MiB)
   ├─ Duration (blocks, ~2s each)
   └─ Max price per block (wei)
5. Review estimated total deposit
6. Click "Submit Job on-chain"
7. Confirm transaction in MetaMask
8. Monitor at /explorer or /dashboard
9. Receive ProofReceipt NFT on completion
```

### For GPU Providers

```
1. Visit /provider
2. Connect wallet
3. Register with 0.1 XDC stake
4. Enter hardware metadata (GPU model, specs)
5. Run daemon on GPU machine
6. Daemon automatically:
   ├─ Polls blockchain for pending jobs
   ├─ Claims matching jobs
   ├─ Pulls Docker image
   ├─ Starts container with GPU passthrough
   ├─ Sends heartbeat attestations
   ├─ Uploads results to IPFS
   └─ Submits results on-chain
7. Receive payment automatically on completion
```

---

## Security Considerations

### Smart Contract Security

| Measure | Implementation |
|---------|---------------|
| Reentrancy protection | Checks-effects-interactions pattern |
| Integer overflow | Solidity 0.8.x built-in checks |
| Access control | `onlyOwner`, `onlyRegisteredProvider` modifiers |
| Input validation | Bounds checking on all parameters |
| Emergency pause | Circuit breaker pattern (planned) |

### Economic Security

| Attack Vector | Mitigation |
|---------------|------------|
| Provider doesn't execute | Slashing of 0.1 XDC stake |
| Provider submits fake results | Challenge period + challenger reward |
| Tenant doesn't pay | Escrow requires deposit upfront |
| Sybil attacks | Stake requirement raises barrier |
| DDoS on heartbeats | Rate limiting + economic cost |

### Operational Security

- Private keys stored in environment variables, never committed
- Backend API key required for provider daemon authentication
- CORS restricted to known origins
- Health checks monitor all services

---

## Future Roadmap

| Phase | Feature | Status | Timeline |
|-------|---------|--------|----------|
| **Phase 1** | Core marketplace (submit, claim, complete) | ✅ Complete | Done |
| **Phase 2** | Heartbeat attestations & ProofReceipt NFTs | ✅ Complete | Done |
| **Phase 3** | Provider reputation system | ✅ Complete | Done |
| **Phase 4** | Dispute resolution & slashing | ✅ Complete | Done |
| **Phase 5** | Multi-chain support (Polygon, Arbitrum) | 🔄 Planned | Q3 2024 |
| **Phase 6** | Continuous payment (per-block billing) | 🔄 Planned | Q3 2024 |
| **Phase 7** | Advanced provider marketplace with filtering | 🔄 Planned | Q4 2024 |
| **Phase 8** | Multi-container / SDL job specifications | 🔄 Planned | Q4 2024 |
| **Phase 9** | Mobile app for job monitoring | 📋 Future | 2025 |
| **Phase 10** | Mainnet deployment on XDC | 📋 Future | 2025 |

---

## Team

**Built by:** Karan (flexykrn) and team

**Contributors:**
- **Karan** — Blockchain architecture, smart contracts, project lead
- **Siddhi** — Go daemon, Docker integration, GPU optimization
- **Ruchi** — Frontend development, UI/UX design
- **Harshita** — Documentation, testing, project management
- **Divya** — Quality assurance, integration testing

**Contact:**
- GitHub: https://github.com/flexykrn/DICOMPUTE
- Email: flexykrn@gmail.com

---

## License

MIT License — see LICENSE file for details.

---

> **"Compute with proof. Rent with trust."**
>
> DICOMPUTE — Verifiable GPU Compute on XDC Apothem
>
> *Built for hackathons. Designed for production.*