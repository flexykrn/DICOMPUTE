# DICOMPUTE — Project Documentation

> **Verifiable GPU Compute on XDC Apothem**
> Decentralized marketplace for GPU-accelerated computing with on-chain proof-of-compute.

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution Overview](#solution-overview)
3. [Key Features](#key-features)
4. [Architecture](#architecture)
5. [Tech Stack](#tech-stack)
6. [Smart Contracts](#smart-contracts)
7. [Project Structure](#project-structure)
8. [API Endpoints](#api-endpoints)
9. [Setup Instructions](#setup-instructions)
10. [End-to-End User Flow](#end-to-end-user-flow)
11. [Deployment](#deployment)
12. [Future Roadmap](#future-roadmap)
13. [Team & Credits](#team--credits)

---

## Problem Statement

### The Challenge
Machine Learning researchers, data scientists, and developers need access to powerful GPU resources for training models, running simulations, and performing compute-intensive tasks. However:

- **Cloud GPUs are expensive** — AWS, GCP, Azure charge premium rates
- **No verifiable proof** — You pay for compute but can't cryptographically prove what was executed
- **Centralized control** — Single points of failure, censorship risk
- **Underutilized hardware** — Individual GPU owners have idle capacity going to waste
- **No trustless execution** — Must trust the provider actually ran your workload

### Target Users
| User Type | Need |
|-----------|------|
| ML Researchers | Affordable GPU training with proof for grants/audits |
| Data Scientists | On-demand compute for experiments |
| GPU Owners | Monetize idle NVIDIA hardware |
| Hackathon Teams | Quick, verifiable compute for demos |

---

## Solution Overview

DICOMPUTE is a **decentralized GPU compute marketplace** built on the XDC Apothem testnet (EVM-compatible).

### How It Works
1. **Tenant** submits a Docker-based job with resource requirements and bounty
2. **Provider** with available GPU claims the job from the marketplace
3. **Provider daemon** pulls the Docker image and executes it with GPU passthrough
4. **Heartbeat attestations** are sent every 30 seconds (EIP-712 signed)
5. **On completion**, results are uploaded to IPFS and a ProofReceipt NFT is minted
6. **Payment** is released from escrow to the provider automatically

### Trust Model
- Funds locked in smart contract escrow
- Cryptographic heartbeats prove execution
- Slashing mechanism penalizes missing heartbeats
- ProofReceipt NFT provides immutable audit trail

---

## Key Features

| Feature | Description |
|---------|-------------|
| **On-chain Job Escrow** | Funds locked until job completion or cancellation |
| **EIP-712 Heartbeat Attestations** | Cryptographic proof of execution every 30s |
| **GPU Passthrough** | NVIDIA Container Toolkit integration |
| **ProofReceipt NFT** | ERC-721 token minted on completion as verifiable proof |
| **Real-time Updates** | WebSocket + blockchain event indexing |
| **Slashing Mechanism** | Providers who miss heartbeats lose staked collateral |
| **IPFS Storage** | Job inputs/outputs stored on decentralized storage |
| **Multi-wallet Support** | MetaMask, XDCPay via RainbowKit |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DICOMPUTE ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────────┘

  Tenant (User)                GPU Provider
  ┌─────────────┐              ┌─────────────┐
  │  Next.js    │ ─submitJob──▶│  Go Daemon  │
  │  Frontend   │              │  + Docker   │
  │  (Port 3000)│ ◀─completed──│  (Port 8080)│
  └──────┬──────┘              └──────┬──────┘
         │                            │
         │                            │ claimJob
         │                            │ submitResults
         │                            ▼
         │                     ┌─────────────┐
         │                     │ XDC Apothem │
         │                     │ Blockchain  │
         │                     │  Chain 51   │
         │                     └──────┬──────┘
         │                            │
         │                            │ events
         ▼                            ▼
  ┌─────────────┐              ┌─────────────┐
  │ FastAPI     │ ◀──indexer──│ Smart       │
  │ Backend     │              │ Contracts   │
  │ (Port 8001) │              │ JobEscrow   │
  └─────────────┘              │ GPURegistry │
                               │ ProofReceipt│
                               └─────────────┘
```

### Data Flow
1. User submits job → MetaMask transaction → JobEscrow contract
2. Contract emits JobSubmitted event
3. Backend indexer captures event → stores in SQLite database
4. Provider daemon detects pending job → calls claimJob()
5. Provider runs Docker container with GPU passthrough
6. Heartbeats sent via HTTP to backend (EIP-712 signed)
7. Job completes → results uploaded to IPFS → submitResults() called
8. Contract verifies heartbeats → mints ProofReceipt NFT → releases payment

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14, React, TypeScript, Tailwind CSS | User interface |
| **State Management** | wagmi, RainbowKit, viem | Web3 wallet connection |
| **Backend** | FastAPI, SQLAlchemy, SQLite | REST API + database |
| **Blockchain** | Solidity ^0.8.24, Foundry/Hardhat | Smart contracts |
| **Network** | XDC Apothem Testnet (Chain 51) | EVM-compatible L1 |
| **Daemon** | Go 1.21, go-ethereum, Docker SDK | Provider node software |
| **Storage** | IPFS via Pinata | Decentralized file storage |
| **GPU Runtime** | NVIDIA Container Toolkit | Docker GPU passthrough |
| **Deployment** | Render (frontend + backend), systemd (daemon) | Hosting |

---

## Smart Contracts

### Contract Addresses (XDC Apothem Testnet)

| Contract | Address | Purpose |
|----------|---------|---------|
| **JobEscrow** | `0x2Ff9B760510fc0aAd51a59f8aDA62F8B2631a075` | Job lifecycle, escrow, payments |
| **GPURegistry** | `0xCEf0f0E74e618A95Da97e1216F81d74eA01dE77C` | Provider registration & staking |
| **ProofReceipt** | `0xb35EfE4E7071B1c7ce7f00CC7BB667cEc706DBa2` | ERC-721 receipt NFT |
| **DICOToken** | `0xdA08a27339E2EA93AfCe6270c14FA35C1bE48bf4` | Payment token (ERC-20) |
| **ReputationSystem** | `0xf02ac8fDab069bd62B2CE9F53Ea0d09c725880E3` | Provider reputation scores |
| **DisputeResolution** | `0x15076c075c39BD2F1D10dcf5dC9063Ae808ab019` | Challenge & slash mechanism |
| **ComputeMarketplace** | `0xFD0F04eEC204b2cf1Af7f3a6f9145F12B5C78293` | Job discovery & matching |

### Contract Interactions

```
User ──submitJob()──▶ JobEscrow
Provider ──registerProvider()──▶ GPURegistry
Provider ──claimJob()──▶ JobEscrow
Provider ──submitResults()──▶ JobEscrow
JobEscrow ──mint()──▶ ProofReceipt
JobEscrow ──slashProvider()──▶ GPURegistry
```

### Key Contract Features

**JobEscrow.sol**
- `submitJob(JobSpec, deposit)` — Create job with locked funds
- `claimJob(jobId)` — Provider claims available job
- `submitResults(jobId, resultCID)` — Complete job with IPFS hash
- `cancelJob(jobId)` — Cancel pending job, refund deposit
- `challengeJob(jobId)` — Challenge provider for missed heartbeats
- `slashProvider(provider)` — Penalize provider, reward challenger

**GPURegistry.sol**
- `registerProvider(metadataURI, stake)` — Register with collateral
- `updateProvider(metadataURI)` — Update hardware specs
- `unregisterProvider()` — Exit marketplace, reclaim stake

**ProofReceipt.sol**
- `mint(user, jobId, resultCID, instructionCount)` — Mint proof NFT
- `tokenURI(tokenId)` — Metadata with job details

---

## Project Structure

```
DICOMPUTE/
├── client/                    # Next.js 14 Frontend
│   ├── app/                   # App router pages
│   │   ├── page.tsx           # Landing page
│   │   ├── wizard/            # Job submission wizard
│   │   ├── marketplace/       # GPU provider listings
│   │   ├── explorer/          # Job explorer
│   │   ├── dashboard/         # Network stats dashboard
│   │   ├── jobs/[id]/         # Job detail + heartbeats
│   │   ├── receipts/[id]/     # ProofReceipt viewer
│   │   └── provider/          # Provider registration
│   ├── components/            # Reusable UI components
│   │   ├── landing/           # Landing page sections
│   │   └── ui/                # shadcn/ui components
│   ├── context/               # React context providers
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Contract ABIs, wagmi config
│   └── public/                # Static assets
│
├── backend/                   # FastAPI Backend
│   ├── main.py                # REST API endpoints
│   ├── indexer.py             # Blockchain event listener
│   ├── models.py              # SQLAlchemy database models
│   ├── database.py            # DB connection & session
│   ├── health_check.py        # Health check endpoints
│   ├── job_scheduler.py       # Job state management
│   ├── gpu_provider.py        # Provider status tracking
│   ├── ipfs_client.py         # Pinata IPFS integration
│   ├── docker_manager.py      # Docker operations (optional)
│   └── requirements.txt       # Python dependencies
│
├── daemon/                    # Go Provider Daemon
│   ├── cmd/daemon/            # Entry point
│   ├── internal/
│   │   ├── blockchain/        # XDC contract interactions
│   │   ├── docker/            # Container management
│   │   ├── ipfs/              # IPFS upload/download
│   │   ├── heartbeat/         # EIP-712 heartbeat signing
│   │   └── config/            # Environment config
│   └── deployments/           # Docker compose, systemd
│
├── contracts/                 # Solidity Smart Contracts
│   ├── src/
│   │   ├── JobEscrow.sol      # Main job contract
│   │   ├── GPURegistry.sol    # Provider registry
│   │   ├── ProofReceipt.sol   # Receipt NFT
│   │   ├── DICOToken.sol      # Payment token
│   │   ├── ReputationSystem.sol
│   │   ├── DisputeResolution.sol
│   │   └── ComputeMarketplace.sol
│   ├── test/                  # Foundry tests
│   └── script/                # Deployment scripts
│
├── scripts/                   # Hardhat deployment
│   └── deploy.js              # Contract deployment
│
├── deployed-addresses.json    # Contract addresses
├── render.yaml                # Render deployment config
└── README.md                  # Quick start guide
```

---

## API Endpoints

### Base URL
- Production: `https://dicompute-backend.onrender.com`
- Local: `http://localhost:8001`

### Health & Info
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info & endpoints |
| GET | `/health` | Health check status |
| GET | `/docs` | Swagger UI documentation |
| GET | `/redoc` | ReDoc documentation |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | List all jobs |
| GET | `/api/jobs?limit=10` | List with pagination |
| GET | `/api/jobs/{id}` | Get job by chain ID |
| GET | `/api/jobs/{id}/heartbeats` | Get job heartbeats |
| POST | `/api/jobs/{id}/heartbeats` | Submit heartbeat |

### Providers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/providers` | List all providers |
| GET | `/api/providers/{address}` | Get provider details |
| GET | `/api/providers/{address}/jobs` | Get provider's jobs |

### Stats & Receipts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Network statistics |
| GET | `/api/receipts` | List all receipts |
| GET | `/api/receipts/{tokenId}` | Get receipt details |

### IPFS
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ipfs/upload` | Upload file to IPFS |
| GET | `/api/ipfs/download/{cid}` | Download from IPFS |

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.11+
- Go 1.21+ (for daemon)
- Docker + NVIDIA Container Toolkit (for GPU provider)
- MetaMask with XDC Apothem testnet configured

### 1. Clone Repository
```bash
git clone https://github.com/flexykrn/DICOMPUTE.git
cd DICOMPUTE
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your PINATA_JWT and other secrets
pip install -r requirements.txt
python main.py
```
Backend runs at `http://localhost:8001`

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```
Frontend runs at `http://localhost:3000`

### 4. Provider Daemon Setup (GPU Node)
```bash
cd daemon
cp .env.example .env
# Edit .env with PROVIDER_PRIVATE_KEY and RPC_URL
go build -o dicompute-daemon cmd/daemon/main.go
./dicompute-daemon
```
Daemon runs at `http://localhost:8080`

### Environment Variables

**Backend (.env)**
```env
PINATA_JWT=your_pinata_api_key
CORS_ORIGINS=https://dicompute.onrender.com,http://localhost:3000
DATABASE_URL=sqlite:///./dicompute.db
```

**Frontend (.env)**
```env
NEXT_PUBLIC_API_URL=https://dicompute-backend.onrender.com
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
```

**Daemon (.env)**
```env
PROVIDER_PRIVATE_KEY=your_private_key
RPC_URL=https://erpc.apothem.network
BACKEND_URL=http://localhost:8001
```

---

## End-to-End User Flow

### For Job Submitters (Tenants)

```
1. Visit https://dicompute.onrender.com
2. Connect MetaMask wallet (XDC Apothem network)
3. Navigate to /wizard
4. Enter job details:
   - Docker image URI (e.g., pytorch/pytorch:latest)
   - CPU, RAM, VRAM requirements
   - Duration (in blocks)
   - Max price per block
5. Review deposit estimate
6. Click "Submit Job" → MetaMask confirms transaction
7. Monitor job at /jobs/{id} with live heartbeats
8. Download results from IPFS when complete
9. View ProofReceipt NFT in /receipts/{id}
```

### For GPU Providers

```
1. Visit /provider
2. Connect wallet and register with stake
3. Enter hardware specs (GPU model, VRAM, etc.)
4. Run provider daemon on GPU machine
5. Daemon automatically claims matching jobs
6. Docker container executes with GPU passthrough
7. Heartbeats sent automatically every 30s
8. Results uploaded to IPFS on completion
9. Payment received in wallet automatically
```

---

## Deployment

### Live URLs
| Component | URL | Status |
|-----------|-----|--------|
| Frontend | https://dicompute.onrender.com | 🟢 Live |
| Backend API | https://dicompute-backend.onrender.com | 🟢 Live |
| Blockchain | XDC Apothem Testnet (Chain 51) | 🟢 Live |

### Render Deployment
Both frontend and backend are deployed on Render:
- Frontend: Static site from `client/` directory
- Backend: Web service from `backend/` directory with `Procfile`

### Contract Deployment
```bash
cd contracts
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://erpc.apothem.network \
  --private-key $PRIVATE_KEY \
  --broadcast
```

---

## Future Roadmap

| Phase | Feature | Priority |
|-------|---------|----------|
| **Phase 1** | ✅ Core marketplace (job submission, claiming, completion) | Done |
| **Phase 2** | ✅ Heartbeat attestations & ProofReceipt NFTs | Done |
| **Phase 3** | ✅ Provider reputation system | Done |
| **Phase 4** | ✅ Dispute resolution & slashing | Done |
| **Phase 5** | 🔄 Multi-chain support (Polygon, Arbitrum) | Planned |
| **Phase 6** | 🔄 Continuous payment (per-block billing) | Planned |
| **Phase 7** | 🔄 Provider marketplace with filtering | Planned |
| **Phase 8** | 🔄 Multi-container / SDL job specs | Planned |
| **Phase 9** | 🔄 Mobile app for job monitoring | Future |

---

## Team & Credits

**Built by:** Karan (flexykrn) and team

**For:** Hackathons, decentralized compute research, GPU marketplace innovation

**License:** MIT

**Built with:**
- Foundry for smart contract development
- Next.js App Router for frontend
- FastAPI for backend
- Go for high-performance daemon
- XDC Network for fast, cheap transactions

---

> **"Compute with proof. Rent with trust."**
>
> DICOMPUTE — Verifiable GPU Compute on XDC Apothem
