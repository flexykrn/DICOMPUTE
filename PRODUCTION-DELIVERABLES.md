# NoCapCompute (DICOMPUTE) - Production Deliverables

## Current Status: V1 MVP (Hackathon)

---

## V1 → V2 → V3 → V4 Roadmap

### V1 - Hackathon MVP (DONE)
- ✅ Smart Contracts deployed
- ✅ Frontend Next.js 14
- ✅ FastAPI backend
- ✅ Mock provider
- ✅ Polling-based updates

### V2 - Closed Alpha (1 Week After)
**Backend (Your Area):**
- [ ] PostgreSQL migration (SQLite → PostgreSQL)
- [ ] Event indexer (background async)
- [ ] WebSocket real-time updates
- [ ] IPFS integration
- [ ] Provider dashboard APIs
- [ ] Job cancellation
- [ ] Error handling & retry logic

**DevOps:**
- [ ] Real Docker provider script
- [ ] CI/CD pipeline

### V3 - Provider Beta (2-3 Weeks After V2)
**Backend:**
- [ ] Go daemon (replaces Python)
- [ ] Reverse auction engine
- [ ] Job matching algorithm
- [ ] Redis caching
- [ ] API keys for power users
- [ ] Webhook system
- [ ] Real-time log viewer

**Features:**
- [ ] Challenge/slashing UI
- [ ] Provider onboarding
- [ ] Job templates
- [ ] Dataset mounting

### V4 - Production v1.0 (1-2 Months After V3)
**Enterprise:**
- [ ] Audit PDF export
- [ ] SSO integration
- [ ] Compliance templates (NSF/NIH/EU)
- [ ] Multi-user teams
- [ ] SLA dashboard

**Payments:**
- [ ] ERC-20 stablecoins
- [ ] $DCP token
- [ ] Fiat on-ramp
- [ ] Subscription plans

**Advanced:**
- [ ] Multi-container deployments
- [ ] Distributed training
- [ ] Inference endpoints
- [ ] Multi-chain support

---

## Critical Fixes Needed NOW (V1 Completion)

| # | Issue | File | Priority |
|---|-------|------|----------|
| 1 | Receipt NFT not stored in backend | `backend/indexer.py` | 🔴 HIGH |
| 2 | GPU provider missing event listener | `scripts/gpu_provider.py` | 🔴 HIGH |
| 3 | Fake result capture (hardcoded CID) | `scripts/gpu_provider.py` | 🔴 HIGH |

---

## Production Checklist

### Backend
- [ ] PostgreSQL (not SQLite)
- [ ] Event indexer running
- [ ] WebSocket connections
- [ ] IPFS uploads working
- [ ] Error handling & retries
- [ ] API documentation (OpenAPI)
- [ ] Logging & monitoring

### Smart Contracts
- [ ] All events emitted correctly
- [ ] Foundry test suite passing
- [ ] Contract verification on explorer

### DevOps
- [ ] Docker provider script
- [ ] CI/CD pipeline
- [ ] Staging environment
- [ ] Systemd service

### Security
- [ ] Input validation
- [ ] Rate limiting
- [ ] CORS configured
- [ ] Environment variables secure
