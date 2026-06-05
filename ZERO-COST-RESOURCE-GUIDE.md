# DICOMPUTE — Zero-Cost Resource Guide + Credential Checklist

> **Reality Check:** You cannot build V4 in one day. Not with 5 people. Not with 100 agents. V4 is a 1-2 month production build with legal entities, audits, and token launches. However, with 5 people + Hermes + OpenClaw, you CAN build **V1 + V2 + V3 scaffolding** in one intense day (12-16 hours). This document shows you how to do it for **$0**.

---

## What You Can Actually Build Today (Be Honest)

| Version | Time Required | Can Build Today? | What You'll Have |
|---------|---------------|------------------|------------------|
| **V1** | 6 hours | ✅ Yes | Working demo: submit job → heartbeat → receipt NFT |
| **V2** | +4 hours | ✅ Yes | Real Docker jobs, PostgreSQL, WebSocket, provider dashboard, tests |
| **V3** | +6 hours | ⚠️ Scaffold Only | Go daemon folders, matching engine structure, no working binaries |
| **V4** | +1-2 months | ❌ No | Token, mobile, audit, enterprise — impossible in 24 hours |

**Realistic one-day goal:** Ship a working V1-V2 demo with V3 architecture visible in the codebase. Judges see a working product + a credible roadmap.

---

## What I Need From You (Credential Checklist)

### Required Before Hour 0 (You Must Provide)

| Item | Why | How to Get | Cost |
|------|-----|------------|------|
| **XDC Apothem wallet + private key** | Deploy contracts, run demo transactions | [XDCPay](https://chrome.google.com/webstore/detail/xdcpay/bocpokmlmjbfbhenkpjmbbjjdcmoinlk) or MetaMask custom network | Free |
| **Apothem testnet XDC (faucet)** | Gas for contract deploy + demo transactions | [Apothem Faucet](https://faucet.apothem.network/) — request early | Free |
| **GitHub account** | Repo hosting, GitHub Actions CI, Vercel deploy | [github.com](https://github.com) | Free |
| **Vercel account** | Frontend hosting (Next.js) | [vercel.com](https://vercel.com) — connect GitHub | Free tier |
| **Railway / Render account** | Backend hosting (FastAPI) | [railway.app](https://railway.app) or [render.com](https://render.com) | Free tier |
| **Pinata account (optional)** | IPFS file hosting for real results | [pinata.cloud](https://pinata.cloud) — free tier: 1GB | Free |
| **Alchemy / Infura (optional)** | Reliable XDC RPC (fallback to public) | Alchemy has free tier, or use public `rpc.apothem.network` | Free |

### If Apothem Faucet Is Dry (Backup Plan)

| Item | Why | How to Get | Cost |
|------|-----|------------|------|
| **Anvil (local node)** | Local blockchain for demo if testnet fails | `foundryup` then `anvil --fork-url https://rpc.apothem.network` | Free |
| **Pre-funded Anvil accounts** | 10,000 ETH each, instant | Anvil generates 10 accounts on startup | Free |
| **Switch MetaMask to localhost:8545** | Point wallet to local node | Add network: RPC `http://localhost:8545`, Chain ID `51` | Free |

**Verdict:** Anvil is MORE reliable for a hackathon demo. Apothem is more impressive ("it's on a real testnet"). Have both ready. Start with Apothem, fallback to Anvil.

---

## Zero-Cost Resource Stack (Everything Free)

### Blockchain / Smart Contracts

| Resource | What For | Free Tier | Limitation |
|----------|----------|-----------|------------|
| **Foundry** | Solidity compile, test, deploy | Open source | None |
| **Anvil** | Local EVM node | Open source | None |
| **Cast** | CLI interaction with contracts | Open source | None |
| **Apothem Testnet** | Public XDC testnet | Free | Faucet may be slow |
| **Apothem Explorer** | Verify contracts, view transactions | Free | None |
| **OpenZeppelin Contracts** | ERC-721, Ownable, ReentrancyGuard | MIT License | None |
| **Solmate (optional)** | Gas-optimized alternatives | Open source | None |

### Frontend

| Resource | What For | Free Tier | Limitation |
|----------|----------|-----------|------------|
| **Next.js 14** | React framework | Open source (MIT) | None |
| **Tailwind CSS** | Styling | Open source | None |
| **Shadcn/ui** | Pre-built components | Open source | None |
| **Wagmi v2** | Web3 React hooks | Open source | None |
| **Viem** | Ethereum client | Open source | None |
| **RainbowKit** | Wallet connection UI | Open source | None |
| **Recharts** | Charts/graphs | Open source | None |
| **Sonner** | Toast notifications | Open source | None |
| **React Hook Form** | Form handling | Open source | None |
| **Zod** | Schema validation | Open source | None |
| **Vercel** | Hosting | Free tier: 100GB bandwidth, 6000 build minutes/month | None for demo |
| **Google Fonts / Font Awesome** | Icons & typography | Free | None |

### Backend

| Resource | What For | Free Tier | Limitation |
|----------|----------|-----------|------------|
| **Python 3.12** | Runtime | Open source | None |
| **FastAPI** | Web framework | Open source | None |
| **Uvicorn** | ASGI server | Open source | None |
| **SQLite** | Database (V1) | Built into Python | None |
| **PostgreSQL** | Database (V2+) | Self-hosted or Railway free tier | Railway: 500MB storage |
| **SQLAlchemy** | ORM | Open source | None |
| **Alembic** | Migrations | Open source | None |
| **Web3.py** | XDC blockchain interaction | Open source | None |
| **eth-account** | Signing transactions | Open source | None |
| **python-docker** | Docker API client | Open source | None |
| **Pytest** | Testing | Open source | None |
| **Railway / Render** | Hosting | Free tier: 512MB RAM, sleeps after inactivity | Fine for demo |
| **Ngrok (optional)** | Local tunnel for testing | Free: 1 concurrent tunnel | Random URL |
| **LocalTunnel (alternative)** | Local tunnel | Free | None |

### Go / Daemon (V2+ Scaffold)

| Resource | What For | Free Tier | Limitation |
|----------|----------|-----------|------------|
| **Go 1.22** | Runtime | Open source | None |
| **Cobra** | CLI framework | Open source | None |
| **Docker SDK for Go** | Container management | Open source | None |
| **go-ethereum** | XDC signing, EIP-712 | Open source | None |
| **Viper** | Config management | Open source | None |
| **Zap** | Logging | Open source | None |

### DevOps / Tools

| Resource | What For | Free Tier | Limitation |
|----------|----------|-----------|------------|
| **Git** | Version control | Open source | None |
| **GitHub** | Repo hosting | Unlimited public repos | Public only |
| **GitHub Actions** | CI/CD | 2000 minutes/month free | Enough for demo |
| **Docker Desktop** | Local containers | Free for personal use | None |
| **VS Code** | IDE | Free | None |
| **Foundry VS Code extension** | Solidity syntax | Free | None |
| **Thunder Client / Postman** | API testing | Free tier | None |
| **Figma (optional)** | UI mockups | Free tier: 3 projects | Enough for wireframes |
| **Excalidraw** | Diagrams | Open source | None |
| **OBS Studio** | Demo recording | Open source | None |

### IPFS / Storage (V2+)

| Resource | What For | Free Tier | Limitation |
|----------|----------|-----------|------------|
| **Kubo (go-ipfs)** | Self-hosted IPFS node | Open source | Run locally |
| **Pinata** | Managed IPFS pinning | 1GB storage, 100 requests/day | Enough for demo |
| **Web3.Storage** | IPFS + Filecoin | Free tier: 5GB | Sign up required |
| **NFT.Storage** | NFT metadata storage | Free tier: 31GB | Good for receipts |
| **Mock CID** | Fake IPFS hash for V1 demo | `QmPyTorchTrainingDemo1234567890abcdef` | Not real |

---

## What Costs Money (Avoid for Hackathon)

| Service | Cost | Why Avoid | Free Alternative |
|---------|------|-----------|----------------|
| **AWS / GCP / Azure** | $10-100/month | Overkill, complex billing | Railway, Render, Vercel |
| **Etherscan API Pro** | $199/month | Contract verification | Apothem explorer (free) |
| **Alchemy Growth** | $49/month | Higher rate limits | Public RPC + Anvil fallback |
| **Infura Paid** | $50/month | Dedicated nodes | Public RPC + Anvil |
| **Vercel Pro** | $20/month | Team features, more bandwidth | Free tier is enough |
| **Figma Pro** | $12/month | Unlimited projects | Free tier: 3 projects |
| **Pinata Premium** | $20/month | More storage | Free tier: 1GB |
| **Cloudflare Pro** | $20/month | CDN, SSL | Free tier is enough |
| **Datadog / New Relic** | $15-50/month | Monitoring | Grafana + Prometheus (open source) |
| **SendGrid / Mailgun** | $10-20/month | Email notifications | Skip for demo |
| **Twilio** | $0.0075/SMS | SMS notifications | Skip for demo |
| **Domain name** | $10-15/year | Custom URL | Vercel free subdomain |

---

## Updated One-Day Execution Plan (5 People + 2 Agents, $0)

### Hour 0: Setup (30 Minutes)

| Task | Owner | Cost | Notes |
|------|-------|------|-------|
| All-hands sync, assign roles | You | $0 | Read this plan together |
| Install Foundry (`foundryup`) | SC Lead | $0 | If not installed |
| Install Node.js 18+, Python 3.12 | Everyone | $0 | Check versions |
| Install Docker Desktop | DevOps | $0 | Free for personal use |
| Create GitHub repo (public) | Team Lead | $0 | `github.com/yourteam/dicompute` |
| Connect Vercel to GitHub | Frontend | $0 | Auto-deploy on push |
| Sign up Railway / Render | Backend | $0 | For backend hosting |
| Request Apothem faucet (do this NOW) | SC Lead | $0 | May take 10-30 min |
| Start Anvil as backup | SC Lead | $0 | `anvil --fork-url https://rpc.apothem.network --chain-id 51` |

### Hour 1: Contracts (30 Minutes)

| Task | Owner | Cost | Notes |
|------|-------|------|-------|
| Deploy `JobEscrow`, `GPURegistry`, `ReputationSystem`, `ProofReceipt` | SC Lead | $0 (gas from faucet) | Save addresses to `.env` |
| Verify contracts on Apothem explorer | SC Lead | $0 | `forge verify-contract` |
| Copy ABIs to `client/src/contracts/` | SC Lead | $0 | JSON files for Wagmi |
| Write 1 happy-path Foundry test | Hermes | $0 | `test/JobEscrow.t.sol` |
| Add `IComputeMarketplace.sol` interface | Hermes | $0 | Extract from `JobEscrow` |

### Hour 2: Backend Scaffold (60 Minutes)

| Task | Owner | Cost | Notes |
|------|-------|------|-------|
| FastAPI scaffold with SQLite | Hermes | $0 | `main.py`, `models.py`, `database.py` |
| Heartbeat endpoints: `POST /api/jobs/{id}/heartbeat`, `GET /api/jobs/{id}/heartbeats` | Hermes | $0 | SQLite table: `heartbeats` |
| Job list endpoint: `GET /api/jobs` | Hermes | $0 | Filter by state |
| Stats endpoint: `GET /api/stats` | Hermes | $0 | Mock or real aggregation |
| WebSocket scaffold (optional V2): `/ws/jobs/{id}` | Hermes | $0 | Skip if time tight |
| Deploy backend to Railway | Backend | $0 | Free tier, `railway up` |
| SQLite → PostgreSQL migration (if time): `models.py` with SQLAlchemy | Hermes | $0 | Railway PostgreSQL free tier |

### Hour 3: Frontend Scaffold (60 Minutes)

| Task | Owner | Cost | Notes |
|------|-------|------|-------|
| Next.js 14 + Tailwind + Shadcn/ui init | Hermes | $0 | `npx shadcn@latest init` |
| Wagmi v2 config with XDC Apothem chain | Hermes | $0 | Custom chain definition |
| RainbowKit wallet connect button | Hermes | $0 | `ConnectButton` component |
| `/` Landing page: hero, stats, CTAs | Hermes | $0 | Shadcn `Card`, `Button` |
| `/wizard` Job submission wizard | Hermes | $0 | React Hook Form, sliders, submit |
| `/jobs/[id]` Job detail + heartbeat chart | Hermes | $0 | Recharts `LineChart` |
| `/receipts/[id]` Receipt NFT display | Hermes | $0 | Card with metadata, verify link |
| `/explorer` Public job list | Hermes | $0 | Table with filters |
| `/provider/register` Provider registration form | Hermes | $0 | Stake input, metadata |
| `/provider/dashboard` Provider stats page | Hermes | $0 | Earnings, reputation, jobs |
| Deploy to Vercel | Frontend | $0 | `git push` triggers deploy |

### Hour 4: Mock Provider Script (60 Minutes)

| Task | Owner | Cost | Notes |
|------|-------|------|-------|
| Python script: Web3.py connection to Apothem/Anvil | Hermes | $0 | `scripts/mock_provider.py` |
| Poll `JobSubmitted` events | Hermes | $0 | `event_filter.get_new_entries()` |
| Call `claimJob()` on new jobs | Hermes | $0 | Sign with `eth-account` |
| Send 6 signed heartbeats (EIP-712 struct) | Hermes | $0 | 5-second intervals |
| Call `submitResults()` with mock CID | Hermes | $0 | `"QmPyTorchTrainingDemo1234567890abcdef"` |
| Colored terminal output | Hermes | $0 | `print("\033[92m[PROVIDER]...\033[0m")` |
| Test: submit job → watch script claim → complete | Team | $0 | Manual integration test |

### Hour 5: Real Docker Provider (V2 — 60 Minutes)

| Task | Owner | Cost | Notes |
|------|-------|------|-------|
| Python script with `docker` SDK: `docker pull`, `docker run` | Hermes | $0 | `docker-py` package |
| Pull PyTorch image: `docker pull pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime` | Hermes | $0 | Large image, start download early |
| Run container with CPU/RAM limits (cgroups) | Hermes | $0 | `docker run --cpus=4 --memory=16g` |
| Capture stdout/stderr, save to file | Hermes | $0 | `container.logs()` |
| Upload result file to Pinata (free tier) | Backend | $0 | Get real CID instead of mock |
| Send real CID in `submitResults()` | Hermes | $0 | Now receipt points to real data |
| Add `provider.yaml` config file | Hermes | $0 | Credentials, limits, auto-claim |
| Test: submit "real" PyTorch job → container runs → results uploaded → receipt minted | Team | $0 | End-to-end V2 test |

### Hour 6: V3 Go Daemon Scaffold (60 Minutes)

| Task | Owner | Cost | Notes |
|------|-------|------|-------|
| `go mod init github.com/dicompute/daemon` | Hermes | $0 | Go module setup |
| `cmd/daemon/main.go` — Cobra CLI entrypoint | Hermes | $0 | `start`, `register`, `status` commands |
| `internal/provisioner/docker.go` — interface definition | Hermes | $0 | `PullImage`, `RunContainer`, `StopAndRemove` |
| `internal/verifier/signer.go` — EIP-712 signer interface | Hermes | $0 | `SignHeartbeat`, `GetAddress` |
| `internal/heartbeat/broadcaster.go` — interface definition | Hermes | $0 | `Start()`, `Stop()` |
| `internal/watcher/watcher.go` — event listener interface | Hermes | $0 | `WatchJobSubmitted()` |
| `internal/config/config.go` — Viper config struct | Hermes | $0 | `ProviderConfig`, `ChainConfig` |
| `internal/ipfs/uploader.go` — interface definition | Hermes | $0 | `UploadFile()`, `UploadDirectory()` |
| Add `README.md` in `daemon/` explaining architecture | Hermes | $0 | Shows V3 depth to judges |
| **Do NOT implement logic** — just interfaces and stubs | — | $0 | Judges see architecture, not broken code |

### Hour 7: Integration + Polish (60 Minutes)

| Task | Owner | Cost | Notes |
|------|-------|------|-------|
| Wire frontend ↔ backend API calls | Frontend | $0 | Replace mock data with real API |
| Test full happy path: wizard → submit → claim → heartbeats → complete → receipt | Team | $0 | Fix bugs as they appear |
| Add demo shortcuts: "Fill Demo Data" button, fast heartbeat mode | Frontend | $0 | Speeds up live demo |
| Add loading states, error toasts (Sonner) | Frontend | $0 | Looks polished |
| Add "Verify on XDC" link to Apothem explorer | Frontend | $0 | `https://explorer.apothem.network/tx/{txHash}` |
| Responsive check: mobile layout works | Frontend | $0 | Judges may view on phone |

### Hour 8: V3 Marketplace Scaffold (60 Minutes)

| Task | Owner | Cost | Notes |
|------|-------|------|-------|
| Add `reverseAuction` field to `JobEscrow` contract (or plan in comments) | Hermes | $0 | Show intent, not implementation |
| Add `matchingEngine.go` interface in daemon | Hermes | $0 | `MatchJobToProvider()` stub |
| Add `auction.go` stub in backend | Hermes | $0 | `PlaceBid()`, `AcceptBid()` empty functions |
| Add `/provider/jobs` page with "Available Jobs" tab | Frontend | $0 | List pending jobs, "Claim" button |
| Add job templates: "PyTorch MNIST", "TensorFlow Hello World" | Frontend | $0 | Pre-fill wizard with common configs |
| Add reputation score badge to provider cards | Frontend | $0 | Read from `ReputationSystem` contract |
| **These are UI shells + interfaces** — not working logic | — | $0 | Judges see depth beyond MVP |

### Hour 9: V4 Architecture Diagrams (30 Minutes)

| Task | Owner | Cost | Notes |
|------|-------|------|-------|
| Create architecture diagram: V4 multi-chain, enterprise, token | PM | $0 | Excalidraw or Figma free |
| Add `docs/V4-ARCHITECTURE.md` explaining tokenomics, governance, enterprise | Hermes | $0 | Vision document |
| Add `docs/ENTERPRISE.md` with compliance template ideas (NSF, NIH, EU) | Hermes | $0 | Shows market understanding |
| Add `docs/TOKENOMICS.md` with $DCP token plan | Hermes | $0 | Staking, rewards, revenue share |
| Add `docs/ROADMAP.md` with clear V1→V2→V3→V4 timeline | Hermes | $0 | Shows execution discipline |

### Hour 10: Demo Prep (60 Minutes)

| Task | Owner | Cost | Notes |
|------|-------|------|-------|
| Pre-run the full demo once: job → complete → receipt | Team | $0 | Have a completed receipt ready |
| Record 90-second screen recording (OBS) | PM | $0 | Backup if live demo fails |
| Create 5-slide pitch deck (Google Slides) | PM | $0 | Problem, Solution, Demo, Tech, Ask |
| Write demo script (3-minute narration) | Team | $0 | Everyone knows their lines |
| Rehearse twice: one person narrates, one drives | Team | $0 | Smooth transitions |
| Prepare fallback: if live fails, show recording + explain | PM | $0 | Never leave judges with nothing |

### Hour 11-12: Buffer + Final Polish (60-120 Minutes)

| Task | Owner | Cost | Notes |
|------|-------|------|-------|
| Fix any remaining bugs from rehearsal | Team | $0 | Priority: wizard submit, heartbeat display, receipt |
| Optimize bundle size if Vercel deploy is slow | Frontend | $0 | `next build` analysis |
| Add `README.md` with setup instructions | Hermes | $0 | Judges may clone the repo |
| Add `.env.example` with all required variables | Team | $0 | No secrets, just keys |
| Add `CONTRIBUTING.md` if open-source prize | PM | $0 | Hackathon-specific |
| Final GitHub push with clean commit history | Team | $0 | `git rebase -i` if needed |
| Submit to hackathon portal with repo link + demo URL | Team | $0 | Vercel URL + Railway URL |

---

## One-Day Goal: What Judges Will See

| Layer | What Exists | What It Proves |
|-------|-------------|----------------|
| **V1 Working Demo** | Submit job → heartbeat → receipt NFT in 90 seconds | Product works |
| **V2 Real Docker** | PyTorch container actually runs, produces real output | Not just a mock |
| **V3 Go Daemon** | Folder structure, interfaces, CLI stubs | Team knows how to build it |
| **V4 Vision** | Architecture docs, tokenomics, enterprise roadmap | Serious about the business |
| **Pitch Deck** | 5 slides, problem → solution → demo → tech → ask | Clear narrative |
| **Backup Video** | 90-second screen recording | Professional preparation |

**Total cost: $0. Total time: 12 hours. Team size: 5 people + 2 AI agents.**

---

## Free Tier Limits to Watch

| Service | Free Limit | What Happens if Exceeded | Mitigation |
|---------|------------|--------------------------|------------|
| **Vercel** | 100GB bandwidth, 6000 build min/month | Site throttled or suspended | Static export if needed |
| **Railway** | 500MB storage, 512MB RAM, sleeps after inactivity | Cold start: 10-30 sec | Ping with UptimeRobot (free) |
| **Render** | 512MB RAM, sleeps after 15 min inactivity | Cold start: 30-60 sec | Same: UptimeRobot ping |
| **Pinata** | 1GB storage, 100 requests/day | Upload fails | Use mock CID for demo, real only for 1 job |
| **Apothem Faucet** | 1000 XDC per request, rate limited | Request denied | Anvil fallback, or use pre-funded wallet |
| **GitHub Actions** | 2000 minutes/month | Builds stop | Local testing, push only when ready |
| **Anvil** | Unlimited local | None | Best for development, not for demo URL |

---

## Summary: What You MUST Give Me Before We Start

1. [ ] **XDC Apothem wallet address + private key** (or create one now with XDCPay/MetaMask)
2. [ ] **GitHub account access** (or create repo and add me as collaborator)
3. [ ] **Vercel account** (or I can deploy to my own if you share repo)
4. [ ] **Railway or Render account** (or use local demo only)
5. [ ] **Pinata API key** (optional — only if you want real IPFS uploads in V2)
6. [ ] **Team roles assigned** — who is SC Lead, Frontend, Backend, DevOps, PM?
7. [ ] **Apothem faucet request status** — did you get XDC? If not, we use Anvil.
8. [ ] **Laptop specs** — does everyone have Docker Desktop? 16GB+ RAM recommended for PyTorch container.
9. [ ] **Internet stability** — can you run a 12-hour session without disconnection?
10. [ ] **Hackathon rules** — does the demo need to be live URL or is repo + video enough?

**Provide these 10 items and we start building immediately. No cost. No paid services. 100% open source.**
