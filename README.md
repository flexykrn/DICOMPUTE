# DICOMPUTE

Decentralized GPU compute for training/inference with on-chain proof-of-training receipts settled on XDC.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Backend   │◀────│   Indexer   │
│  (Next.js)  │     │  (FastAPI)  │     │   (M4)      │
└─────────────┘     └─────────────┘     └──────┬──────┘
       │                                        │
       │                                        │ reads
       │ wallet                                 │
       ▼                                        ▼
┌─────────────────────────────────────────────────────┐
│              XDC Apothem Testnet                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ GPURegistry│ │ JobEscrow  │ │ ProofReceipt│       │
│  │ Reputation │ │ Dispute    │ │ DICOToken    │       │
│  └──────────┘ └──────────┘ └──────────┘            │
└─────────────────────────────────────────────────────┘
                            ▲
                            │ heartbeats
                     ┌──────┴──────┐
                     │   Daemon    │
                     │    (Go)     │
                     │  + Docker   │
                     └─────────────┘
```

## Project Structure

```
dicompute/
├── contracts/          # Solidity smart contracts (Foundry)
│   ├── src/            # Contract source files
│   ├── test/           # Foundry tests
│   ├── script/         # Deployment scripts
│   └── foundry.toml    # Foundry configuration
├── daemon/             # Go provider daemon (EMPTY — M4)
├── backend/            # FastAPI server (EMPTY — M2)
├── client/             # Next.js frontend (EMPTY — M3)
├── shared/             # Shared assets and docs (EMPTY — M5)
├── PLAN.md             # Architectural blueprint
├── TASKS.md            # Team task assignments
└── README.md           # This file
```

## Current Status

| Component | Status | Owner |
|-----------|--------|-------|
| Smart Contracts | COMPLETE (7 contracts, 4/4 tests passing) | Karan |
| Contract Deployment | NOT STARTED | Karan |
| Go Daemon | EMPTY | M4 |
| Backend API | EMPTY | M2 |
| Frontend | EMPTY | M3 |
| Documentation | PARTIAL | M5 |

## Smart Contracts

All contracts located in `contracts/src/`:

- **GPURegistry.sol** — Provider registration, staking, slashing
- **JobEscrow.sol** — Job lifecycle, EIP-712 heartbeats, challenges
- **ReputationSystem.sol** — On-chain reputation scoring
- **ProofReceipt.sol** — ERC721 proof-of-training NFTs
- **DICOToken.sol** — Native marketplace token
- **DisputeResolution.sol** — On-chain dispute handling
- **ComputeMarketplace.sol** — Stats aggregator

### Running Tests

```bash
cd contracts
export PATH="$HOME/.foundry/bin:$PATH"
forge test --match-contract JobEscrowTest -vv
```

## Team Assignments

See `TASKS.md` for detailed task breakdown.

| Person | Role |
|--------|------|
| Karan | Blockchain Lead — ALL smart contract work, XDC deployment |
| M2 | Backend Lead — FastAPI, PostgreSQL, IPFS |
| M3 | Frontend Lead — Next.js, UI/UX, dashboard |
| M4 | DevOps/Infrastructure — Docker daemon, GPU monitoring, indexer |
| M5 | Documentation/PM — Pitch deck, README, demo script |

## Getting Started

### Prerequisites

- Foundry (for contracts)
- Go 1.22+ (for daemon)
- Python 3.11+ (for backend)
- Node.js 20+ (for frontend)
- Docker (for GPU jobs)

### Contract Development

```bash
cd contracts
forge build
forge test
```

### Deploy to XDC Apothem

```bash
cd contracts
forge script script/Deploy.s.sol --rpc-url https://rpc.apothem.network --broadcast
```

## License

MIT / Apache-2.0
