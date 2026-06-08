# DICOMPUTE

**Verifiable GPU Compute on XDC Apothem**

DICOMPUTE is a decentralized marketplace for GPU-accelerated computing. Submit Docker-based workloads, set your bounty, and let providers with NVIDIA GPUs execute them. Every job execution is cryptographically proven on-chain via heartbeat attestations and minted as a ProofReceipt NFT.

---

## Architecture

```
Tenant Laptop (You)          GPU Provider (Teammate)
┌─────────────┐               ┌─────────────┐
│  Next.js    │ ─submitJob──▶ │  Go Daemon  │
│  Frontend   │               │  + Docker   │
│  (Port 3000)│ ◀─JobCompleted──│  (Port 8080)│
└──────┬──────┘               └──────┬──────┘
       │                              │
       │                              │ claimJob
       │                              │ submitResults
       │                              ▼
       │                       ┌─────────────┐
       │                       │ XDC Apothem │
       │                       │ Blockchain  │
       │                       │  Chain 51   │
       │                       └──────┬──────┘
       │                              │
       │                              │ events
       ▼                              ▼
┌─────────────┐                 ┌─────────────┐
│ FastAPI     │                 │ Smart       │
│ Backend     │ ◀──indexer───── │ Contracts   │
│ (Port 8001) │                 │ JobEscrow   │
└─────────────┘                 │ GPURegistry │
                                │ ProofReceipt│
                                └─────────────┘
```

---

## Live Demo

| Component | URL | Status |
|-----------|-----|--------|
| Frontend | https://dicompute.onrender.com | 🟢 Live |
| Backend API | https://dicompute-backend.onrender.com | 🟢 Live |
| Blockchain | XDC Apothem Testnet (Chain 51) | 🟢 Live |

---

## Smart Contracts (XDC Apothem Testnet)

| Contract | Address | Purpose |
|----------|---------|---------|
| **JobEscrow** | `0x2Ff9B760510fc0aAd51a59f8aDA62F8B2631a075` | Holds jobs, deposits, and settlements |
| **GPURegistry** | `0xCEf0f0E74e618A95Da97e1216F81d74eA01dE77C` | Provider registration and staking |
| **ProofReceipt** | `0xb35EfE4E7071B1c7ce7f00CC7BB667cEc706DBa2` | NFT minted on job completion |
| **DICOToken** | `0xdA08a27339E2EA93AfCe6270c14FA35C1bE48bf4` | Payment token |

---

## Quick Start (Local Development)

### Prerequisites

- Node.js 18+
- Python 3.11+
- Go 1.21+ (for daemon)
- Docker + NVIDIA Container Toolkit (for GPU provider)
- MetaMask with XDC Apothem testnet

### 1. Clone & Install

```bash
git clone https://github.com/flexykrn/DICOMPUTE.git
cd DICOMPUTE
```

### 2. Start Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your PINATA_JWT
pip install -r requirements.txt
python main.py
```

Backend runs at `http://localhost:8001`

### 3. Start Frontend

```bash
cd client
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`

### 4. Start Provider Daemon (GPU Laptop)

```bash
cd daemon
cp .env.example .env
# Edit .env with your PROVIDER_PRIVATE_KEY
go build -o dicompute-daemon cmd/daemon/main.go
./dicompute-daemon
```

---

## End-to-End Demo Flow

1. **Tenant** opens frontend wizard, connects MetaMask, fills Docker image + bounty
2. **Tenant** clicks "Submit Job" — MetaMask pops up, confirms transaction
3. **Provider daemon** sees pending job on blockchain, calls `claimJob`
4. **Provider daemon** pulls Docker image, starts container with GPU passthrough
5. **Provider daemon** sends heartbeat attestations every 30 seconds
6. **Container finishes** — daemon uploads logs to IPFS, calls `submitResults`
7. **Contract** pays provider, refunds tenant, mints ProofReceipt NFT to tenant
8. **Tenant** sees "Job Completed" + NFT in dashboard

---

## Project Structure

```
DICOMPUTE/
├── client/          # Next.js 14 frontend
│   ├── app/         # App router pages
│   ├── components/  # UI components
│   └── lib/         # Contract ABIs, wagmi config
├── backend/         # FastAPI API + blockchain indexer
│   ├── main.py      # REST API endpoints
│   ├── indexer.py   # Blockchain event listener
│   └── models.py    # SQLAlchemy models
├── daemon/          # Go provider daemon
│   ├── cmd/daemon/  # Entry point
│   ├── internal/    # Blockchain, Docker, IPFS, heartbeat
│   └── deployments/ # Docker compose, systemd service
├── contracts/       # Solidity smart contracts
│   └── src/         # JobEscrow, GPURegistry, ProofReceipt
└── scripts/         # Hardhat deployment scripts
```

---

## Key Features

- **On-chain job escrow** — Deposit locked in smart contract until completion
- **EIP-712 heartbeat attestations** — Cryptographic proof of execution
- **GPU passthrough** — NVIDIA Container Toolkit integration
- **ProofReceipt NFT** — Verifiable proof of compute completion
- **Real-time updates** — WebSocket + blockchain event listeners
- **Slashing mechanism** — Providers who miss heartbeats lose stake

---

## Documentation

- [`DEMO-SETUP.md`](./DEMO-SETUP.md) — Step-by-step demo setup guide for hackathons
- [`USER-FLOW-COMPARISON.md`](./USER-FLOW-COMPARISON.md) — UX flow analysis and design decisions
- [`DEPLOYMENT-RUNBOOK.md`](./DEPLOYMENT-RUNBOOK.md) — Production deployment instructions

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS, wagmi, RainbowKit |
| Backend | FastAPI, SQLAlchemy, SQLite (PostgreSQL ready) |
| Blockchain | Solidity, Hardhat, XDC Apothem (EVM-compatible) |
| Daemon | Go, go-ethereum, Docker SDK, NVIDIA runtime |
| Storage | IPFS (Pinata) |

---

## License

MIT

---

**Built for hackathons. Deployed on Render. Running on XDC Apothem.**
