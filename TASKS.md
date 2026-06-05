# DICOMPUTE — Task Assignments for 5-Person Team

## Team Structure

| Role | Person | Primary Focus | Secondary Support |
|------|--------|---------------|-------------------|
| **Blockchain Lead** | Karan | ALL smart contract work, XDC deployment, contract integration, Web3 interactions | Architecture decisions, final review |
| **Backend Lead** | M2 | FastAPI server, PostgreSQL schema, IPFS integration, API design | Daemon event streaming support |
| **Frontend Lead** | M3 | Next.js app, UI/UX, wallet connect, dashboard, receipt explorer | Demo video recording |
| **DevOps / Infrastructure** | M4 | Docker setup, CI pipeline, provider daemon, container orchestration, GPU monitoring | Load testing, security checks |
| **Documentation / PM** | M5 | README, pitch deck, demo script, API docs, project coordination, competitive analysis | Frontend polish, QA support |

---

## Karan — Blockchain Lead (YOU)

**ALL blockchain-related work stays with you. No one else touches contracts or Web3 logic.**

### Phase 1: Smart Contracts (Hours 0-3) — SOLO
**Status: COMPLETE** (Committed: e51c163)

- GPURegistry.sol — provider registration, staking, slashing
- JobEscrow.sol — job lifecycle, EIP-712 heartbeats, challenge mechanism
- ReputationSystem.sol — scoring based on completion rate and heartbeat streak
- ProofReceipt.sol — ERC721 NFT receipts for completed jobs
- DICOToken.sol — native token for marketplace
- DisputeResolution.sol — on-chain dispute handling
- ComputeMarketplace.sol — aggregator contract for stats
- Deploy.s.sol — deployment script for XDC Apothem testnet
- JobEscrow.t.sol — comprehensive tests (4/4 passing)

### Phase 2: Contract Deployment (Hour 3) — SOLO
- Deploy to XDC Apothem testnet
- Record all contract addresses
- Share ABIs with M2 (Backend) and M3 (Frontend)
- Verify contracts on XDC explorer

### Phase 5: Integration Support (Hours 7-9) — SOLO
- Debug any contract interaction issues
- Optimize gas costs if needed
- Final contract review before demo

### Phase 6: Demo (Hours 9-12) — SOLO
- Live contract interactions during demo
- Explain architecture to judges
- Handle any on-chain questions

---

## M2 — Backend Lead

**Zero blockchain work. Focus purely on off-chain infrastructure.**

### Phase 3: Backend API (Hours 3-6)

**FastAPI Server** (`backend/app/`)
- REST API for job metadata, status, results
- WebSocket for real-time job updates
- PostgreSQL schema for job history, provider stats
- DOES NOT interact with blockchain directly — reads from M4's indexer

**API Endpoints:**
```
POST /api/jobs — Submit new job metadata
GET /api/jobs/{id} — Get job status from DB
GET /api/jobs/pending — List pending jobs from DB
GET /api/providers — List active providers from DB
GET /api/providers/{address} — Get provider details from DB
GET /api/receipts/{tokenId} — Get proof receipt metadata
GET /api/stats — Marketplace statistics from DB
WS /ws/jobs — Real-time job updates (broadcast from M4)
```

**IPFS Integration**
- Upload job inputs (Docker images, datasets)
- Download job results
- Pin management

### Phase 5: Integration (Hours 7-9)
- Connect to M4's event stream
- Ensure API serves correct data to M3's frontend
- Load testing

---

## M3 — Frontend Lead

**Zero blockchain work. Focus purely on UI/UX and Web2 API integration.**

### Phase 4: Dashboard (Hours 5-8)

**Next.js 14 App Router** (`client/src/app/`)
- Wallet connection UI (Karan provides the Wagmi config)
- XDC network configuration (Karan provides chain details)

**Deployment Wizard** (`client/src/components/wizard/`)
- Docker URI input
- Resource sliders (CPU, RAM, VRAM)
- Duration and price estimation
- Deposit calculation display

**Uptime Dashboard** (`client/src/components/dashboard/`)
- Live provider health grid (data from M2's API)
- Heartbeat history chart (data from M2's API)
- Job status timeline (data from M2's API)

**Receipt Explorer** (`client/src/components/receipts/`)
- NFT gallery of proof receipts (data from M2's API)
- Job result viewer (data from M2's API)
- Verification UI (Karan provides verification logic)

**Tech Stack:** Next.js 14, Tailwind CSS, shadcn/ui, Recharts
**NO wagmi/viem in frontend** — all Web3 calls go through Karan's hooks or M2's API

### Phase 6: Demo (Hours 9-12)
- Screen recording of UI flow
- Pitch deck visuals

---

## M4 — DevOps / Infrastructure

**Zero blockchain work. Focus purely on Docker, daemon, and system infrastructure.**

### Phase 2: Go Daemon Scaffold (Hours 2-5)

**Docker Provisioner** (`daemon/internal/provisioner/`)
- Docker Engine API client
- Container lifecycle: pull, create, start, stop, remove
- Resource enforcement via cgroups (CPU, RAM, VRAM)
- Volume mounts for input/output data

**Job Watcher** (`daemon/internal/watcher/`)
- Poll M2's backend API for new job assignments
- Trigger Docker provisioner on job assignment
- Monitor container health and resource usage

**Heartbeat Generator** (`daemon/internal/heartbeat/`)
- Generate heartbeat payloads (Karan provides format)
- Send heartbeats to M2's backend (NOT directly to chain)

### Phase 3: Event Indexer (Hours 5-6)
- Read contract events from Karan's deployed contracts
- Index on-chain data into PostgreSQL
- Broadcast events to M2's WebSocket
- **This is the ONLY component that touches blockchain — and only as a read-only indexer**

### Phase 5: Integration (Hours 7-9)
- Ensure daemon runs on team members' GPUs
- End-to-end container testing
- System monitoring setup

---

## M5 — Documentation / PM

**Zero coding. Focus purely on project management and deliverables.**

### Ongoing (Hours 0-12)
- Maintain README and setup instructions
- Track task completion against timeline
- Competitive analysis (Akash, Render, io.net comparison)
- Pitch deck creation
- Demo script writing
- API documentation (from M2's specs)
- Architecture diagrams
- Final presentation rehearsal

### Phase 6: Demo (Hours 9-12)
- Narration during demo
- Q&A preparation
- Judge materials

---

## Handoff Points

| From | To | What | When |
|------|-----|------|------|
| Karan | M4 | Contract ABIs + deployed addresses | Hour 3 |
| Karan | M2 | Contract ABIs + event signatures | Hour 3 |
| Karan | M3 | Wagmi config + chain details | Hour 3 |
| M4 | M2 | Daemon event stream schema | Hour 5 |
| M2 | M3 | API documentation + endpoints | Hour 6 |
| M4 | M2 | Indexed on-chain data | Hour 6 |
| All | M5 | Screenshots + metrics for pitch deck | Hour 8 |

---

## Critical Path

**Karan (Contracts) → M4 (Daemon + Indexer) → M2 (Backend API) → M3 (Frontend)**

- Karan blocks everyone — contracts must deploy first
- M4 blocks M2 — indexer must exist before API can serve data
- M2 blocks M3 — API must exist before frontend can display data
- M5 is parallel — documentation happens throughout

## Communication

- **Discord/Slack channel**: #dicompute-build
- **Standups**: Every 2 hours
- **Blockers**: Escalate immediately to Karan
- **Code reviews**: Karan reviews all PRs touching blockchain logic

## Definition of Done

- [ ] Karan: All contracts deployed to XDC Apothem
- [ ] M4: Daemon can execute Docker jobs end-to-end
- [ ] M2: Backend API serves correct data
- [ ] M3: Frontend can submit jobs and view receipts
- [ ] M5: Pitch deck ready
- [ ] All: E2E demo completed successfully
