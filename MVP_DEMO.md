# DICOMPUTE MVP Demo - Use Teammate's GPU from Your Laptop

Script-only user flow. No frontend required.

You submit a job from your laptop via Python script. A teammate's machine with a GPU runs a provider daemon that listens to the blockchain, executes the Docker container, and submits results on-chain.

## Architecture

```
Your Laptop                              Teammate's GPU Machine
------------                            ------------------------
Backend API          <--index events--
  (SQLite + FastAPI)                    scripts/gpu_provider.py
                                        listens for JobSubmitted
                                        claims job -> runs Docker
                                        heartbeats -> submits results

User: python test_submit_job.py
  |
  v
XDC Apothem Blockchain (JobEscrow)
  ^
  |
Provider: python gpu_provider.py
```

## Prerequisites

1. XDC Apothem testnet XDC in the deployer/provider wallet
2. Python 3.10+ with backend deps installed on both machines
3. Docker installed on the GPU provider machine
4. The provider wallet registered on `GPURegistry` with stake

## Deployed Contracts (XDC Apothem)

See `deployed-addresses.json`:
- JobEscrow: `0x2Ff9B760510fc0aAd51a59f8aDA62F8B2631a075`
- GPURegistry: `0xCEf0f0E74e618A95Da97e1216F81d74eA01dE77C`
- ProofReceipt: `0xb35EfE4E7071B1c7ce7f00CC7BB667cEc706DBa2`
- ReputationSystem: `0xf02ac8fDab069bd62B2CE9F53Ea0d09c725880E3`

## Step 1: Start Backend API (on laptop or shared server)

```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8001
```

The backend will:
- Initialize SQLite DB
- Index blockchain events from deployment block
- Expose REST API at `http://localhost:8001`
- Skip local Docker scheduling because execution is delegated to the remote GPU provider

## Step 2: Start GPU Provider (on teammate's machine with GPU + Docker)

Copy the repo to the GPU machine, then:

```bash
cd scripts
cp .env.example .env
# Edit .env and set PROVIDER_KEY to the registered provider's private key
# Set BACKEND_URL to point at the laptop backend if on LAN, e.g. http://192.168.1.x:8001
python gpu_provider.py
```

The provider will:
- Listen for `JobSubmitted` events on XDC Apothem
- Pull the Docker image and run the container with GPU support (falls back to CPU)
- Send on-chain heartbeats
- Submit results and trigger a Proof-of-Compute receipt NFT mint

## Step 3: Submit a Job

From your laptop:

```bash
cd scripts
python test_submit_job.py
```

This submits a `hello-world` Docker job directly to the `JobEscrow` contract on XDC Apothem.

## Step 4: Watch the Flow

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

## Demo Checklist

- [ ] Backend API running on port 8001
- [ ] GPU provider running on teammate's machine
- [ ] Job submitted via `python test_submit_job.py`
- [ ] Provider claims job on-chain
- [ ] Container runs and finishes
- [ ] Provider submits results
- [ ] Backend shows `state: completed` and `result_cid`

## Troubleshooting

### Provider not claiming jobs
- Verify provider is registered: `python scripts/verify_setup.py`
- Check provider has enough XDC for gas
- Ensure `JOB_ESCROW_ADDRESS` and `RPC_URL` are correct in `.env`

### submitResults reverts
- Contract ownership must be transferred to JobEscrow. Run:
  `python scripts/transfer_ownership.py`
- This transfers ownership of GPURegistry, ReputationSystem, and ProofReceipt to JobEscrow so it can call `incrementJobCompleted`, `recordCompletion`, and `mintReceipt`.

### Backend doesn't index events
- Check backend logs for errors
- Verify `backend/contracts/JobEscrow.json` exists with full ABI
- The indexer scans from block `82731250` (deployment block) on first start

### Provider script crashes with UnicodeEncodeError
- This was fixed by removing emojis. Pull latest `main`.
