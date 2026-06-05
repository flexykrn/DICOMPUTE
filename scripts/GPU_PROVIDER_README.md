# GPU Provider Setup Guide

## Overview
This script runs on a provider's machine with a GPU. It:
1. Listens for job submissions on the XDC blockchain
2. Claims jobs automatically
3. Runs Docker containers with real GPU/CPU resources
4. Sends real-time heartbeats with actual system stats
5. Submits results when complete

## Prerequisites

### Hardware
- NVIDIA GPU (RTX 3060, A100, etc.) - Optional but recommended
- 8GB+ RAM
- Docker-compatible OS (Linux recommended, Windows with WSL2 works)

### Software
```bash
# 1. Docker Desktop
# Ubuntu:
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Or install Docker Desktop from https://docs.docker.com/get-docker/

# 2. NVIDIA Container Toolkit (for GPU support)
sudo apt-get install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker

# 3. Python dependencies
cd scripts
pip install -r requirements.txt
```

## Configuration

1. Copy the example environment file:
```bash
cp .env.provider.example .env
```

2. Edit `.env` with your values:
```
PROVIDER_KEY=0xYOUR_PRIVATE_KEY_HERE
JOB_ESCROW_ADDRESS=0x2Ff9B760510fc0aAd51a59f8aDA62F8B2631a075
BACKEND_URL=http://YOUR_BACKEND_IP:8000
RPC_URL=https://erpc.apothem.network
```

3. **Important**: You must register as a provider first!
   - Visit http://localhost:3000/provider/register
   - Or stake directly via the GPURegistry contract

## Testing GPU Support

```bash
# Check GPU in Docker
docker run --rm --gpus all nvidia/cuda:12.1-base nvidia-smi

# Should show your GPU info

# Pull PyTorch image
docker pull pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime

# Test PyTorch with GPU
docker run --rm --gpus all pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime \
  python -c "import torch; print('CUDA:', torch.cuda.is_available()); print('GPU:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'None')"
```

## Running the Provider

```bash
cd scripts
python gpu_provider.py
```

You should see:
```
[GPU] ============================================================
[GPU] DICOMPUTE GPU Provider Starting...
[GPU] ============================================================
[GPU] Balance: 5.2341 XDC
[GPU] Provider registered. Stake: 1.0 XDC
[GPU] Waiting for JobSubmitted events...
[GPU] Press Ctrl+C to exit
[GPU] ============================================================
```

## How It Works

1. **Event Listening**: Polls blockchain every 2 seconds for `JobSubmitted` events
2. **Auto-Claim**: When a job is found, calls `claimJob()` on-chain
3. **Docker Execution**: 
   - Pulls the requested Docker image
   - Runs container with GPU access and resource limits
   - For PyTorch images: runs a simple matrix multiplication to verify GPU
4. **Heartbeats**: Every 5 seconds for 30 seconds:
   - Reads real CPU/RAM via `psutil`
   - Reads GPU VRAM via `nvidia-smi`
   - Generates EIP-712 signature
   - Submits to blockchain and backend API
5. **Completion**: Stops container, calls `submitResults()`, mints receipt NFT

## Troubleshooting

### "Docker not found"
- Install Docker: https://docs.docker.com/get-docker/
- Add user to docker group: `sudo usermod -aG docker $USER`
- Log out and back in

### "GPU not available"
- Install NVIDIA drivers: `nvidia-smi` should work on host
- Install NVIDIA Container Toolkit (see Prerequisites)
- The script will fall back to CPU-only mode if GPU is unavailable

### "Provider not registered"
- You need to stake XDC and register via the frontend
- Visit http://localhost:3000/provider/register
- Or call `registerProvider()` on GPURegistry contract

### "Low balance"
- Get free TXDC from https://faucet.apothem.network
- Need at least 1 XDC for gas

### "Container exits immediately"
- Check logs: `docker logs CONTAINER_ID`
- Verify image exists: `docker images | grep pytorch`
- The script will retry with `sleep 30` if PyTorch command fails

## Resource Limits

The provider enforces:
- **CPU**: Converts milli-CPU to Docker `--cpu-quota`
- **RAM**: Sets Docker `--memory` limit in MiB
- **GPU**: Passes all GPUs via `--gpus all` (future: limit to specific GPUs)

## Security Notes

- Keep your `PROVIDER_KEY` secret! Never commit it.
- The `.env` file is in `.gitignore` by default
- Use a dedicated wallet for the provider (don't use your main wallet)
- The provider only needs enough XDC for gas (~5 TXDC)

## Monitoring

While running, you'll see colored logs:
- `[GPU]` - General info (blue)
- `[GPU]` Success messages (green)
- `[GPU]` Warnings (yellow)
- `[GPU]` Errors (red)
- `[METRIC]` - Resource stats (cyan)

## Stopping the Provider

Press `Ctrl+C` to gracefully stop:
- Stops all running containers
- Cleans up Docker resources
- Exits cleanly
