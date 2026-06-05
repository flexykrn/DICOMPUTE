# DICOMPUTE MVP Demo - Use Teammate's GPU from Your Laptop

You can submit a job from the frontend or via Python script. A teammate's machine with a GPU runs the provider daemon, executes the Docker container, and submits results on-chain.

## Architecture

```
Your Laptop                              Teammate's GPU Machine
------------                            ------------------------
Frontend (wizard)  ----submitJob()--->  XDC Apothem Blockchain
Backend API        <--index events--
  (SQLite + FastAPI)                    scripts/gpu_provider.py
                                        listens for JobSubmitted
                                        claims job -> runs Docker
                                        heartbeats -> submits results
```

## Prerequisites

1. XDC Apothem testnet XDC in the deployer/provider wallet
2. Python 3.10+ with backend deps installed
3. Node.js with pnpm for the frontend (`corepack enable`, then `pnpm install`)
4. Docker installed on the GPU provider machine
5. The provider wallet registered on `GPURegistry` with stake

## Deployed Contracts (XDC Apothem)

See `deployed-addresses.json`:
- JobEscrow: `0x2Ff9B760510fc0aAd51a59f8aDA62F8B2631a075`
- GPURegistry: `0xCEf0f0E74e618A95Da97e1216F81d74eA01dE77C`
- ProofReceipt: `0xb35EfE4E7071B1c7ce7f00CC7BB667cEc706DBa2`
- ReputationSystem: `0xf02ac8fDab069bd62B2CE9F53Ea0d09c725880E3`

## Step 1: Start Backend API

```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8001
```

## Step 2: Start Frontend (optional but recommended)

```bash
cd client
pnpm install
pnpm dev
# Open http://localhost:3000
```

Use `pnpm` because npm has semver conflicts with the latest wagmi packages on Node 24.

## Step 3: Start GPU Provider (on teammate's machine with GPU + Docker)

```bash
cd scripts
cp .env.example .env
# Edit .env and set PROVIDER_KEY to the registered provider's private key
python gpu_provider.py
```

## Step 4: Submit a Job

### Option A: Frontend Wizard

Open http://localhost:3000/wizard, connect MetaMask to XDC Apothem (Chain ID 51), fill in the Docker image and specs, and click **Submit Job on-chain**.

### Option B: Python Script

```bash
cd scripts
python test_submit_job.py
```

## Step 5: Watch the Flow

Check backend stats:

```bash
curl http://localhost:8001/api/stats
```

Check a specific job:

```bash
curl http://localhost:8001/api/jobs/{chain_job_id}
```

Check result after completion:

```bash
curl http://localhost:8001/api/jobs/{chain_job_id}/result
```

## Frontend Pages

- `/` — Landing page with architecture overview
- `/wizard` — Submit a job directly to the JobEscrow contract (MetaMask)
- `/explorer` — Browse all jobs with filters and stats
- `/jobs/{id}` — Job detail with on-chain proof verification
- `/receipts/{id}` — ProofReceipt NFT view with on-chain verification
- `/provider` — Provider setup and wallet status

## On-Chain Proof

The job detail and receipt pages read directly from the blockchain:
- Job state, provider, start/completion blocks
- Result CID and instruction count stored on-chain
- ProofReceipt NFT contract data (cost, timestamp, CID)
- Links to XDC Explorer for manual verification

## Demo Checklist

- [ ] Backend API running on port 8001
- [ ] GPU provider running on teammate's machine
- [ ] Job submitted (via frontend or script)
- [ ] Provider claims job on-chain
- [ ] Container runs and finishes
- [ ] Provider submits results
- [ ] Backend shows `state: completed` and `result_cid`
- [ ] Frontend `/jobs/{id}` shows on-chain proof data
- [ ] Frontend `/receipts/{id}` displays the NFT receipt

## Troubleshooting

### Provider not claiming jobs
- Verify provider is registered: `python scripts/verify_setup.py`
- Check provider has enough XDC for gas
- Ensure `JOB_ESCROW_ADDRESS` and `RPC_URL` are correct in `.env`

### submitResults reverts
- Contract ownership must be transferred to JobEscrow. Run:
  `python scripts/transfer_ownership.py`
- This transfers ownership of GPURegistry, ReputationSystem, and ProofReceipt to JobEscrow so it can call `incrementJobCompleted`, `recordCompletion`, and `mintReceipt`.

### Frontend install fails with npm
- Use pnpm: `corepack enable && pnpm install`

### Backend doesn't index events
- Check backend logs for errors
- Verify `backend/contracts/JobEscrow.json` exists with full ABI
- The indexer scans from block `82731250` (deployment block) on first start
