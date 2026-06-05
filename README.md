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
| Contract Deployment | COMPLETE | Karan |
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

### Deployed Contracts (XDC Apothem Testnet)

| Contract | Address |
|----------|---------|
| DICOToken | `0xdA08a27339E2EA93AfCe6270c14FA35C1bE48bf4` |
| GPURegistry | `0xCEf0f0E74e618A95Da97e1216F81d74eA01dE77C` |
| ReputationSystem | `0xf02ac8fDab069bd62B2CE9F53Ea0d09c725880E3` |
| ProofReceipt | `0xb35EfE4E7071B1c7ce7f00CC7BB667cEc706DBa2` |
| DisputeResolution | `0x15076c075c39BD2F1D10dcf5dC9063Ae808ab019` |
| JobEscrow | `0x2Ff9B760510fc0aAd51a59f8aDA62F8B2631a075` |
| ComputeMarketplace | `0xFD0F04eEC204b2cf1Af7f3a6f9145F12B5C78293` |

- **Network**: XDC Apothem Testnet (Chain ID: 51)
- **Deployer**: `0x8916DD1311c17aD008bB56bE3378E001a92e4375`
- **Explorer**: https://testnet.xdcscan.com

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
