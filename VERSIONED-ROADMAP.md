# DICOMPUTE — Versioned Product Roadmap (Nothing Cut, Just Staged)

> **Philosophy:** Every feature from the original plan survives. We ship in self-contained versions. Each version is demoable and useful on its own. No version blocks the next.

---

## Version Matrix

| Version | Name | Time | Goal | Demo Narrative |
|---------|------|------|------|----------------|
| **V1** | Hackathon MVP | 6 hours | Happy path works once | "Submit job → heartbeat → receipt NFT" |
| **V2** | Closed Alpha | 1 week | Team can run real jobs internally | "Run an actual PyTorch training job on our provider" |
| **V3** | Provider Beta | 2–3 weeks | External providers join, marketplace live | "List your GPU, earn XDC, build reputation" |
| **V4** | Production v1.0 | 1–2 months | Grant funders audit receipts, compliance-ready | "Attach this NFT to your NSF/NIH/EU grant report" |

---

## V1 — Hackathon MVP (6 Hours)

> **Rule:** If it doesn't make the 3-minute demo better, it moves to V2. Period.

### V1 Included

#### Smart Contracts (Already Written — Deploy Only)
- [ ] `JobEscrow.sol` — submit, claim, heartbeat, complete
- [ ] `GPURegistry.sol` — register, stake, stats
- [ ] `ReputationSystem.sol` — score tracking (minimal read-only)
- [ ] `ProofReceipt.sol` — ERC-721 mint on completion
- [ ] **Deploy to XDC Apothem testnet** (or Anvil fallback)
- [ ] **Verify on Apothem explorer** so judges can click links

#### Frontend (Next.js 14)
- [ ] `/` — Landing page with hero, stats, CTAs
- [ ] `/wizard` — Job submission wizard (Docker URI, sliders, submit)
- [ ] `/jobs/[id]` — Job status page with heartbeat chart (Recharts)
- [ ] `/receipts/[id]` — ProofReceipt NFT display + verify link
- [ ] `/explorer` — Public job list (read-only table)
- [ ] Wallet connect (MetaMask / XDCPay) with XDC Apothem config
- [ ] Wagmi hooks: `useSubmitJob`, `useGetJob`, `useGetReceipt`
- [ ] 5-second polling for heartbeat updates (no WebSocket)

#### Backend (Python + SQLite)
- [ ] FastAPI scaffold with CORS
- [ ] SQLite schema: `jobs`, `heartbeats` tables
- [ ] `POST /api/jobs/{id}/heartbeat` — store heartbeat data
- [ ] `GET /api/jobs/{id}/heartbeats` — return list for charting
- [ ] `GET /api/jobs` — list all jobs with filters
- [ ] `GET /api/stats` — mock network stats

#### Mock Provider (Python Script — Not Go)
- [ ] Polls `JobSubmitted` events from `JobEscrow`
- [ ] Calls `claimJob()` on-chain
- [ ] Sends 6 signed heartbeats over 30 seconds
- [ ] Calls `submitResults()` with mock CID
- [ ] Colored terminal output for demo visibility
- [ ] Runs in a terminal tab next to the demo

#### Demo Assets
- [ ] Pre-submitted demo job with completed receipt (backup)
- [ ] 90-second screen recording (backup if live fails)
- [ ] 5-slide pitch deck (Problem, Solution, Demo, Tech, Ask)
- [ ] README with setup instructions and architecture diagram

### V1 Explicitly Excluded (Moves to V2)

| Feature | Why Excluded | V2 Owner |
|---------|-------------|----------|
| **Real Go daemon** | Too complex for 6 hours; Python script proves the concept | DevOps |
| **PostgreSQL** | SQLite is zero-config; schema migration overhead | Backend |
| **Real Docker execution** | Judges can't see containers; mock logs are enough | DevOps |
| **Slashing UI / challenge button** | Risky in live demo; keep in contract but hidden | Frontend |
| **WebSocket real-time** | Polling is reliable enough; WebSocket adds failure surface | Backend |
| **Real IPFS upload** | Mock CID with metadata; real storage in V2 | Backend |
| **Provider registration dashboard** | Pre-register one mock provider for demo | Frontend |
| **Provider auto-claim / matching** | Manual claim only; auto-bidding in V2 | Backend |
| **Foundry test suite** | One happy-path test is enough; full coverage in V2 | SC Lead |
| **IComputeMarketplace interface** | Tight coupling is fine for MVP; refactor in V2 | SC Lead |
| **Multi-chain support** | XDC Apothem only; mainnet bridge in V4 | SC Lead |
| **CLI / SDK** | Web-only for hackathon; CLI in V3 | Backend |
| **Audit PDF export** | JSON download is enough; styled PDF in V3 | Frontend |
| **Notification system** | Demo is synchronous; email/Discord alerts in V3 | Backend |
| **ENS / avatar support** | Wallet address display only; profile features in V3 | Frontend |

### V1 Acceptance Criteria
- [ ] User can submit a job from `/wizard` and see it on-chain
- [ ] Mock provider claims the job within 30 seconds
- [ ] Heartbeat chart populates with 6 data points over 30 seconds
- [ ] Job status changes to "Completed" and receipt button appears
- [ ] Receipt page shows job details, provider, cost, and verify link
- [ ] Verify link opens Apothem explorer with correct token ID
- [ ] Explorer page shows list of all jobs (at least the demo one)
- [ ] Landing page loads in under 3 seconds
- [ ] Demo works end-to-end without manual intervention

### V1 Dependencies
- [ ] XDC Apothem testnet accessible (or Anvil node)
- [ ] MetaMask or XDCPay installed with Apothem config
- [ ] Demo wallet funded with >10 XDC
- [ ] Python 3.10+ installed for mock provider
- [ ] Node.js 18+ installed for Next.js

---

## V2 — Closed Alpha (1 Week After Hackathon)

> **Goal:** The team can run real training jobs internally. Move from demo to dogfood.

### V2 New Features

#### Backend (Upgrade to PostgreSQL + Real Infra)
- [ ] Migrate SQLite → PostgreSQL (async SQLAlchemy)
- [ ] Event indexer: background async task listening to `JobSubmitted`, `JobClaimed`, `HeartbeatReceived`, `JobCompleted`, `ProviderSlashed`
- [ ] WebSocket server: `/ws/jobs/{id}` for real-time heartbeat streaming (replaces polling)
- [ ] IPFS integration: Pinata or Web3.Storage API for real result uploads
- [ ] Docker Compose: PostgreSQL + backend + Redis (for WebSocket pub/sub)
- [ ] Environment config: `.env` for local, staging, production

#### Frontend (Polish + Real Data)
- [ ] WebSocket client: replace 5-second polling with WebSocket connection
- [ ] Provider dashboard: `/provider/dashboard` with stats, earnings, active jobs
- [ ] Provider registration: `/provider/register` with metadata form + stake input
- [ ] Job cancellation: `/jobs/[id]` "Cancel" button for Pending jobs
- [ ] Reputation display: provider score badge on job detail and provider cards
- [ ] Error handling: toast notifications (Sonner), error boundaries, retry logic
- [ ] Loading states: skeleton screens for all async data
- [ ] Responsive design: mobile layout for all pages

#### Smart Contracts (Tests + Refactor)
- [ ] Foundry test suite: `JobEscrow.t.sol` with 100% happy-path + edge case coverage
- [ ] `IComputeMarketplace.sol` extracted interface for future upgrades
- [ ] Gas optimization: reduce heartbeat verification cost by 15%
- [ ] Deploy to fresh Apothem instance for alpha testing
- [ ] Contract verification on all deployed instances

#### Mock Provider → Real Script (Still Python, But Real Docker)
- [ ] Docker Engine API integration: `docker pull`, `docker run`, `docker logs`
- [ ] Resource enforcement: cgroups for CPU/RAM limits
- [ ] Real PyTorch container: `docker.io/pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime`
- [ ] Result capture: stdout/stderr saved to file, uploaded to IPFS
- [ ] Config file: `provider.yaml` for credentials, resource limits, auto-claim toggle
- [ ] Log forwarding: send container logs to backend WebSocket for live viewing

#### DevOps / Tooling
- [ ] GitHub Actions CI: lint, test, build on PR
- [ ] Pre-commit hooks: `black`, `ruff`, `prettier`, `eslint`
- [ ] Staging environment: Vercel (frontend) + Railway/Render (backend)
- [ ] Domain: `alpha.dicompute.xyz` or similar
- [ ] Sentry integration: error tracking for frontend and backend

### V2 Excluded (Moves to V3)

| Feature | Why Excluded | V3 Owner |
|---------|-------------|----------|
| **Go daemon** | Python script is functional; Go rewrite for performance in V3 | DevOps |
| **Multi-container deployments** | Single container is fine for alpha; SDL-like support in V3 | Backend |
| **Persistent volumes / datasets** | Jobs are stateless; mount support in V3 | DevOps |
| **Auto-bidding / reverse auction** | Fixed price + manual claim; auction in V3 | Backend |
| **Slashing UI** | Still hidden; challenge flow for external providers in V3 | Frontend |
| **External provider onboarding** | Team-only providers; open registration in V3 | Frontend |
| **Payment in stablecoins (ERC-20)** | Native XDC only; USDC/XDCe in V4 | SC Lead |
| **Explorer advanced filters** | Basic list; faceted search in V3 | Frontend |
| **Audit PDF export** | JSON download is fine; styled reports in V3 | Frontend |
| **Notifications (email/Discord)** | Not critical for alpha; alerting in V3 | Backend |

### V2 Acceptance Criteria
- [ ] Team member can submit a real PyTorch job from the wizard
- [ ] Provider script runs on a team member's laptop with real Docker
- [ ] Job runs actual training code (e.g., MNIST) and produces a real result file
- [ ] Result file is uploaded to IPFS and CID is stored on-chain
- [ ] Heartbeat chart updates in real-time via WebSocket (no polling)
- [ ] Provider dashboard shows earnings, reputation, and job history
- [ ] Job cancellation works: user gets refund, job removed from pending
- [ ] All contracts have passing Foundry tests
- [ ] Staging environment is live and accessible to team
- [ ] README includes setup instructions for new team members

### V2 → V3 Handoff Requirements
- [ ] PostgreSQL schema is stable (no breaking migrations expected)
- [ ] Contract interface is finalized (no function signature changes)
- [ ] Backend API is documented (OpenAPI / Swagger)
- [ ] Frontend component library is consistent (Shadcn variants locked)
- [ ] Docker provider script is documented and reproducible

---

## V3 — Provider Beta (2–3 Weeks After V2)

> **Goal:** External GPU owners join the network. Marketplace is live with real providers and real users.

### V3 New Features

#### Go Daemon (Replaces Python Script)
- [ ] `cmd/daemon/main.go` — Cobra CLI with `start`, `register`, `status` commands
- [ ] `internal/provisioner/docker.go` — Docker Engine API wrapper with cgroup enforcement
- [ ] `internal/verifier/signer.go` — EIP-712 typed data signing with `go-ethereum/crypto`
- [ ] `internal/heartbeat/broadcaster.go` — Background ticker, RPC submission with exponential backoff
- [ ] `internal/watcher/watcher.go` — Event listener for `JobSubmitted`, auto-claim toggle
- [ ] `internal/ipfs/uploader.go` — IPFS upload via kubo client or Pinata API
- [ ] `internal/config/config.go` — Viper-based config: env, flags, YAML file
- [ ] Cross-platform builds: Linux, macOS, Windows binaries via GitHub Actions
- [ ] Systemd service file for Linux providers
- [ ] Daemon logs: structured JSON to stdout + file rotation

#### Provider Experience
- [ ] Provider console: web-based provider management (alternative to CLI)
- [ ] Auto-claim / manual claim toggle: provider sets preference
- [ ] Health check endpoint: `/health` on daemon HTTP server
- [ ] Provider reputation leaderboard: `/providers` page with ranking
- [ ] Provider analytics: earnings per day, job success rate, uptime percentage
- [ ] Stake top-up / withdrawal UI: `/provider/settings` with form
- [ ] Provider metadata update: GPU model, region, pricing changes
- [ ] Provider onboarding guide: step-by-step docs + video

#### Marketplace Features
- [ ] **Reverse auction**: providers bid on jobs, user accepts lowest bid
- [ ] Job matching engine: auto-assign job to best provider based on reputation + price
- [ ] Provider filtering: by GPU model, region, reputation score, price
- [ ] Job queuing: if no provider available, job waits in queue with priority
- [ ] Estimated wait time: based on active provider capacity
- [ ] Job retry: if provider fails, auto-reassign to next best provider

#### Challenge / Slashing UI
- [ ] Challenge button on `/jobs/[id]`: visible when heartbeat timeout exceeded
- [ ] Challenge flow: MetaMask confirmation, bounty preview, success toast
- [ ] Slashed provider badge: visible on provider profile and explorer
- [ ] Challenger history: list of successful challenges + bounty earned
- [ ] Dispute resolution dashboard: for team to review contested slashes

#### User Experience
- [ ] Job templates: pre-configured wizards for common tasks (PyTorch, TensorFlow, LLM fine-tuning)
- [ ] Dataset mounting: upload dataset to IPFS, mount into job container
- [ ] Checkpoint saving: save model checkpoints to IPFS during long training runs
- [ ] Job logs: real-time container log viewer via WebSocket
- [ ] Job notifications: email or webhook on job completion/failure
- [ ] Job sharing: public link to job details without wallet connection
- [ ] Spending dashboard: `/dashboard` with monthly spend, job history, cost trends

#### Backend
- [ ] Redis: caching for provider list, job stats, reputation scores
- [ ] Rate limiting: API throttling to prevent abuse
- [ ] API keys: programmatic access for power users
- [ ] Webhook system: send job events to external URLs
- [ ] Advanced analytics: job completion rate, provider churn, revenue trends
- [ ] Admin panel: `/admin` for team to manage providers, disputes, featured jobs

### V3 Excluded (Moves to V4)

| Feature | Why Excluded | V4 Owner |
|---------|-------------|----------|
| **Stablecoin payments (USDC/XDCe)** | Native XDC is sufficient; stablecoin adds complexity | SC Lead |
| **Multi-chain deployment (Polygon, Arbitrum)** | XDC ecosystem focus; cross-chain in V4 | SC Lead |
| **ZK-proof of training** | Research-phase feature; too complex for beta | Research |
| **Fiat on-ramp (credit card)** | Crypto-native users only; fiat in V4 | Backend |
| **Enterprise SSO / teams** | Individual wallets only; org accounts in V4 | Backend |
| **SLA guarantees / insurance** | Marketplace is best-effort; insurance layer in V4 | Product |
| **Mobile app** | Responsive web is sufficient; native app in V4 | Mobile |
| **DAO governance** | Team controls parameters; governance in V4 | SC Lead |
| **Audit by external security firm** | Internal tests + bug bounty; formal audit in V4 | Security |

### V3 Acceptance Criteria
- [ ] External provider can register, download daemon, and run jobs within 30 minutes
- [ ] Marketplace has >5 active providers with real GPU hardware
- [ ] >100 jobs completed successfully in a 7-day period
- [ ] Reverse auction produces prices 20% below fixed max price
- [ ] Challenge mechanism is used at least once (by team or user) and works correctly
- [ ] Provider reputation leaderboard shows meaningful differentiation
- [ ] Job templates reduce wizard setup time by 50%
- [ ] No critical bugs or security issues in 14 days of beta
- [ ] Daemon runs stable for 7 days without restart (memory leak test)
- [ ] Support channel (Discord/Telegram) responds to provider issues within 4 hours

### V3 → V4 Handoff Requirements
- [ ] Go daemon is stable and cross-platform
- [ ] Marketplace has organic supply (providers not on team payroll)
- [ ] Contract upgrade path is documented (proxy pattern or migration)
- [ ] Revenue model is clear: take rate, staking, or subscription
- [ ] Legal entity formed for enterprise contracts

---

## V4 — Production v1.0 (1–2 Months After V3)

> **Goal:** Grant funders, enterprises, and compliance auditors use DICOMPUTE receipts as standard proof. Platform is self-sustaining.

### V4 New Features

#### Enterprise & Compliance
- [ ] **Audit PDF export**: styled PDF with official letterhead, signatures, chain verification
- [ ] **Receipt verification API**: third-party verification service for grant portals
- [ ] **Enterprise dashboard**: multi-user team accounts with role-based access
- [ ] **SSO integration**: Google Workspace, Okta, SAML
- [ ] **Compliance templates**: NSF, NIH, EU Horizon, Wellcome Trust receipt formats
- [ ] **Audit trail**: immutable log of all receipt verifications with timestamps
- [ ] **Data residency controls**: job runs in specific geographic regions
- [ ] **SLA dashboard**: uptime guarantees, penalty tracking, insurance claims

#### Payments & Tokenomics
- [ ] **ERC-20 stablecoin support**: USDC, USDT, XDCe payment in escrow
- [ ] **Token launch**: $DCP utility token for staking, discounts, governance
- [ ] **Staking rewards**: providers earn $DCP for high reputation + uptime
- [ ] **Revenue sharing**: platform fee (5-10%) split between treasury, stakers, and burn
- [ ] **Fiat on-ramp**: MoonPay or Stripe integration for credit card → XDC
- [ ] **Subscription plans**: monthly compute credits for power users
- [ ] **Referral program**: on-chain referral tracking with $DCP rewards

#### Advanced Compute
- [ ] **Multi-container deployments**: Docker Compose-style job specs
- [ ] **Persistent volumes**: attach IPFS-mounted datasets and save checkpoints
- [ ] **Distributed training**: multi-node jobs with MPI/NCCL communication
- [ ] **Inference endpoints**: deploy trained models as persistent API services
- [ ] **Serverless functions**: lightweight compute without container startup time
- [ ] **Private container registries**: support for authenticated Docker pulls
- [ ] **Custom VM images**: provider-defined base images (not just Docker Hub)

#### Network & Governance
- [ ] **Multi-chain deployment**: Polygon, Arbitrum, Base for lower gas fees
- [ ] **Bridge**: cross-chain receipt verification and job migration
- [ ] **DAO governance**: $DCP holders vote on protocol parameters, fee changes, upgrades
- [ ] **Treasury management**: on-chain treasury for grants, ecosystem development
- [ ] **Bug bounty program**: Immunefi or Sherlock integration for security
- [ ] **Formal audit**: Trail of Bits, OpenZeppelin, or CertiK audit of all contracts
- [ ] **Insurance layer**: Nexus Mutual or similar for provider default coverage

#### Mobile & SDK
- [ ] **React Native app**: submit jobs, monitor progress, receive receipts on mobile
- [ ] **Python SDK**: `pip install dicompute` for programmatic job submission
- [ ] **JavaScript/TypeScript SDK**: `npm install @dicompute/sdk` for web apps
- [ ] **Go SDK**: `go get github.com/dicompute/sdk` for backend integrations
- [ ] **CLI v2**: `dicompute jobs submit`, `dicompute providers list`, `dicompute receipts verify`
- [ ] **Jupyter extension**: submit training jobs directly from notebook cells
- [ ] **Hugging Face integration**: one-click training from model cards

#### Infrastructure
- [ ] **Global CDN**: Cloudflare or Fastly for frontend assets and API edge caching
- [ ] **Kubernetes**: backend runs on EKS/GKE with auto-scaling
- [ ] **Dedicated RPC nodes**: self-hosted XDC nodes for reliability (not just public RPC)
- [ ] **Monitoring**: Datadog or Grafana for uptime, latency, error tracking
- [ ] **Disaster recovery**: automated backups, region failover, contract pause mechanism
- [ ] **Rate limiting v2**: DDoS protection, sybil resistance, provider reputation gating

### V4 Excluded (Future Versions)

| Feature | Why Excluded | Future Version |
|---------|-------------|----------------|
| **Decentralized sequencer (L2)** | XDC throughput is sufficient; L2 if scale demands | V5 |
| **Hardware enclaves (TEE)** | Intel SGX/AMD SEV for verified execution | V5 |
| **Federated learning** | Privacy-preserving distributed training | V5 |
| **Quantum-resistant signatures** | Post-quantum cryptography research | V5 |
| **Physical GPU marketplace** | Buy/sell GPU hardware, not just compute | V5 |
| **Carbon offset integration** | Green compute credits per job | V5 |

### V4 Acceptance Criteria
- [ ] Platform processes >10,000 jobs per month with 99.9% uptime
- [ ] >50 external providers with sustained engagement
- [ ] Revenue covers infrastructure costs + team salaries
- [ ] Grant funders (e.g., academic institutions) reference DICOMPUTE receipts in official reports
- [ ] Security audit completed with no critical findings
- [ ] DAO governance proposal successfully passes and executes on-chain
- [ ] Mobile app has >1,000 downloads with 4+ star rating
- [ ] SDK used by >10 external projects
- [ ] Platform is cash-flow positive or within 6 months of profitability
- [ ] Brand recognition: mentioned in 3+ major tech/crypto publications

---

## Cross-Version Dependency Graph

```
V1 (Hackathon MVP)
├── Smart contracts deployed
├── Frontend shell + wizard + receipt
├── Python mock provider
└── SQLite backend
    │
    ▼
V2 (Closed Alpha)
├── PostgreSQL + event indexer
├── WebSocket real-time
├── Real Docker in Python provider
├── Provider dashboard
├── Foundry tests + IComputeMarketplace interface
└── CI/CD + staging environment
    │
    ▼
V3 (Provider Beta)
├── Go daemon replaces Python
├── Reverse auction marketplace
├── Challenge/slashing UI
├── Job templates + datasets
├── Provider onboarding + reputation
└── Redis + API keys + webhooks
    │
    ▼
V4 (Production v1.0)
├── Multi-chain deployment
├── Stablecoin + $DCP token
├── Enterprise SSO + compliance
├── Distributed training + inference
├── Mobile app + SDKs
├── DAO governance + audit
└── Global infrastructure + monitoring
```

---

## Version Handoff Checklist

When moving from V1 → V2, V2 → V3, or V3 → V4:

- [ ] **Schema freeze:** Database schema changes require migration scripts
- [ ] **Contract freeze:** No function signature changes without upgrade path
- [ ] **API freeze:** Backend endpoints versioned (`/api/v2/...`) if breaking changes needed
- [ ] **Documentation:** README, API docs, and provider guides updated
- [ ] **Regression tests:** All previous version acceptance criteria still pass
- [ ] **Performance baseline:** Load test before shipping; no 2x latency regression
- [ ] **Rollback plan:** Previous version deployable within 30 minutes if disaster
- [ ] **Team retro:** What worked, what didn't, what to change next version

---

## Agent Execution Order (Hermes + OpenClaw)

### V1 Execution (Parallel Tracks)

| Track | Agent | Tasks | Estimated Time |
|-------|-------|-------|----------------|
| **Contracts** | Hermes + OpenClaw review | Deploy, verify, fix if needed | 30 min |
| **Frontend scaffold** | Hermes | Landing, wizard, job detail, receipt, explorer | 90 min |
| **Backend scaffold** | Hermes | FastAPI + SQLite + heartbeat endpoints | 60 min |
| **Mock provider** | Hermes | Python script with event polling + heartbeats | 60 min |
| **Integration** | OpenClaw + team | Wire frontend ↔ backend ↔ chain | 90 min |
| **Polish** | Hermes | Styling, animations, demo shortcuts | 60 min |
| **Demo prep** | Team | Video recording, pitch deck, rehearsal | 30 min |

### V2 Execution (Sequential + Parallel)

| Phase | Agent | Tasks | Estimated Time |
|-------|-------|-------|----------------|
| **Schema migration** | Hermes | SQLite → PostgreSQL, Alembic migrations | 1 day |
| **Event indexer** | Hermes | Async Web3.py listener, background task | 1 day |
| **WebSocket** | Hermes | Backend WS manager + frontend client | 1 day |
| **Real Docker provider** | Hermes | Python script with Docker SDK, cgroups | 1 day |
| **Provider dashboard** | Hermes | `/provider/*` pages, registration, stats | 1 day |
| **Contract tests** | Hermes + OpenClaw | Foundry tests, interface extraction, gas opt | 1 day |
| **CI/CD + staging** | DevOps | GitHub Actions, Vercel, Railway deploy | 1 day |
| **Integration week** | Team + OpenClaw | End-to-end testing, bug fixing, polish | 2 days |

### V3 Execution (Go Daemon Focus)

| Phase | Agent | Tasks | Estimated Time |
|-------|-------|-------|----------------|
| **Go daemon core** | Hermes | Cobra CLI, Docker provisioner, EIP-712 signer | 3 days |
| **Heartbeat + watcher** | Hermes | Background ticker, event listener, IPFS uploader | 2 days |
| **Marketplace backend** | Hermes | Reverse auction, matching engine, provider filter | 2 days |
| **Marketplace frontend** | Hermes | Auction UI, provider cards, job templates | 2 days |
| **Challenge UI** | Hermes | Challenge button, slash flow, provider badge | 1 day |
| **Go build + release** | DevOps | Cross-platform binaries, systemd, GitHub Actions | 1 day |
| **Beta launch** | Team + OpenClaw | Provider onboarding, bug fixing, support | 3 days |

### V4 Execution (Enterprise + Scale)

| Phase | Agent | Tasks | Estimated Time |
|-------|-------|-------|----------------|
| **Token + payments** | Hermes | ERC-20 integration, staking, revenue share | 2 weeks |
| **Enterprise features** | Hermes | SSO, teams, audit PDF, compliance templates | 2 weeks |
| **Multi-chain** | Hermes | Bridge, deployment, verification | 1 week |
| **Advanced compute** | Hermes | Distributed training, inference, volumes | 2 weeks |
| **Mobile + SDK** | Hermes | React Native, Python/JS/Go SDKs, CLI | 2 weeks |
| **Governance** | Hermes + SC Lead | DAO contracts, voting, treasury | 1 week |
| **Infrastructure** | DevOps | K8s, CDN, monitoring, disaster recovery | 1 week |
| **Audit + launch** | Team + external | Security audit, bug bounty, mainnet launch | 1 week |

---

## Summary: What to Build When

| If you need... | Build version | Time | Team size |
|---------------|-------------|------|-----------|
| A hackathon demo | **V1** | 6 hours | 5 people |
| Internal dogfooding | **V2** | 1 week | 3–4 people |
| External providers + users | **V3** | 2–3 weeks | 5–7 people |
| Enterprise + revenue | **V4** | 1–2 months | 8–12 people |
| Category killer vs. Akash | **V4 + moat expansion** | 3–6 months | 12+ people |

**V1 is the demo. V2 is real. V3 is a marketplace. V4 is a business.**

Execute in order. Don't skip. Each version funds and validates the next.
