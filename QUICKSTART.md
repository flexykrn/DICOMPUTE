# DICOMPUTE — Quick Start Guide (For Your Team)

## Prerequisites

- Node.js 20+
- Python 3.12+
- Foundry (for contracts)
- Git

## 1. Clone & Install

```bash
git clone https://github.com/flexykrn/DICOMPUTE.git
cd DICOMPUTE
```

## 2. Backend (FastAPI + SQLite)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend runs at: http://localhost:8000

API Docs: http://localhost:8000/docs

## 3. Frontend (Next.js 14)

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Frontend runs at: http://localhost:3000

**IMPORTANT:** Get a WalletConnect Project ID from https://cloud.walletconnect.com and add it to `.env`

## 4. Deploy Contracts (Karan)

```bash
cd contracts
cp .env.example .env  # Add your private key
forge script script/Deploy.s.sol --rpc-url https://rpc.apothem.network --broadcast
```

Copy the deployed addresses to:
- `scripts/.env` (for mock provider)
- `client/.env` (for frontend contract calls)

## 5. Run Mock Provider

```bash
cd scripts
cp .env.example .env  # Fill in deployed addresses + provider key
pip install -r requirements.txt
python mock_provider.py
```

## 6. Test the Flow

1. Open http://localhost:3000
2. Connect wallet (MetaMask with XDC Apothem network)
3. Go to /wizard, fill form, click "Submit Job"
4. Watch terminal running mock_provider.py — it should claim the job
5. Go to /jobs/{id} — see heartbeat chart updating
6. Wait for completion → click "View Receipt"

## Team Roles

| Person | Focus | File |
|--------|-------|------|
| Karan | Deploy contracts, fill addresses, test | `contracts/` |
| M2 | Backend polish, add missing endpoints | `backend/` |
| M3 | Frontend polish, add contract interactions | `client/` |
| M4 | Mock provider testing, Docker integration | `scripts/` |
| M5 | Demo script, pitch deck, documentation | `docs/` |

## What's Already Done

✅ Backend scaffold (FastAPI + SQLite + all endpoints)
✅ Frontend scaffold (Next.js 14 + Wagmi + RainbowKit + pages)
✅ Mock provider script (Python, EIP-712 signing)
✅ UI components (Button, Card, Input, Label, Slider, Badge)
✅ Database schema (Jobs, Heartbeats, Providers, Receipts)

## What's Missing (Your Team's Work)

❌ Contract deployment to Apothem
❌ Contract addresses in .env files
❌ WalletConnect Project ID
❌ Real contract calls in frontend (currently placeholder)
❌ Docker provider (V2 feature)
❌ Go daemon (V3 feature)
❌ Full Foundry test coverage

## Hackathon Demo Script (3 Minutes)

1. **Landing page** (15s): "This is DICOMPUTE — verifiable GPU compute"
2. **Submit job** (30s): Fill wizard, MetaMask confirm, show tx
3. **Provider claims** (15s): Show terminal with colored logs
4. **Heartbeats** (45s): Job detail page, chart updates in real-time
5. **Receipt** (30s): "Here's the NFT proof on XDC"
6. **Explorer** (15s): "All jobs are publicly verifiable"

**Good luck! 🚀**
