# DICOMPUTE Manual Setup Guide

**Complete step-by-step instructions for hackathon deployment**

---

## Table of Contents

1. [Step 1: Register Provider on GPURegistry](#step-1-register-provider-on-gpuregistry)
2. [Step 2: Add Secrets to Render Dashboard](#step-2-add-secrets-to-render-dashboard)
3. [Step 3: Build and Run Daemon on Teammate's Machine](#step-3-build-and-run-daemon)
4. [Step 4: Deploy Backend to Render](#step-4-deploy-backend-to-render)
5. [Step 5: Deploy Frontend to Render](#step-5-deploy-frontend-to-render)
6. [Step 6: Test End-to-End](#step-6-test-end-to-end)
7. [Troubleshooting](#troubleshooting)

---

## Step 1: Register Provider on GPURegistry

### What This Does
Registers your teammate's wallet as a compute provider on the blockchain. Without this, `claimJob()` will revert with `ProviderNotRegistered()`.

### Prerequisites
- Python 3 installed on teammate's machine
- Teammate's wallet private key (with TXDC for gas)
- 0.1 XDC stake + gas (~0.01 XDC)
- Get test XDC from: https://faucet.apothem.network

### Detailed Steps

#### 1.1 Get Test XDC

```bash
# Teammate's wallet address (example)
export PROVIDER_ADDRESS="0x..."

# Go to faucet and paste address
# https://faucet.apothem.network
# Wait 1-2 minutes for TXDC to arrive

# Verify balance
curl -X POST https://erpc.apothem.network \
  -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBalance\",\"params\":[\"$PROVIDER_ADDRESS\",\"latest\"],\"id\":1}"
```

#### 1.2 Install Python Dependencies

```bash
cd /path/to/dicompute

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install requirements
pip install web3 python-dotenv
```

#### 1.3 Run Registration Script

```bash
cd /path/to/dicompute

# Option A: Using the script I created
python3 scripts/register_provider.py \
  --key 0xYOUR_PRIVATE_KEY_HERE \
  --metadata '{"gpu":"RTX 4090","vram":"24GB","cuda":"12.0"}'

# Expected output:
# Provider Address: 0x...
# Stake Amount: 0.1 XDC
# Transaction Hash: 0x...
# Waiting for confirmation...
# Provider registered successfully!
```

#### 1.4 Verify Registration

```python
# Quick verification script
from web3 import Web3

w3 = Web3(Web3.HTTPProvider("https://erpc.apothem.network"))

GPU_REGISTRY = "0xCEf0f0E74e618A95Da97e1216F81d74eA01dE77C"
ABI = [{"inputs":[{"internalType":"address","name":"provider","type":"address"}],"name":"getProvider","outputs":[{"components":[{"internalType":"address","name":"addr","type":"address"},{"internalType":"string","name":"metadataURI","type":"string"},{"internalType":"uint256","name":"stake","type":"uint256"},{"internalType":"bool","name":"isRegistered","type":"bool"},{"internalType":"bool","name":"isSlashed","type":"bool"}],"internalType":"struct GPURegistry.Provider","name":"","type":"tuple"}],"stateMutability":"view","type":"function"}]

contract = w3.eth.contract(address=GPU_REGISTRY, abi=ABI)
provider = contract.functions.getProvider("0xTEAMMATE_ADDRESS").call()

print(f"Registered: {provider[3]}")  # Should be True
print(f"Stake: {w3.from_wei(provider[2], 'ether')} XDC")
```

#### 1.5 Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `insufficient funds` | Not enough TXDC | Get more from faucet |
| `ProviderAlreadyRegistered` | Already registered | Skip this step |
| `nonce too low` | Transaction conflict | Wait 10s, retry |
| `execution reverted` | Wrong contract address | Check `deployed-addresses.json` |

---

## Step 2: Add Secrets to Render Dashboard

### What This Does
Sets environment variables that the backend needs but shouldn't be in the code (API keys, JWT tokens).

### Prerequisites
- Render.com account (free)
- Backend service created on Render
- Pinata JWT token

### Detailed Steps

#### 2.1 Get Pinata JWT

```bash
# 1. Go to https://app.pinata.cloud
# 2. Sign up / Log in
# 3. Go to API Keys section
# 4. Create New Key
# 5. Select permissions: pinFileToIPFS, pinJSONToIPFS
# 6. Copy the JWT token (starts with "eyJhbG...")
```

#### 2.2 Add to Render Dashboard

```
1. Go to https://dashboard.render.com
2. Click on your backend service (dicompute-api)
3. Click "Environment" tab
4. Add the following:
```

| Key | Value | Sensitive? |
|-----|-------|------------|
| `PINATA_JWT` | `eyJhbG...your_token` | ✅ Yes |
| `PINATA_API_KEY` | `b8d793...your_key` | ✅ Yes |
| `PINATA_API_SECRET` | `1691b7...your_secret` | ✅ Yes |
| `CORS_ORIGINS` | `https://dicompute.onrender.com,http://localhost:3000` | ❌ No |
| `DATABASE_URL` | `sqlite:///./dicompute.db` | ❌ No |
| `RPC_URL` | `https://erpc.apothem.network` | ❌ No |
| `CHAIN_ID` | `51` | ❌ No |

```
5. Click "Save Changes"
6. Service will auto-restart
```

#### 2.3 Verify Environment Loaded

```bash
curl https://dicompute-api.onrender.com/health

# Should return:
# {
#   "status": "healthy",
#   "version": "1.0.0",
#   "services": {
#     "api": {"status": "ok"},
#     "database": {"status": "ok"},
#     "blockchain": {"status": "ok", "message": "Block #12345"},
#     "ipfs": {"status": "ok", "message": "Pinata authenticated"}
#   }
# }
```

#### 2.4 If IPFS Shows Warning

```bash
# Check Pinata JWT is correct
curl -H "Authorization: Bearer YOUR_JWT" \
  https://api.pinata.cloud/data/testAuthentication

# Should return: {"message":"Congratulations! ..."}
```

---

## Step 3: Build and Run Daemon

### What This Does
Compiles the Go daemon that runs on your teammate's GPU machine. This is the compute provider that executes Docker containers.

### Prerequisites
- Go 1.22+ installed (check with `go version`)
- Docker installed and running
- NVIDIA Container Toolkit (for GPU support)
- `.env` file configured

### Detailed Steps

#### 3.1 Install Go (if not installed)

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install golang-go

# Or download from https://go.dev/dl/
# Verify:
go version
# Should show: go version go1.22.x or higher
```

#### 3.2 Install Docker and NVIDIA Toolkit

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install NVIDIA Container Toolkit
# (Only if GPU is available)
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt update
sudo apt install -y nvidia-container-toolkit
sudo systemctl restart docker

# Verify GPU access
docker run --rm --gpus all nvidia/cuda:12.0-base-ubuntu22.04 nvidia-smi
```

#### 3.3 Create .env File

```bash
cd /path/to/dicompute/daemon

# Copy template
cp .env.example .env

# Edit with nano/vim
nano .env
```

Fill in these required values:

```env
# BLOCKCHAIN (Required)
RPC_URL=https://erpc.apothem.network
CHAIN_ID=51
JOB_ESCROW_ADDRESS=0x2Ff9B760510fc0aAd51a59f8aDA62F8B2631a075

# Provider wallet (must be registered on GPURegistry)
PROVIDER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# IPFS (Required for log uploads)
PINATA_JWT=eyJhbG...your_pinata_jwt...

# BACKEND API
BACKEND_URL=https://dicompute-api.onrender.com

# DOCKER
DOCKER_HOST=unix:///var/run/docker.sock
DOCKER_NETWORK=dicompute
DATA_VOLUME_PATH=/var/lib/dicompute/data

# RESOURCES
MAX_CPU_CORES=8
MAX_RAM_GIB=32
MAX_VRAM_GIB=16

# Set to true if no GPU
MOCK_GPU=false

# LOGGING
LOG_LEVEL=info
```

#### 3.4 Build the Daemon

```bash
cd /path/to/dicompute/daemon

# Download dependencies
go mod tidy

# Build binary
go build -o dicompute-daemon ./cmd/daemon

# Verify binary created
ls -la dicompute-daemon
```

#### 3.5 Run the Daemon

```bash
# Option A: Run directly
./dicompute-daemon

# Option B: Run with logging
./dicompute-daemon 2>&1 | tee daemon.log

# Option C: Run in background (production)
nohup ./dicompute-daemon > daemon.log 2>&1 &
echo $! > daemon.pid

# To stop:
# kill $(cat daemon.pid)
```

#### 3.6 Verify Daemon is Running

```bash
# Check logs
tail -f daemon.log

# Expected output:
# {"level":"info","msg":"starting DICOMPUTE daemon",...}
# {"level":"info","msg":"blockchain client ready","address":"0x..."}
# {"level":"info","msg":"Docker provisioner ready"}
# {"level":"info","msg":"daemon running — waiting for jobs"}

# Check WebSocket endpoint
curl http://localhost:8080/health
# {"status":"ok","clients":0}
```

#### 3.7 Common Build Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `go: module requires go 1.25` | Go version too old | Install Go 1.22+ or change `go.mod` |
| `cannot find package` | Missing `go mod tidy` | Run `go mod tidy` |
| `Docker unavailable` | Docker not running | `sudo systemctl start docker` |
| `blockchain client init failed` | Wrong RPC or key | Check `.env` values |

---

## Step 4: Deploy Backend to Render

### What This Does
Deploys the FastAPI backend that serves as the bridge between frontend and blockchain.

### Detailed Steps

#### 4.1 Create Web Service

```
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repo: flexykrn/dicompute
4. Configure:
```

| Setting | Value |
|---------|-------|
| Name | `dicompute-api` |
| Region | Oregon (US West) |
| Branch | `main` |
| Runtime | `Python 3` |
| Build Command | `cd backend && pip install -r requirements.txt` |
| Start Command | `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1` |
| Plan | Free |

```
5. Click "Create Web Service"
6. Wait for build (2-3 minutes)
```

#### 4.2 Add Environment Variables

```
1. In Render dashboard, click your service
2. Click "Environment" tab
3. Add each variable:
```

Click "Add Environment Variable" for each:

```
Key: CORS_ORIGINS
Value: https://dicompute.onrender.com,http://localhost:3000

Key: DATABASE_URL
Value: sqlite:///./dicompute.db

Key: RPC_URL
Value: https://erpc.apothem.network

Key: CHAIN_ID
Value: 51

Key: PINATA_JWT
Value: (paste your JWT)
[Check "Secret" box]

Key: PINATA_API_KEY
Value: (paste your key)
[Check "Secret" box]

Key: PINATA_API_SECRET
Value: (paste your secret)
[Check "Secret" box]
```

```
4. Click "Save Changes"
5. Service will auto-deploy
```

#### 4.3 Verify Deployment

```bash
# Test health endpoint
curl https://dicompute-api.onrender.com/health

# Test detailed health
curl https://dicompute-api.onrender.com/health

# Test API
curl https://dicompute-api.onrender.com/api/stats
```

#### 4.4 Check Logs

```
1. In Render dashboard, click your service
2. Click "Logs" tab
3. Look for:
   - "Blockchain indexer started"
   - "Job scheduler started"
   - No ERROR messages
```

---

## Step 5: Deploy Frontend to Render

### What This Does
Deploys the Next.js frontend as a static site.

### Detailed Steps

#### 5.1 Create Static Site

```
1. Go to https://dashboard.render.com
2. Click "New +" → "Static Site"
3. Connect same GitHub repo
4. Configure:
```

| Setting | Value |
|---------|-------|
| Name | `dicompute` |
| Region | Oregon (US West) |
| Branch | `main` |
| Build Command | `cd client && npm install && npm run build` |
| Publish Directory | `client/dist` |
| Plan | Free |

```
5. Click "Create Static Site"
6. Wait for build (3-5 minutes)
```

#### 5.2 Add Environment Variables

```
1. Click "Environment" tab
2. Add:
```

```
Key: NEXT_PUBLIC_API_URL
Value: /api

Key: NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
Value: 21f16978fd430146fe7e908c6d64e8b7

Key: NEXT_PUBLIC_JOB_ESCROW_ADDRESS
Value: 0x2Ff9B760510fc0aAd51a59f8aDA62F8B2631a075

Key: NEXT_PUBLIC_GPU_REGISTRY_ADDRESS
Value: 0xCEf0f0E74e618A95Da97e1216F81d74eA01dE77C

Key: NEXT_PUBLIC_PROOF_RECEIPT_ADDRESS
Value: 0xb35EfE4E7071B1c7ce7f00CC7BB667cEc706DBa2

Key: NEXT_PUBLIC_CHAIN_ID
Value: 51

Key: NEXT_PUBLIC_RPC_URL
Value: https://erpc.apothem.network

Key: NEXT_PUBLIC_BLOCK_EXPLORER
Value: https://explorer.apothem.network
```

```
3. Click "Save Changes"
4. Service will rebuild
```

#### 5.3 Add Rewrite Rule

```
1. Click "Redirects/Rewrites" tab
2. Click "Add Rule"
3. Configure:
```

| Type | Source | Destination |
|------|--------|-------------|
| Rewrite | `/api/*` | `https://dicompute-api.onrender.com/api/*` |

```
4. Click "Save"
```

#### 5.4 Verify Deployment

```bash
# Open frontend
curl https://dicompute.onrender.com

# Should return HTML page
# Check browser console for errors
```

---

## Step 6: Test End-to-End

### 6.1 Pre-Test Checklist

```bash
# Backend health
curl https://dicompute-api.onrender.com/health

# Daemon running (on teammate's machine)
curl http://TEAMMATE_IP:8080/health

# Provider registered
# (Check via blockchain explorer)
```

### 6.2 Submit Test Job

```
1. Open https://dicompute.onrender.com
2. Connect MetaMask (switch to XDC Apothem)
3. Go to /wizard
4. Fill Docker image: docker.io/library/hello-world:latest
5. Set CPU: 1000, RAM: 1024, VRAM: 0
6. Set duration: 10 blocks
7. Click "Submit Job on-chain"
8. Approve MetaMask transaction
```

### 6.3 Monitor Execution

```
# Watch daemon logs (teammate's machine)
tail -f /path/to/dicompute/daemon/daemon.log

# Expected sequence:
# 1. "handling job assignment"
# 2. "claiming job on-chain"
# 3. "job claimed on-chain successfully"
# 4. "pulling image..."
# 5. "container started"
# 6. "heartbeat sent"
# 7. "container stopped"
# 8. "uploaded to IPFS"
# 9. "submitting results on-chain"
# 10. "results submitted on-chain successfully"
```

### 6.4 Verify Completion

```
1. Go to /dashboard
2. Should show "JobCompleted" event
3. Should show ProofReceipt NFT
4. Check blockchain explorer:
   https://explorer.apothem.network/tx/0x...
```

---

## Troubleshooting

### Backend Issues

| Symptom | Diagnosis | Fix |
|---------|-----------|-----|
| `502 Bad Gateway` | Backend sleeping | Wait 30s, refresh |
| `CORS error` | Wrong CORS_ORIGINS | Update env var |
| `Database locked` | SQLite concurrency | Restart service |
| `PINATA_JWT invalid` | Wrong JWT | Regenerate in Pinata dashboard |

### Frontend Issues

| Symptom | Diagnosis | Fix |
|---------|-----------|-----|
| Blank page | Build failed | Check Render build logs |
| `Cannot connect to API` | Wrong API URL | Check NEXT_PUBLIC_API_URL |
| Wallet won't connect | Wrong chain | Switch MetaMask to XDC Apothem |
| No events showing | WebSocket blocked | Use polling instead |

### Daemon Issues

| Symptom | Diagnosis | Fix |
|---------|-----------|-----|
| `claimJob failed` | Provider not registered | Run registration script |
| `Docker unavailable` | Docker not running | `sudo systemctl start docker` |
| `IPFS upload failed` | Wrong PINATA_JWT | Check .env |
| `out of gas` | Not enough TXDC | Get more from faucet |

### Render-Specific Issues

| Symptom | Diagnosis | Fix |
|---------|-----------|-----|
| Build fails | npm install error | Check Node version (18+) |
| Deploy stuck | Git sync issue | Push new commit to trigger |
| Env vars not loading | Syntax error | Check for spaces/special chars |
| Service suspended | Free tier limit | Upgrade or wait |

---

## Quick Reference Commands

```bash
# Backend (local)
cd backend && python main.py

# Frontend (local)
cd client && npm run dev

# Daemon (teammate's machine)
cd daemon && ./dicompute-daemon

# Health checks
curl https://dicompute-api.onrender.com/health
curl http://localhost:8080/health

# View logs (Render)
# Go to dashboard.render.com → Service → Logs

# Restart service (Render)
# Go to dashboard.render.com → Service → Manual Deploy → Deploy Latest Commit
```

---

## Support

- **XDC Apothem Faucet**: https://faucet.apothem.network
- **XDC Explorer**: https://explorer.apothem.network
- **Render Docs**: https://render.com/docs
- **Pinata Docs**: https://docs.pinata.cloud
