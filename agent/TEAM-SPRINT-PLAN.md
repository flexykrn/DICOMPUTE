# DICOMPUTE — 3.5 Hour Parallel Build Plan (Prompt-Based)

**Philosophy:** Each person gets clear prompts and instructions. Use AI coding tools (Cursor, GitHub Copilot, etc.) or write code manually. No copy-paste code blocks — just what to build and how.

---

## Team Member 1: KARAN (Blockchain Lead)

### Your Goal
Make the frontend submit jobs to the blockchain. Wire up the deployed contracts.

### Prompt 1: Copy ABIs (15 min)
```
Copy these contract ABIs from artifacts/contracts/src/ to client/lib/contracts/ and backend/contracts/:
- JobEscrow.sol/JobEscrow.json
- GPURegistry.sol/GPURegistry.json  
- ProofReceipt.sol/ProofReceipt.json
- ComputeMarketplace.sol/ComputeMarketplace.json

Then create a config file client/lib/contracts/config.ts that exports:
- CONTRACTS object with address and abi for each contract
- XDC_APOTHEM chain configuration (chainId: 51, RPC: https://rpc.apothem.network)
```

### Prompt 2: Wire Wizard Page (30 min)
```
In client/app/wizard/page.tsx:
1. Import useWriteContract and useAccount from wagmi
2. Import the CONTRACTS config
3. Add handleSubmit function that calls writeContract with:
   - address: CONTRACTS.JobEscrow.address
   - abi: CONTRACTS.JobEscrow.abi
   - functionName: "submitJob"
   - args: [{dockerUri, cpuMilli, ramMiB, vramMiB, durationBlocks, maxPricePerBlock}]
   - value: estimatedCost as BigInt
4. Add disabled={isPending} to submit button
5. Show toast notifications for success/error
```

### Prompt 3: Update Wagmi Config (10 min)
```
In client/lib/wagmi.ts:
Replace the xdcApothem chain config with the XDC_APOTHEM export from contracts/config.ts
Use projectId: "dicompute-wallet-connect"
```

### Verification
- Open http://localhost:3000/wizard
- Fill form, click submit
- MetaMask should popup with XDC transaction

**Deliverable:** Working job submission from frontend to blockchain.

---

## Team Member 2: M2 (Backend Lead)

### Your Goal
Build a blockchain event indexer that listens to deployed contracts and stores events in SQLite.

### Prompt 1: Create Indexer (35 min)
```
Create backend/indexer.py that:
1. Connects to XDC Apothem via Web3.py (RPC: https://rpc.apothem.network)
2. Loads JobEscrow ABI from backend/contracts/JobEscrow.json
3. Creates event filters for: JobSubmitted, JobClaimed, JobCompleted
4. Listens in a loop (while True with time.sleep(2))
5. For each JobSubmitted event:
   - Extract jobId, user, deposit
   - Call contract.functions.jobs(jobId).call() to get spec
   - Create Job record in SQLite with state="pending"
   - Print: "Indexed job #{jobId}"
6. For each JobClaimed event:
   - Update Job state to "active", set provider_address
7. For each JobCompleted event:
   - Update Job state to "completed"
```

### Prompt 2: Integrate with FastAPI (15 min)
```
In backend/main.py:
1. Add startup event handler that starts indexer in background thread
2. Import indexer.run_indexer
3. Create daemon=True thread
4. Print "Blockchain indexer started"
```

### Verification
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```
Should see "Blockchain indexer started". Submit a job from frontend, should see "Indexed job #X".

**Deliverable:** Backend auto-indexes blockchain events.

---

## Team Member 3: M3 (Frontend Lead)

### Your Goal
Build all frontend pages to display real data from the backend API.

### Prompt 1: Explorer Page (20 min)
```
In client/app/explorer/page.tsx:
1. Use useEffect to fetch jobs from http://localhost:8000/api/jobs
2. Store in state, map to cards
3. Each card shows: Job #{id}, user address (truncated), docker_uri, status badge
4. Add filter buttons: All, pending, active, completed
5. Link each card to /jobs/{chain_job_id}
6. Handle empty state: "No jobs found. Submit one from the wizard!"
```

### Prompt 2: Job Detail Page (30 min)
```
In client/app/jobs/[id]/page.tsx:
1. Get jobId from useParams
2. Fetch job details from /api/jobs/{jobId}
3. Poll heartbeats every 5 seconds from /api/jobs/{jobId}/heartbeats
4. Display job info: user, provider, docker image, CPU/RAM/VRAM specs
5. Show status badge (yellow=pending, blue=active, green=completed)
6. If completed, show "View Receipt NFT" button linking to /receipts/{jobId}
7. If active, show animated pulse: "Job is running — heartbeats incoming..."
8. If heartbeats exist, render Recharts LineChart with CPU%, RAM%, VRAM% lines
```

### Prompt 3: Receipt Page (15 min)
```
In client/app/receipts/[id]/page.tsx:
1. Fetch receipt from /api/receipts/{tokenId}
2. Display NFT-style card with:
   - Receipt #{token_id} header
   - VERIFIED badge
   - Job ID, Cost, User, Provider
   - Result CID, Instruction Count, Minted date
3. Add "Verify on XDC Explorer" button linking to:
   https://explorer.apothem.network/tx/{tokenId}
```

### Prompt 4: Polish (10 min)
```
Add loading states and empty states to all pages.
Ensure consistent navigation (nav bar on all pages).
Add ConnectButton from RainbowKit to all page navbars.
```

### Verification
- All pages load without errors
- Navigation works between pages
- API calls succeed (check browser network tab)

**Deliverable:** Complete frontend with all pages working.

---

## Team Member 4: M4 (GPU Provider)

### Your Goal
Set up a machine with Docker and GPU support, then build a provider script that runs real containers and sends heartbeats.

### Step 1: Machine Setup (20 min)
Run these commands on your machine:

```bash
# Install Docker Desktop if not installed
# Ubuntu:
sudo apt-get update
sudo apt-get install docker.io

# Install NVIDIA Container Toolkit
sudo apt-get install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker

# Test GPU in Docker
docker run --rm --gpus all nvidia/cuda:12.1-base nvidia-smi

# Pull PyTorch image
docker pull pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime

# Install Python deps
pip install docker web3 eth-account requests python-dotenv psutil
```

### Prompt: Create GPU Provider Script (50 min)
```
Create scripts/gpu_provider.py that:

1. Loads environment variables:
   - PROVIDER_KEY (private key)
   - JOB_ESCROW_ADDRESS (0x2Ff9B760510fc0aAd51a59f8aDA62F8B2631a075)
   - BACKEND_URL (http://your_ip:8000)
   - RPC_URL (https://rpc.apothem.network)

2. Connects to XDC Apothem via Web3.py
3. Loads JobEscrow ABI from artifacts/contracts/src/JobEscrow.sol/JobEscrow.json
4. Listens for JobSubmitted events in a loop

5. When job is submitted:
   a. Call claimJob(jobId) on-chain
   b. Get job spec from contract
   c. Pull Docker image (job_data.dockerUri)
   d. Run container with:
      - GPU access (--gpus all)
      - CPU limit (convert milli-CPU to cpu_quota)
      - RAM limit (MiB)
      - Labels for tracking
   e. Send 6 heartbeats every 5 seconds:
      - Get real CPU/RAM via psutil
      - Get real GPU via nvidia-smi or pynvml
      - Call submitHeartbeat() on-chain
      - POST to backend /api/jobs/{id}/heartbeat
   f. Stop and remove container
   g. Call submitResults(jobId, resultCID, instructionCount)
   h. Print colored logs for each step

6. Handle keyboard interrupt (Ctrl+C) to gracefully stop containers
```

### Verification
```bash
cd scripts
python gpu_provider.py
```
Should show: "Starting provider... Waiting for jobs..."

**Deliverable:** Real GPU provider running Docker containers.

---

## Team Member 5: M5 (Documentation / PM)

### Your Goal
Create all documentation and demo materials.

### Prompt 1: README (20 min)
```
Update README.md with:
1. Project title and one-line description
2. Architecture diagram (ASCII art is fine)
3. Deployed contract addresses table
4. Quick start section with 3 commands:
   - Start backend: cd backend && uvicorn main:app --port 8000
   - Start frontend: cd client && npm run dev
   - Start provider: cd scripts && python gpu_provider.py
5. Prerequisites list
6. Demo flow description
```

### Prompt 2: Demo Script (20 min)
```
Create DEMO-SCRIPT.md with:
1. Opening (15 sec): Problem statement
2. Demo steps (2 min):
   - Submit job from /wizard
   - Show provider claiming job
   - Show heartbeat chart filling
   - Show completed receipt NFT
3. Closing (15 sec): Value proposition
4. Talking points for each screen
5. Fallback plan if live demo fails
```

### Prompt 3: Pitch Deck (30 min)
```
Create PITCH-DECK.md with 5 slides:
1. Problem: No proof of compute for AI training
2. Solution: DICOMPUTE with on-chain receipts
3. Demo: Screenshots of wizard, heartbeats, receipt
4. Tech: XDC, Solidity, Next.js, Docker, GPU
5. Ask: What you need (funding, partnerships, etc.)

Each slide should have:
- Title
- 3 bullet points max
- Visual description
```

### Prompt 4: Setup Guide (20 min)
```
Create SETUP.md with:
1. Developer setup (step by step)
2. GPU provider setup (Docker + NVIDIA)
3. Environment variables needed
4. Common issues and solutions
5. Links to resources (faucet, explorer, etc.)
```

### Verification
- All markdown files render correctly
- Links work
- Instructions are clear enough for a new person to follow

**Deliverable:** Complete documentation package.

---

## MERGE PROTOCOL

After 3.5 hours, everyone stops working and merges:

```bash
# Terminal commands (run by Karan or team lead)
git checkout main

# Merge in this exact order:
git merge m2/backend-api      # Backend first (foundation)
git merge karan/frontend-contracts  # Frontend contracts
git merge m3/frontend-pages   # Frontend pages
git merge m4/gpu-provider     # Provider
git merge m5/docs-and-demo    # Docs last

# Push to main
git push origin main
```

**Why this order:** Backend must exist before frontend can call it.

---

## FINAL VERIFICATION CHECKLIST

After merge, test this exact flow:

1. [ ] Open http://localhost:3000
2. [ ] Navigate to /wizard
3. [ ] Fill form (or click "Fill Demo Data")
4. [ ] Click "Submit Job"
5. [ ] MetaMask popup appears
6. [ ] Sign transaction
7. [ ] Transaction confirms on XDC Apothem
8. [ ] Navigate to /explorer
9. [ ] Job appears in list
10. [ ] Provider terminal shows "Claimed job #X"
11. [ ] Docker container starts on provider machine
12. [ ] Navigate to /jobs/{id}
13. [ ] Heartbeat chart shows data points
14. [ ] Job status changes to "completed"
15. [ ] "View Receipt" button appears
16. [ ] Receipt page shows NFT metadata
17. [ ] Backend SQLite has job data

**If 14+ pass:** MVP is demo-ready.
**If 17 pass:** MVP is complete.

---

## EMERGENCY FALLBACKS

**If provider GPU doesn't work:**
- Use CPU-only mode: Remove `--gpus all` from Docker run
- Use python:3.11-slim image instead of PyTorch

**If contract calls fail:**
- Check MetaMask network is XDC Apothem (Chain ID 51)
- Check wallet has TXDC
- Use local Anvil node: `anvil --fork-url https://rpc.apothem.network`

**If backend crashes:**
- Check SQLite file permissions
- Restart: `python -m uvicorn main:app --reload`

**If frontend won't build:**
- Use `npm run dev` (dev server, no build needed)
- Check Node version: `node -v` (need 18+)

---

## FILE STRUCTURE AFTER BUILD

```
dicompute/
├── agent/
│   ├── MVP-2H-PLAN.md
│   ├── MVP-4H-GPU-PLAN.md
│   └── TEAM-SPRINT-PLAN.md
├── backend/
│   ├── contracts/
│   │   └── JobEscrow.json
│   ├── indexer.py
│   ├── main.py
│   ├── database.py
│   └── models.py
├── client/
│   ├── lib/
│   │   ├── contracts/
│   │   │   ├── config.ts
│   │   │   ├── JobEscrow.json
│   │   │   ├── GPURegistry.json
│   │   │   └── ProofReceipt.json
│   │   └── wagmi.ts
│   └── app/
│       ├── page.tsx
│       ├── wizard/page.tsx
│       ├── explorer/page.tsx
│       ├── jobs/[id]/page.tsx
│       └── receipts/[id]/page.tsx
├── scripts/
│   ├── gpu_provider.py
│   └── requirements.txt
├── deployed-addresses.json
├── README.md
├── DEMO-SCRIPT.md
├── PITCH-DECK.md
└── SETUP.md
```

---

**Start time:** TBD
**End time:** TBD + 3.5 hours
**Merge time:** +15 minutes
**Demo ready:** TBD + 4 hours

**Questions?** Ask in team chat. Don't wait more than 10 minutes for help.
