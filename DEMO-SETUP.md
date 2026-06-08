# DICOMPUTE MVP — Demo Setup Guide

> **Goal:** Submit a job from your laptop → Blockchain holds it → Teammate's GPU laptop runs it → You get an NFT receipt.

## ✅ What Already Works (Deployed on Render)

| Component | Status | URL |
|-----------|--------|-----|
| Frontend | ✅ Live | https://dicompute.onrender.com |
| Backend API | ✅ Live | https://dicompute-backend.onrender.com |
| Smart Contracts | ✅ On XDC Apothem | See addresses below |

**You can already:**
- Submit a job from the wizard
- See it on the blockchain
- Backend stores it in the database
- Explorer shows pending jobs

## 🔴 What Still Needs to Happen (Your Teammate's Laptop)

The **daemon** is the missing piece. It's the program that:
1. Watches the blockchain for your job
2. Claims it on-chain
3. Runs Docker with GPU
4. Submits results back to blockchain
5. Triggers the NFT mint

**Without the daemon running, your job sits on the blockchain forever as "Pending".**

## 📋 Step-by-Step: What Your Teammate Must Do

### Step 1: Install Go (if not already)
Download from https://go.dev/dl/ → Install → Verify with `go version`

### Step 2: Get the Code
```bash
git clone https://github.com/flexykrn/DICOMPUTE.git
cd DICOMPUTE/daemon
```

### Step 3: Create .env file
Create `daemon/.env` with:
```bash
RPC_URL=https://erpc.apothem.network
CHAIN_ID=51
JOB_ESCROW_ADDRESS=0x2Ff9B760510fc0aAd51a59f8aDA62F8B2631a075
PROOF_RECEIPT_ADDRESS=0xb35EfE4E7071B1c7ce7f00CC7BB667cEc706DBa2
PROVIDER_PRIVATE_KEY=0x...your_wallet_private_key...
PROVIDER_ADDRESS=0x...your_wallet_address...
BACKEND_URL=https://dicompute-backend.onrender.com
BACKEND_API_KEY=***
DOCKER_HOST=unix:///var/run/docker.sock
DATA_VOLUME_PATH=/var/lib/dicompute/data
PINATA_JWT=your_pinata_jwt_or_leave_blank
HEARTBEAT_INTERVAL=30s
HEARTBEAT_COUNT=6
MAX_CPU_CORES=8
MAX_RAM_GIB=32
MAX_VRAM_GIB=16
MOCK_GPU=false
LOG_LEVEL=info
```

**Important:** The provider wallet needs TXDC (test XDC) for gas fees.

### Step 4: Register as Provider (One-Time)
This stakes 0.1 XDC so the contract allows you to claim jobs:

```bash
cd ..
npx hardhat run scripts/register-provider.js --network xdc
```

**Verify:** Check `GPURegistry` on https://explorer.apothem.network

### Step 5: Build and Run the Daemon
```bash
cd daemon
go build -o dicompute-daemon cmd/daemon/main.go
./dicompute-daemon
```

You should see:
```
blockchain client ready
Docker provisioner ready
daemon running — waiting for jobs
```

## 🎬 Demo Flow (2 Minutes)

### On Your Laptop (Tenant):
1. Open https://dicompute.onrender.com/wizard
2. Connect MetaMask (XDC Apothem, Chain 51)
3. Fill demo data: Docker image, CPU, RAM, GPU, bounty
4. Click **"Submit Job on-chain"**
5. Approve MetaMask transaction

### On Teammate's Laptop (Provider):
1. Daemon logs show: `claiming job on-chain`
2. Then: `job claimed successfully`
3. Then: `pulling image` → `container started`
4. Then: Heartbeats sent every 30 seconds
5. Then: `container stopped` → `submitting results on-chain`
6. Then: `results submitted successfully`

### Back on Your Laptop:
1. Dashboard shows job status: **Pending → Active → Completed**
2. You get a toast: **"Job completed! ProofReceipt minted"**
3. Dashboard shows your **NFT receipt** with Token ID

## 🧠 How It Actually Works (The Full Flow)

```
Your Laptop                    Teammate's GPU Laptop
┌─────────────┐                 ┌─────────────┐
│  Next.js    │ ──submitJob──▶  │  Go Daemon  │
│  Frontend   │                 │  (Docker)   │
│  (Port 3000)│ ◀─JobCompleted──│  (Port 8080)│
└──────┬──────┘                 └──────┬──────┘
       │                              │
       │                              │ claimJob
       │                              │ submitResults
       │                              ▼
       │                       ┌─────────────┐
       │                       │ XDC Apothem │
       │                       │ Blockchain  │
       │                       │ (Chain 51)  │
       │                       └──────┬──────┘
       │                              │
       │                              │ events
       ▼                              ▼
┌─────────────┐                 ┌─────────────┐
│ FastAPI     │                 │ Smart       │
│ Backend     │ ◀──indexer───── │ Contracts   │
│ (Port 8001) │                 │ JobEscrow   │
└─────────────┘                 │ GPURegistry │
                                │ ProofReceipt│
                                └─────────────┘
```

## ⚠️ Critical Requirements

| Requirement | Why It Matters |
|-------------|---------------|
| **Provider wallet has TXDC** | Gas fees for claimJob + submitResults |
| **Provider registered in GPURegistry** | Contract rejects unregistered providers |
| **Docker + NVIDIA drivers** | Daemon needs GPU passthrough |
| **Daemon running during demo** | Nothing happens without it |

## 🔧 Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| "claimJob failed" | Provider not registered | Run Step 4 |
| "No connection adapters" | Wrong RPC URL | Use `https://erpc.apothem.network` |
| "Docker unavailable" | Docker not running | Start Docker Desktop |
| "No NVIDIA GPUs" | Drivers missing | Install NVIDIA drivers + Container Toolkit |
| Job stays "Pending" | Daemon not running | Start daemon on GPU laptop |
| Frontend shows 502 | Render building | Wait 2 minutes, refresh |

## 📞 Contract Addresses (XDC Apothem Testnet)

| Contract | Address |
|----------|---------|
| JobEscrow | `0x2Ff9B760510fc0aAd51a59f8aDA62F8B2631a075` |
| GPURegistry | `0xCEf0f0E74e618A95Da97e1216F81d74eA01dE77C` |
| ProofReceipt | `0xb35EfE4E7071B1c7ce7f00CC7BB667cEc706DBa2` |
| DICOToken | `0xdA08a27339E2EA93AfCe6270c14FA35C1bE48bf4` |

## ✅ Final Checklist Before Demo

- [ ] Teammate installed Go
- [ ] Teammate cloned repo
- [ ] Teammate created `.env` with private key
- [ ] Teammate ran `register-provider.js` (0.1 XDC staked)
- [ ] Teammate built daemon: `go build ...`
- [ ] Teammate running daemon: `./dicompute-daemon`
- [ ] You have MetaMask with XDC Apothem testnet
- [ ] You have TXDC for bounty
- [ ] Frontend loads at https://dicompute.onrender.com

**If all 9 checkboxes are ticked, your demo will work flawlessly in 2 minutes.**
