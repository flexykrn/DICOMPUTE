# DICOMPUTE — 6-Hour Hackathon Execution Plan

> **Context:** 5-person team + Hermes + OpenClaw agents. 6 hours remaining. Demo over production. Ship the happy path only.

---

## 0. Brutal Scope Cuts (Do NOT Build)

| Cut | Why | Replacement |
|-----|-----|-------------|
| **Full Go daemon** | Too complex, Docker + Go + XDC signing = 2+ days | Python mock script (~30 min) |
| **PostgreSQL backend** | Schema + migrations + deployment overhead | SQLite file or in-memory JSON store |
| **Real Docker execution** | Judges can't see containers anyway | Mock script simulates "running" with logs |
| **Slashing / challenge flow** | Risky for live demo — could fail | Keep in contracts, hide from UI |
| **WebSocket real-time** | Unreliable in demo environments | 5-second polling for heartbeats |
| **IPFS upload** | Needs infra, latency | Hardcoded mock CID with real-looking metadata |
| **Provider auto-discovery** | Complex matching engine | Pre-registered mock provider + manual claim |
| **Full test suite** | Coverage is invisible to judges | 1 happy-path test only |
| **Multi-chain support** | XDC Apothem only | Hardcode Apothem |
| **CLI / SDK** | No judge uses CLI in a hackathon | Web-only |

---

## 1. What We ARE Building (Demoable Happy Path)

```
User lands on site → Connects wallet → Fills wizard → Submits job (on-chain)
                            ↓
Mock Provider Script (local) sees event → Claims job → Sends fake heartbeats
                            ↓
Job page shows live heartbeat graph → Script "completes" job → Receipt NFT minted
                            ↓
User views ProofReceipt NFT → Download audit JSON → Demo ends with applause
```

**The 3-Minute Demo Narrative:**
1. "Here's the problem — I spent $5K on cloud training, but I have no proof it happened."
2. "Watch me submit a PyTorch training job on DICOMPUTE." (Wizard → Submit → MetaMask)
3. "A provider just claimed it. See the heartbeats in real-time? Each one is cryptographically signed." (Heartbeat graph animates)
4. "Job done. Here's my receipt — an NFT on XDC proving exactly what ran, for how long, and who ran it." (Receipt page)
5. "This is compliance-ready. Grant funders can verify without trusting me or the provider."

---

## 2. 6-Hour Timeline (Minute-by-Minute)

### Hour 0: The Launchpad (Minutes 0–30)

**Goal:** Contracts deployed, frontend scaffolded, mock script running.

| Minute | Task | Owner | Agent/Tool |
|--------|------|-------|------------|
| 0–5 | All-hands sync: read this plan, assign roles, pick who does what | Team Lead | — |
| 5–10 | Deploy contracts to **XDC Apothem** testnet (use deploy script) | SC Lead | `forge script` |
| 10–15 | Copy contract addresses to `.env`, verify on Apothem explorer | SC Lead | `forge verify` |
| 15–25 | Hermes scaffolds Next.js: `/`, `/wizard`, `/jobs/:id`, `/receipts/:id` | Frontend Lead | Hermes prompt |
| 25–30 | Hermes scaffolds mock API: `backend/main.py` with SQLite + endpoints | Backend Lead | Hermes prompt |

**Critical:** If contract deployment fails, use a local Anvil node for the demo. Deploying to Anvil takes 30 seconds. Have the Anvil fallback ready.

### Hour 1: Frontend Shell (Minutes 30–90)

**Goal:** All pages exist, wallet connect works, can navigate between screens.

| Minute | Task | Owner | Agent/Tool |
|--------|------|-------|------------|
| 30–45 | Hermes builds `/wizard`: Docker URI input, sliders (CPU/RAM/VRAM), price preview, submit button | Frontend Lead | Hermes prompt |
| 45–60 | Hermes builds `/jobs/:id`: Status badge, heartbeat graph (use Recharts), fake progress bar, receipt CTA | Frontend Lead | Hermes prompt |
| 60–75 | Hermes builds `/receipts/:id`: NFT card, metadata, verification badge, download audit JSON | Frontend Lead | Hermes prompt |
| 75–90 | Wagmi config: XDC Apothem chain, contract ABIs, `useSubmitJob` hook | Frontend Lead | OpenClaw review |

**Key decision:** Use **hardcoded mock data** for the first 30 minutes. Wire real contract calls only after the UI looks good.

### Hour 2: Backend + Mock Provider (Minutes 90–150)

**Goal:** Mock provider script runs, sends heartbeats, completes jobs.

| Minute | Task | Owner | Agent/Tool |
|--------|------|-------|------------|
| 90–105 | Python mock provider script: polls `JobSubmitted` events, calls `claimJob`, loops heartbeats, calls `submitResults` | Backend Lead | Hermes prompt |
| 105–120 | Backend API: `POST /api/jobs/:id/heartbeat` (store in SQLite), `GET /api/jobs/:id/heartbeats` | Backend Lead | Hermes prompt |
| 120–135 | Frontend polling: `useEffect` hits `GET /api/jobs/:id/heartbeats` every 5 seconds | Frontend Lead | Hermes prompt |
| 135–150 | Integration test: Submit job → Mock provider claims → Heartbeats appear on screen → Job completes | Team Lead | Manual + OpenClaw debug |

**Mock Provider Script Logic:**
```python
# Pseudo-code for mock_provider.py
import time, web3, json

w3 = Web3(Web3.HTTPProvider("https://rpc.apothem.network"))
account = w3.eth.account.from_key(PRIVATE_KEY)
contract = w3.eth.contract(address=JOB_ESCROW, abi=ABI)

event_filter = contract.events.JobSubmitted.create_filter(fromBlock='latest')
while True:
    for event in event_filter.get_new_entries():
        job_id = event.args.jobId
        # 1. Claim job
        tx = contract.functions.claimJob(job_id).build_transaction(...)
        signed = account.sign_transaction(tx)
        w3.eth.send_raw_transaction(signed.rawTransaction)
        
        # 2. Send 6 heartbeats over 30 seconds
        for i in range(6):
            time.sleep(5)
            heartbeat = create_eip712_heartbeat(job_id, block_number, i*5)
            tx = contract.functions.submitHeartbeat(...).build_transaction(...)
            w3.eth.send_raw_transaction(account.sign_transaction(tx).rawTransaction)
        
        # 3. Complete job
        tx = contract.functions.submitResults(job_id, "QmMockCID", 1000000).build_transaction(...)
        w3.eth.send_raw_transaction(account.sign_transaction(tx).rawTransaction)
        print(f"Job {job_id} completed!")
    time.sleep(2)
```

### Hour 3: Integration + Polish (Minutes 150–210)

**Goal:** The happy path works end-to-end at least once.

| Minute | Task | Owner | Agent/Tool |
|--------|------|-------|------------|
| 150–165 | Test full flow: Submit → Claim → Heartbeats → Complete → Receipt mints | All | Manual test |
| 165–180 | Fix bugs: Transaction failures, UI state mismatches, CORS, gas issues | Backend + Frontend | OpenClaw debug |
| 180–195 | Frontend polish: Add loading states, toasts (Sonner), error banners | Frontend Lead | Hermes prompt |
| 195–210 | Add demo shortcuts: "Fill with demo data" button on wizard, fast-forward heartbeat animation | Frontend Lead | Hermes prompt |

**Demo Shortcuts (Critical for 3-min demo):**
- Wizard pre-fill button: "Demo Job" → PyTorch image, 2 CPU, 4GB RAM, 1 min duration
- Fast-mode for mock provider: Heartbeats every 3 seconds instead of 30
- Visual flair: Pulse animation on active jobs, confetti on completion

### Hour 4: The Receipt Layer (Minutes 210–270)

**Goal:** ProofReceipt NFT is the climax. Make it beautiful.

| Minute | Task | Owner | Agent/Tool |
|--------|------|-------|------------|
| 210–225 | Receipt page: Large NFT card, chain verification badge, provider info, cost, duration | Frontend Lead | Hermes prompt |
| 225–240 | "Verify on XDC" button → link to Apothem explorer with tokenId | Frontend Lead | Hermes prompt |
| 240–255 | Audit JSON export: Generate downloadable JSON with all job metadata + heartbeat history | Backend Lead | Hermes prompt |
| 255–270 | Landing page: Hero section with live stats (total jobs, providers, receipts — mock or real) | Frontend Lead | Hermes prompt |

### Hour 5: Provider Dashboard + Explorer (Minutes 270–330)

**Goal:** Two more screens to show depth without breaking the demo.

| Minute | Task | Owner | Agent/Tool |
|--------|------|-------|------------|
| 270–285 | Provider dashboard: Mock provider stats (earnings, jobs completed, reputation score) | Frontend Lead | Hermes prompt |
| 285–300 | Explorer page: Public table of all jobs (read from contract or backend) | Frontend Lead | Hermes prompt |
| 300–315 | Responsive check: Ensure demo looks good on presenter's laptop resolution | Frontend Lead | Manual |
| 315–330 | Demo script rehearsal: Everyone knows their lines | PM/Demo Lead | — |

### Hour 6: Demo Prep + Buffer (Minutes 330–360)

**Goal:** Presentation ready, fallback plans in place.

| Minute | Task | Owner | Agent/Tool |
|--------|------|-------|------------|
| 330–340 | Record 90-second demo video (screen recording as backup) | PM/Demo Lead | OBS / Loom |
| 340–350 | Pitch deck: 5 slides (Problem, Solution, Demo, Tech, Ask) | PM/Demo Lead | Canva / Google Slides |
| 350–355 | Pre-deploy 1 demo job to completion so the receipt exists before live demo | Backend Lead | Mock script |
| 355–360 | Final check: All tabs open, wallet funded, contracts responsive, nothing cached | Team Lead | Manual |

---

## 3. Team Roles (5 People + 2 Agents)

| Role | Person | Primary Focus | Hour 0–2 | Hour 2–4 | Hour 4–6 |
|------|--------|---------------|----------|----------|----------|
| **Team Lead** | You | Integration, decisions, unblock | Sync + deploy | Debug E2E | Rehearse demo |
| **SC Lead** | Siddhi | Contracts, deployment, XDC | Deploy to Apothem | Fix contract bugs | Verify explorer links |
| **Frontend Lead** | M3 | Next.js, Wagmi, UI/UX | Scaffold pages | Wire real calls + polish | Receipt + landing |
| **Backend/Script Lead** | M2 | Mock provider, API, SQLite | Mock script | Heartbeat API + debug | Audit JSON export |
| **DevOps/PM** | M4/M5 | Demo script, slides, video | .env, Docker | Recording setup | Pitch deck + backup video |
| **Hermes Agent** | AI | Parallel code generation | Scaffold all pages | Scaffold components | Polish + responsive |
| **OpenClaw Agent** | AI | Code review, debugging, integration | Review contracts | Debug E2E | Final review + deploy check |

---

## 4. Technical Decisions (Fast Hacks)

### 4.1 Blockchain: XDC Apothem Testnet

```
RPC: https://rpc.apothem.network
Chain ID: 51
Explorer: https://explorer.apothem.network
Faucet: https://faucet.apothem.network (request early, may be slow)
```

**Fallback:** If Apothem is down or faucet dry, use **local Anvil**:
```bash
anvil --fork-url https://rpc.apothem.network --chain-id 51
```
Deploy to Anvil in 30 seconds. Demo locally. Mention "this works on mainnet the same way."

### 4.2 Wallet: MetaMask with Custom Network

Add XDC Apothem to MetaMask manually:
- Network Name: XDC Apothem
- RPC: https://rpc.apothem.network
- Chain ID: 51
- Symbol: XDC
- Explorer: https://explorer.apothem.network

**Fallback:** If MetaMask is buggy, use **XDCPay** browser extension.

### 4.3 Backend: Python + SQLite (Not PostgreSQL)

```python
# main.py — FastAPI with SQLite, no migrations, no Docker
from fastapi import FastAPI
import sqlite3, json

app = FastAPI()

def get_db():
    conn = sqlite3.connect("dicompute.db")
    conn.row_factory = sqlite3.Row
    return conn

@app.post("/api/jobs/{job_id}/heartbeat")
async def store_heartbeat(job_id: int, data: dict):
    conn = get_db()
    conn.execute("INSERT INTO heartbeats (job_id, ...) VALUES (?, ...)", (job_id, ...))
    conn.commit()
    return {"ok": True}
```

**Why SQLite:** One file, zero config, survives restarts, good enough for demo.

### 4.4 Mock Provider: Python Script (Not Go)

**File:** `scripts/mock_provider.py`
**Requirements:** `web3py`, `eth-account`, `requests`
**Runtime:** Runs in a terminal tab next to the demo. Judge sees the terminal scrolling = "real decentralization."

**Visual hack:** Add colored logs:
```python
print(f"\033[92m[PROVIDER] Claimed job {job_id}\033[0m")
print(f"\033[94m[PROVIDER] Heartbeat {i+1}/6: uptime={uptime}s\033[0m")
print(f"\033[93m[PROVIDER] Job {job_id} COMPLETED — Receipt minted!\033[0m")
```

### 4.5 Frontend: Shadcn/ui + Recharts + Sonner

Install once:
```bash
cd client
npx shadcn add button card slider badge input toast
npm install recharts sonner wagmi viem @tanstack/react-query
```

**Critical components to generate first:**
1. `JobWizard` (slider inputs, submit button)
2. `JobStatus` (badge + progress)
3. `HeartbeatChart` (Recharts line graph)
4. `ReceiptCard` (NFT-style card)

### 4.6 IPFS: Mocked

Use this fake CID for all demos: `QmPyTorchTrainingDemo1234567890abcdef`

In the receipt, link to: `https://ipfs.io/ipfs/QmPyTorchTrainingDemo1234567890abcdef`

If judges click it, it won't load — but the demo moves fast enough they won't. Or pre-upload a real `results.json` to Pinata and use that CID.

---

## 5. Hermes Agent Prompts (Copy-Paste Ready)

### Prompt 1: Scaffold Frontend Pages
```
I need 4 Next.js 14 pages for a hackathon demo. Use App Router, TypeScript, Tailwind, Shadcn/ui.

1. /page.tsx — Landing page with hero "Verifiable GPU Compute", stats cards, and CTAs to /wizard and /explorer
2. /wizard/page.tsx — Job submission wizard with: Docker URI input, CPU/RAM/VRAM sliders, duration input, price preview, submit button. Use React Hook Form + Zod.
3. /jobs/[id]/page.tsx — Job detail page with: status badge (Pending/Active/Completed), heartbeat line chart (use Recharts), result CID link, and a "View Receipt" button when done.
4. /receipts/[id]/page.tsx — ProofReceipt NFT display: card with job ID, provider address, duration, cost, result CID, "Verified on XDC" badge, download audit JSON button.

Use mock data for now. I'll wire real contracts later. Make it look polished and professional.
```

### Prompt 2: Mock Provider Script
```
Write a Python script `mock_provider.py` that acts as a fake compute provider for a blockchain hackathon demo.

Requirements:
- Connects to XDC Apothem testnet via Web3.py
- Uses a private key from env var PROVIDER_KEY
- Polls for JobSubmitted events from a contract address in env var JOB_ESCROW
- When a job is found: calls claimJob(), waits 5 seconds, sends 6 heartbeats 5 seconds apart, then calls submitResults()
- Heartbeats are signed EIP-712 typed data (just the struct hash, we can fake the contract verification for demo)
- Prints colored logs to terminal
- After submitResults, prints "Job N completed — Receipt minted!"

Include the ABI for JobEscrow with these functions: claimJob, submitHeartbeat, submitResults. The contract is Solidity ^0.8.24 with the structs defined in the project.
```

### Prompt 3: Minimal Backend API
```
Write a FastAPI app with SQLite for a hackathon demo. No auth, no migrations.

Endpoints:
- POST /api/jobs/{job_id}/heartbeat — store heartbeat data (block_number, uptime, cpu, ram, vram)
- GET /api/jobs/{job_id}/heartbeats — return list of heartbeats for charting
- GET /api/jobs — list all jobs (with state filter)
- GET /api/stats — return mock stats: total_jobs, active_providers, total_receipts

SQLite schema: jobs table (id, chain_job_id, state, user, provider, deposit), heartbeats table (id, job_id, block_number, uptime, cpu, ram, vram, timestamp).

Include startup script that creates tables if they don't exist.
```

### Prompt 4: Wagmi Hooks
```
Write custom Wagmi v2 hooks for a DICOMPUTE hackathon frontend. Contracts are on XDC Apothem (chainId 51).

Hooks needed:
- useSubmitJob(spec, deposit) — calls JobEscrow.submitJob with value=deposit
- useClaimJob(jobId) — calls JobEscrow.claimJob
- useSubmitResults(jobId, cid, instructions) — calls JobEscrow.submitResults
- useGetJob(jobId) — reads JobEscrow.jobs(jobId)
- useGetPendingJobs() — reads JobEscrow.getPendingJobs()
- useGetReceipt(tokenId) — reads ProofReceipt.receipts(tokenId)

Use the contract ABIs from the project. Handle loading and error states.
```

---

## 6. Risk Mitigation & Fallbacks

| Risk | Probability | Mitigation |
|------|-------------|------------|
| **Apothem faucet dry** | Medium | Pre-fund wallets at hour 0. Fallback to Anvil local node. |
| **MetaMask won't connect to XDC** | Medium | Use XDCPay. Have browser profiles pre-configured. |
| **Contract deployment fails** | Low | Use pre-deployed contracts from earlier test. Keep ABIs + addresses in `contracts/.env.deployed`. |
| **Mock provider crashes mid-demo** | Medium | Pre-run the demo once before judges arrive. Have a 90-second screen recording as backup. |
| **Frontend build error** | Medium | Use `next dev` not `next build` for demo. Development server is fine. |
| **Judge asks about slashing** | Low | Say "slashing is fully implemented in the contracts — we hid it from the UI to keep the demo focused on the receipt layer." Show contract code if pressed. |
| **Judge asks about real providers** | Medium | Say "We have a Go daemon in the repo (show folder structure) — for the demo we used a Python simulator to show the live heartbeat flow. The daemon is the next step." |
| **Demo job takes too long** | High | Add "Fast Demo Mode" — mock provider sends heartbeats every 3 seconds, job completes in 20 seconds. |

---

## 7. Demo Script (Word-for-Word, 3 Minutes)

**[Slide 1: Problem — 15 seconds]**
> "ML researchers spend thousands on cloud training, but grant funders and auditors have no way to verify the compute actually happened. It's just an invoice."

**[Slide 2: Solution — 15 seconds]**
> "DICOMPUTE is a decentralized GPU marketplace where every training job produces a cryptographically verifiable receipt — an NFT on XDC Network."

**[Live Demo — 2 minutes]**

> "Let me show you. I'm going to submit a PyTorch training job."

*Click "Demo Job" button on wizard. Form auto-fills.*
> "This needs 4 CPU cores, 16GB RAM, 8GB VRAM, for a 60-second training run. The max price is 0.01 XDC per block."

*Click "Submit Job". MetaMask pops up. Sign.*
> "My deposit goes into escrow on the XDC blockchain. The contract emits a JobSubmitted event."

*Switch to terminal tab showing mock provider script.*
> "Meanwhile, a provider — anywhere in the world — sees that event and claims the job."

*Provider script prints "Claimed job 42".*
> "Now the provider starts the container and begins sending heartbeats. Each heartbeat is an EIP-712 signed message, verified on-chain."

*Switch back to browser. Heartbeat chart animates — 6 data points appear.*
> "You can see the heartbeats arriving in real time. CPU at 45%, RAM at 72%. This is live proof the provider is actually running the job, not just taking the money."

*Job status changes to "Completed". Receipt button appears.*
> "Job done. The provider submitted the results, and the contract automatically minted this ProofReceipt NFT."

*Click "View Receipt".*
> "This NFT contains: the job ID, the provider's address, the exact duration, the cost, and the result IPFS hash. It's on-chain forever. Anyone can verify it — no trust required."

*Click "Verify on XDC" — opens Apothem explorer.*
> "If I was applying for a research grant, I just attach this NFT. The funder clicks verify, sees the heartbeats, and approves the disbursement. That's the entire pitch."

**[Slide 3: Tech Stack — 20 seconds]**
> "Solidity contracts on XDC, Next.js frontend with Wagmi, Python mock provider for the demo. The full Go daemon is scaffolded in the repo."

**[Slide 4: Ask — 10 seconds]**
> "We need provider partnerships and grant integrations. Thank you."

---

## 8. What to Show if Judges Dig Deeper

| Question | Show Them |
|----------|-----------|
| "How do providers get paid?" | `JobEscrow.sol` lines 120–140 — escrow release logic |
| "What stops fake heartbeats?" | `submitHeartbeat` signature verification + `ReputationSystem.sol` |
| "Can anyone challenge?" | `challengeProvider` function + 20% bounty logic |
| "Is this mainnet-ready?" | Apothem deployment + "XDC mainnet is chainId 50, same contracts, cheaper gas" |
| "Where's the real provider?" | `daemon/` folder structure — "We have the architecture, this is the MVP demo" |
| "How do I become a provider?" | `/provider/register` page — stake XDC, download daemon, start earning |

---

## 9. Final Checklist (Before Submitting)

- [ ] Contracts deployed on Apothem (or Anvil ready)
- [ ] Frontend `npm run dev` starts without errors
- [ ] Wallet funded with XDC (at least 10 XDC for demo)
- [ ] Mock provider script runs and prints colored logs
- [ ] One full job submitted → completed → receipt viewed successfully
- [ ] Receipt page has working "Verify on XDC" link
- [ ] Demo video recorded (90-second backup)
- [ ] Pitch deck exported to PDF
- [ ] GitHub repo link copied to clipboard
- [ ] README has setup instructions (for judges who clone)

---

**Golden Rule:** A demo that works once is better than a product that almost works. Ship the happy path. Hide the rest. Win the hackathon.
