# DICOMPUTE - Hackathon Deploy Guide (Render)

## Prerequisites
- GitHub repo pushed: https://github.com/flexykrn/DICOMPUTE
- Render account (free): https://render.com

## Step 1: Deploy Backend (5 min)
1. Go to https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Connect your GitHub repo `flexykrn/DICOMPUTE`
4. Configure:
   - **Name**: `dicompute-backend`
   - **Environment**: Python 3
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables:
   - `PRIVATE_KEY` = your provider wallet private key (with XDC for gas)
   - `PINATA_API_KEY` = your Pinata key
   - `PINATA_SECRET_API_KEY` = your Pinata secret
   - `RPC_URL` = `https://erpc.apothem.network`
6. Click **Create Web Service**

Wait for build to finish (2-3 min). Copy the URL: `https://dicompute-backend.onrender.com`

## Step 2: Deploy Frontend (5 min)
1. Click **New +** → **Web Service**
2. Same repo, but:
   - **Name**: `dicompute-frontend`
   - **Environment**: Node
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
3. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL` = `https://dicompute-backend.onrender.com` (from Step 1)
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` = your WalletConnect project ID
4. Click **Create Web Service**

Wait for build (3-4 min). Your app is live!

## Step 3: Test (5 min)
- Open frontend URL
- Connect wallet (MetaMask with XDC Apothem)
- Submit a test job
- Check that it appears in the explorer

## Troubleshooting
- If backend fails: check that PRIVATE_KEY has XDC testnet tokens
- If frontend fails: check NEXT_PUBLIC_API_URL has no trailing slash
- CORS is already set to allow all origins in `backend/main.py`

## Important Notes
- SQLite database is ephemeral on Render free tier (resets on redeploy)
- For hackathon demo this is fine - jobs are also on blockchain
- Provider script (`scripts/gpu_provider.py`) must run on a machine with Docker
- That machine needs to point to your deployed backend URL
