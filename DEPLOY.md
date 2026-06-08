# DICOMPUTE Hackathon Deployment Guide

**Free Render.com deployment for XDC Apothem Testnet**

---

## Architecture

```
Render Static Site (FREE)
  └── Next.js Frontend  →  https://dicompute.onrender.com

Render Web Service (FREE)
  └── FastAPI Backend   →  https://dicompute-api.onrender.com

XDC Apothem Testnet (FREE)
  └── Smart Contracts   →  Already deployed ✓

Teammate's Machine (LOCAL)
  └── Go Daemon + GPU   →  Not deployed, runs locally
```

---

## Prerequisites

1. Render.com account (free)
2. Pinata account (free tier for IPFS)
3. MetaMask with XDC Apothem Testnet
4. Test XDC from faucet: https://faucet.apothem.network

---

## Step 1: Deploy Backend API

### 1.1 Create Web Service on Render

1. Go to https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Connect your GitHub repo
4. Configure:

| Setting | Value |
|---------|-------|
| Name | `dicompute-api` |
| Runtime | `Python 3` |
| Build Command | `cd backend && pip install -r requirements.txt` |
| Start Command | `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1` |
| Plan | Free |

### 1.2 Add Environment Variables

In Render dashboard → Environment:

```
CORS_ORIGINS=https://dicompute.onrender.com,http://localhost:3000
DATABASE_URL=sqlite:///./dicompute.db
PINATA_JWT=your_pinata_jwt_here
PINATA_API_KEY=your_pinata_key
PINATA_API_SECRET=your_pinata_secret
RPC_URL=https://erpc.apothem.network
CHAIN_ID=51
```

### 1.3 Verify Deployment

```bash
curl https://dicompute-api.onrender.com/health
# Should return: {"status":"ok","service":"dicompute-api"}

curl https://dicompute-api.onrender.com/health/ready
# Should return: {"ready":true}
```

---

## Step 2: Deploy Frontend

### 2.1 Create Static Site on Render

1. Go to https://dashboard.render.com
2. Click **New +** → **Static Site**
3. Connect same GitHub repo
4. Configure:

| Setting | Value |
|---------|-------|
| Name | `dicompute` |
| Build Command | `cd client && npm install && npm run build` |
| Publish Directory | `client/dist` |
| Plan | Free |

### 2.2 Add Environment Variables

```
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=21f16978fd430146fe7e908c6d64e8b7
NEXT_PUBLIC_JOB_ESCROW_ADDRESS=0x2Ff9B760510fc0aAd51a59f8aDA62F8B2631a075
NEXT_PUBLIC_GPU_REGISTRY_ADDRESS=0xCEf0f0E74e618A95Da97e1216F81d74eA01dE77C
NEXT_PUBLIC_PROOF_RECEIPT_ADDRESS=0xb35EfE4E7071B1c7ce7f00CC7BB667cEc706DBa2
NEXT_PUBLIC_CHAIN_ID=51
NEXT_PUBLIC_RPC_URL=https://erpc.apothem.network
NEXT_PUBLIC_BLOCK_EXPLORER=https://explorer.apothem.network
```

### 2.3 Add Rewrite Rule

In Render dashboard → Redirects/Rewrites:

- **Source**: `/api/*`
- **Destination**: `https://dicompute-api.onrender.com/api/*`

---

## Step 3: Configure Provider Daemon (Teammate's Machine)

### 3.1 Create .env file

```bash
cd daemon
cp .env.example .env
# Edit .env with actual values
```

Required values:
```
RPC_URL=https://erpc.apothem.network
CHAIN_ID=51
JOB_ESCROW_ADDRESS=0x2Ff9B760510fc0aAd51a59f8aDA62F8B2631a075
PROVIDER_PRIVATE_KEY=0x...teammate_private_key...
PINATA_JWT=eyJhbG...same_as_backend...
BACKEND_URL=https://dicompute-api.onrender.com
```

### 3.2 Register Provider on GPURegistry

```bash
python3 scripts/register_provider.py \
  --key 0x...teammate_private_key... \
  --metadata '{"gpu":"RTX 4090","vram":"24GB"}'
```

Requires 0.1 XDC stake. Get test XDC from faucet.

### 3.3 Build and Run Daemon

```bash
cd daemon
go mod tidy
go build ./cmd/daemon
./daemon
```

---

## Step 4: Test End-to-End

1. Open frontend: https://dicompute.onrender.com
2. Connect MetaMask (XDC Apothem)
3. Go to `/wizard`
4. Submit job with Docker image
5. Approve MetaMask transaction
6. Watch daemon logs on teammate's machine
7. Verify job completion in `/dashboard`

---

## Free Tier Limits

| Resource | Limit |
|----------|-------|
| Render Static Site | 100 GB bandwidth/month |
| Render Web Service | 512 MB RAM, sleeps after 15 min |
| SQLite | Ephemeral (resets on deploy) |
| Pinata | 1 GB storage |

**Note**: Web service sleeps after 15 min inactivity. First request after sleep takes ~30s to wake up.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS errors | Update `CORS_ORIGINS` in backend env |
| Build fails | Check `npm run build` locally first |
| Daemon can't claim | Verify provider registered on GPURegistry |
| IPFS upload fails | Check `PINATA_JWT` is valid |
| WebSocket disconnects | Expected on free tier (no persistent connections) |

---

## Quick Commands

```bash
# Local testing
backend:  cd backend && python main.py
frontend: cd client && npm run dev
daemon:   cd daemon && go run ./cmd/daemon

# Build for production
frontend: cd client && npm run build
daemon:   cd daemon && go build ./cmd/daemon
```
