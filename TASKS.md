# DICOMPUTE — Task Assignments for 5-Person Team

## Team Structure

| Role | Person | Primary Focus | Secondary Support |
|------|--------|---------------|-------------------|
| **Smart Contract Lead** | Siddhi Jadhav | Solidity contracts, Foundry tests, XDC deployment | Contract integration with backend |
| **Backend Lead** | M2 | FastAPI server, Web3.py bridge, PostgreSQL schema, IPFS integration | Daemon event streaming |
| **Frontend Lead** | M3 | Next.js app, Wagmi/viem hooks, wallet connect, UI/UX | Demo video recording |
| **DevOps / QA** | M4 | Docker setup, CI pipeline, contract deployment scripts, integration testing | Load testing, security checks |
| **Documentation / PM** | M5 | README, pitch deck, demo script, API docs, project coordination | Frontend polish, QA support |

---

## Phase 1: Smart Contracts (Hours 0-3) — Siddhi Jadhav

**Status: COMPLETE** (Committed: e51c163)

### Delivered:
- GPURegistry.sol — provider registration, staking, slashing
- JobEscrow.sol — job lifecycle, EIP-712 heartbeats, challenge mechanism
- ReputationSystem.sol — scoring based on completion rate and heartbeat streak
- ProofReceipt.sol — ERC721 NFT receipts for completed jobs
- DICOToken.sol — native token for marketplace
- DisputeResolution.sol — on-chain dispute handling
- ComputeMarketplace.sol — aggregator contract for stats
- Deploy.s.sol — deployment script for XDC Apothem testnet
- JobEscrow.t.sol — comprehensive tests (4/4 passing)

### Next Steps:
1. Deploy to XDC Apothem testnet using: `forge script script/Deploy.s.sol --rpc-url https://rpc.apothem.network --broadcast`
2. Record deployed contract addresses
3. Verify contracts on XDC explorer

---

## Phase 2: Go Daemon (Hours 2-5) — M4 + Siddhi

**Status: NOT STARTED**

### Tasks:
1. **Docker Provisioner** (`daemon/internal/provisioner/`)
   - Implement Docker Engine API client
   - Container lifecycle: pull, create, start, stop, remove
   - Resource enforcement via cgroups (CPU, RAM, VRAM)
   - Volume mounts for input/output data

2. **Crypto Verifier** (`daemon/internal/verifier/`)
   - EIP-712 heartbeat payload construction
   - secp256k1 signing using go-ethereum
   - Periodic heartbeat ticker (every 30 seconds)

3. **Heartbeat Broadcaster** (`daemon/internal/heartbeat/`)
   - Web3 connection to XDC RPC
   - Transaction submission with retry logic
   - Gas estimation and nonce management

4. **Job Watcher** (`daemon/internal/watcher/`)
   - Poll JobEscrow for new job assignments
   - Trigger Docker provisioner on job claim
   - Monitor container health and resource usage

### Acceptance Criteria:
- Daemon can register as a provider on-chain
- Daemon can claim a job from the pending pool
- Daemon starts Docker container with correct resource limits
- Daemon submits heartbeats every 30 seconds
- Daemon submits results and marks job complete

---

## Phase 3: Backend API (Hours 3-6) — M2

**Status: NOT STARTED**

### Tasks:
1. **FastAPI Server** (`backend/app/`)
   - REST API for job submission, status, results
   - WebSocket for real-time job updates
   - PostgreSQL schema for job history, provider stats

2. **Web3.py Bridge**
   - Read contract events (JobSubmitted, JobClaimed, etc.)
   - Index on-chain data into PostgreSQL
   - Expose aggregated metrics

3. **IPFS Integration**
   - Upload job inputs (Docker images, datasets)
   - Download job results
   - Pin management

### API Endpoints:
```
POST /api/jobs — Submit new job
GET /api/jobs/{id} — Get job status
GET /api/jobs/pending — List pending jobs
GET /api/providers — List active providers
GET /api/providers/{address} — Get provider details
GET /api/receipts/{tokenId} — Get proof receipt
GET /api/stats — Marketplace statistics
WS /ws/jobs — Real-time job updates
```

---

## Phase 4: Frontend Dashboard (Hours 5-8) — M3

**Status: NOT STARTED**

### Tasks:
1. **Next.js 14 App Router** (`client/src/app/`)
   - Wallet connection via RainbowKit / ConnectKit
   - XDC network configuration

2. **Deployment Wizard** (`client/src/components/wizard/`)
   - Docker URI input
   - Resource sliders (CPU, RAM, VRAM)
   - Duration and price estimation
   - Deposit calculation

3. **Uptime Dashboard** (`client/src/components/dashboard/`)
   - Live provider health grid
   - Heartbeat history chart
   - Job status timeline

4. **Receipt Explorer** (`client/src/components/receipts/`)
   - NFT gallery of proof receipts
   - Verification of receipt authenticity
   - Job result viewer

### Tech Stack:
- Next.js 14, Tailwind CSS, shadcn/ui
- wagmi/viem for Web3 interactions
- Recharts for data visualization

---

## Phase 5: Integration & E2E Testing (Hours 7-9) — All Hands

**Status: NOT STARTED**

### Tasks:
1. **End-to-End Flow**
   - User submits job via frontend
   - Backend indexes job, broadcasts to providers
   - Provider daemon claims and executes job
   - Heartbeats flow to contract
   - Results submitted, receipt minted
   - User views receipt in frontend

2. **Demo Script** (M5)
   - Step-by-step walkthrough
   - Screen recording setup
   - Narration script

3. **Bug Fixes & Polish**
   - Fix any integration issues
   - Optimize gas costs
   - UI/UX refinements

---

## Phase 6: Final Demo (Hours 9-12) — All Hands

**Status: NOT STARTED**

### Tasks:
1. **Live Demo Run**
   - Deploy fresh contracts to Apothem
   - Register 2-3 provider daemons (team members' GPUs)
   - Submit training job (e.g., MNIST on PyTorch)
   - Show real-time heartbeats
   - Display proof receipt

2. **Pitch Deck** (M5)
   - Problem statement
   - Solution architecture
   - Competitive comparison (Akash, Render, io.net)
   - Go-to-market strategy
   - Team intro

3. **Documentation**
   - Final README with setup instructions
   - API documentation
   - Architecture diagrams

---

## Critical Path

The critical path is: **Contracts → Daemon → Backend → Frontend → Integration**

Any delay in contracts blocks daemon. Any delay in daemon blocks integration.
Frontend and backend can progress in parallel once contracts are deployed.

## Communication

- **Discord/Slack channel**: #dicompute-build
- **Standups**: Every 2 hours
- **Blockers**: Escalate immediately to Karan
- **Code reviews**: Required before merge to main

## Definition of Done

- [ ] All contracts deployed to XDC Apothem
- [ ] Daemon can execute Docker jobs end-to-end
- [ ] Frontend can submit jobs and view receipts
- [ ] E2E demo completed successfully
- [ ] Pitch deck ready
- [ ] All code committed and pushed
