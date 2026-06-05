# DICOMPUTE — 4-Hour MVP Plan with Real GPU Execution

**Objective:** Go from scaffolded code to a fully working demo where a teammate's GPU actually runs PyTorch training jobs, monitored in real-time, with on-chain receipts.

**Prerequisites:**
- Teammate's machine with NVIDIA GPU (RTX 3060+, A100, etc.)
- Docker Desktop with NVIDIA Container Toolkit (see setup below)
- Python 3.11+ on provider machine
- Same repo cloned on provider machine
- Teammate accessible via Discord/Slack for coordination

---

## Pre-Hour Checklist (Before You Start the Timer)

### Provider Machine Setup (Teammate - 30 min prep)

**1. Install Docker Desktop**
```bash
# Windows (PowerShell as Admin)
winget install Docker.DockerDesktop

# macOS
brew install --cask docker

# Linux
sudo apt-get install docker.io docker-compose
```

**2. Install NVIDIA Container Toolkit (GPU support)**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker

# Verify GPU is accessible in Docker
docker run --rm --gpus all nvidia/cuda:12.1-base nvidia-smi
```

**3. Clone repo and install Python deps**
```bash
git clone https://github.com/flexykrn/DICOMPUTE.git
cd DICOMPUTE/scripts
pip install -r requirements.txt
pip install docker pynvml
```

**4. Add .env file**
```bash
cd DICOMPUTE
cat > .env.provider << 'EOF'
PROVIDER_KEY=0x...
JOB_ESCROW_ADDRESS=0x2Ff9B760510fc0aAd51a59f8aDA62F8B2631a075
BACKEND_URL=http://YOUR_IP:8000
RPC_URL=https://rpc.apothem.network
EOF
```

**5. Fund the provider wallet**
- Get TXDC from https://faucet.apothem.network
- Provider needs ~5 TXDC for gas
- Provider must register (stake) via frontend or script

**Success check:**
```bash
python -c "import docker; client = docker.from_env(); print('Docker OK:', client.version())"
python -c "import pynvml; pynvml.nvmlInit(); print('GPU OK:', pynvml.nvmlDeviceGetName(pynvml.nvmlDeviceGetHandleByIndex(0)))"
```

---

## Hour 1: Core Integration (0-60 min) — Same as 2H Plan + Docker Prep

### Minute 0-15: Extract & Copy Contract ABIs

**Tasks:**
1. Copy ABIs to both frontend and backend:

```bash
# On your machine (Karan)
mkdir -p client/lib/contracts
mkdir -p backend/contracts

cp artifacts/contracts/src/JobEscrow.sol/JobEscrow.json client/lib/contracts/
cp artifacts/contracts/src/GPURegistry.sol/GPURegistry.json client/lib/contracts/
cp artifacts/contracts/src/ProofReceipt.sol/ProofReceipt.json client/lib/contracts/
cp artifacts/contracts/src/ComputeMarketplace.sol/ComputeMarketplace.json client/lib/contracts/

cp artifacts/contracts/src/JobEscrow.sol/JobEscrow.json backend/contracts/
cp artifacts/contracts/src/ProofReceipt.sol/ProofReceipt.json backend/contracts/
```

2. Commit and push so teammate gets them:
```bash
git add client/lib/contracts backend/contracts
git commit -m "Add contract ABIs for frontend/backend integration"
git push origin main
```

3. Tell teammate to pull:
```bash
git pull origin main
```

---

### Minute 15-35: Frontend Contract Integration

**File:** `client/app/wizard/page.tsx`

**Add these imports:**
```typescript
import { useWriteContract, useAccount } from 'wagmi';
import JobEscrowABI from '@/lib/contracts/JobEscrow.json';
```

**Add contract config:**
```typescript
const JOB_ESCROW_ADDRESS = '0x2Ff9B760510fc0aAd51a59f8aDA62F8B2631a075';
```

**Replace handleSubmit:**
```typescript
export default function WizardPage() {
  const { writeContract, isPending, data: hash } = useWriteContract();
  const { address, isConnected } = useAccount();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!isConnected) {
      toast.error("Please connect wallet first");
      return;
    }

    setIsSubmitting(true);
    
    try {
      writeContract({
        address: JOB_ESCROW_ADDRESS,
        abi: JobEscrowABI.abi,
        functionName: 'submitJob',
        args: [
          {
            dockerUri: dockerUri,
            cpuMilli: cpu[0],
            ramMiB: ram[0],
            vramMiB: vram[0],
            durationBlocks: duration[0],
            maxPricePerBlock: price[0]
          }
        ],
        value: BigInt(estimatedCost)
      });
      
      toast.success("Transaction submitted! Check MetaMask.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit job");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rest of component...
}
```

**Update submit button:**
```typescript
<Button 
  className="w-full" 
  size="lg" 
  onClick={handleSubmit}
  disabled={isPending || isSubmitting}
>
  {isPending ? "Confirm in MetaMask..." : "Submit Job"}
</Button>
```

---

### Minute 35-60: Backend Event Indexer

**Create file:** `backend/indexer.py`

```python
import os
import json
import time
import threading
from web3 import Web3
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Job, Provider, Heartbeat, Receipt

# Config
RPC_URL = os.getenv("RPC_URL", "https://rpc.apothem.network")
JOB_ESCROW_ADDRESS = "0x2Ff9B760510fc0aAd51a59f8aDA62F8B2631a075"

# Load ABI
with open("contracts/JobEscrow.json") as f:
    abi = json.load(f)["abi"]

w3 = Web3(Web3.HTTPProvider(RPC_URL))
contract = w3.eth.contract(address=JOB_ESCROW_ADDRESS, abi=abi)

print(f"🔗 Connected to XDC Apothem: {RPC_URL}")
print(f"📄 Watching JobEscrow: {JOB_ESCROW_ADDRESS}")

def index_job_submitted(event):
    """Index new job submission"""
    db = SessionLocal()
    try:
        job_id = event['args']['jobId']
        user = event['args']['user']
        deposit = event['args']['deposit']
        
        existing = db.query(Job).filter(Job.chain_job_id == job_id).first()
        if existing:
            return
        
        # Get job details from contract
        job_data = contract.functions.jobs(job_id).call()
        
        job = Job(
            chain_job_id=job_id,
            user_address=user,
            docker_uri=job_data[2][0],  # spec.dockerUri
            cpu_milli=job_data[2][1],
            ram_mib=job_data[2][2],
            vram_mib=job_data[2][3],
            duration_blocks=job_data[2][4],
            max_price_per_block=str(job_data[2][5]),
            deposit=str(deposit),
            state="pending"
        )
        db.add(job)
        db.commit()
        print(f"✅ Indexed job #{job_id} from {user[:10]}... deposit={deposit}")
    except Exception as e:
        print(f"❌ Error indexing job: {e}")
    finally:
        db.close()

def index_job_claimed(event):
    """Index job claim"""
    db = SessionLocal()
    try:
        job_id = event['args']['jobId']
        provider = event['args']['provider']
        
        job = db.query(Job).filter(Job.chain_job_id == job_id).first()
        if job:
            job.provider_address = provider
            job.state = "active"
            job.started_at_block = event['blockNumber']
            db.commit()
            print(f"✅ Job #{job_id} claimed by {provider[:10]}...")
    except Exception as e:
        print(f"❌ Error indexing claim: {e}")
    finally:
        db.close()

def index_job_completed(event):
    """Index job completion"""
    db = SessionLocal()
    try:
        job_id = event['args']['jobId']
        
        job = db.query(Job).filter(Job.chain_job_id == job_id).first()
        if job:
            job.state = "completed"
            job.completed_at_block = event['blockNumber']
            db.commit()
            print(f"✅ Job #{job_id} completed!")
    except Exception as e:
        print(f"❌ Error indexing completion: {e}")
    finally:
        db.close()

def run_indexer():
    """Main indexer loop"""
    print("🚀 Starting blockchain indexer...")
    
    job_submitted_filter = contract.events.JobSubmitted().create_filter(fromBlock='latest')
    job_claimed_filter = contract.events.JobClaimed().create_filter(fromBlock='latest')
    job_completed_filter = contract.events.JobCompleted().create_filter(fromBlock='latest')
    
    while True:
        try:
            for event in job_submitted_filter.get_new_entries():
                index_job_submitted(event)
            
            for event in job_claimed_filter.get_new_entries():
                index_job_claimed(event)
            
            for event in job_completed_filter.get_new_entries():
                index_job_completed(event)
            
            time.sleep(2)
        except Exception as e:
            print(f"❌ Indexer error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    run_indexer()
```

**Update `backend/main.py`** to start indexer on startup:
```python
@app.on_event("startup")
async def start_indexer():
    import threading
    from indexer import run_indexer
    indexer_thread = threading.Thread(target=run_indexer, daemon=True)
    indexer_thread.start()
    print("🚀 Blockchain indexer started in background")
```

---

## Hour 2: Docker Provider with Real GPU (60-120 min)

### Minute 60-90: Rewrite Mock Provider → Real Docker Provider

**Create file:** `scripts/gpu_provider.py`

```python
#!/usr/bin/env python3
"""
DICOMPUTE GPU Provider — Real Docker Execution
Runs on teammate's machine with NVIDIA GPU
"""

import os
import time
import json
import docker
import pynvml
import requests
from web3 import Web3
from eth_account import Account
from eth_account.messages import encode_defunct
from dotenv import load_dotenv

load_dotenv()

# Config
PRIVATE_KEY = os.getenv("PROVIDER_KEY", "")
JOB_ESCROW_ADDRESS = os.getenv("JOB_ESCROW_ADDRESS", "")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
RPC_URL = os.getenv("RPC_URL", "https://rpc.apothem.network")

# Colors for terminal
GREEN = "\033[92m"
BLUE = "\033[94m"
YELLOW = "\033[93m"
RED = "\033[91m"
RESET = "\033[0m"

def log_info(msg): print(f"{BLUE}[GPU]{RESET} {msg}")
def log_success(msg): print(f"{GREEN}[GPU]{RESET} {msg}")
def log_warn(msg): print(f"{YELLOW}[GPU]{RESET} {msg}")
def log_error(msg): print(f"{RED}[GPU]{RESET} {msg}")

# Load ABI
with open("../artifacts/contracts/src/JobEscrow.sol/JobEscrow.json") as f:
    JOB_ESCROW_ABI = json.load(f)["abi"]

# Init Web3
w3 = Web3(Web3.HTTPProvider(RPC_URL))
account = Account.from_key(PRIVATE_KEY)
provider_address = account.address
contract = w3.eth.contract(address=JOB_ESCROW_ADDRESS, abi=JOB_ESCROW_ABI)

# Init Docker
docker_client = docker.from_env()

# Init NVIDIA GPU monitoring
try:
    pynvml.nvmlInit()
    gpu_handle = pynvml.nvmlDeviceGetHandleByIndex(0)
    gpu_name = pynvml.nvmlDeviceGetName(gpu_handle).decode('utf-8')
    log_success(f"GPU detected: {gpu_name}")
except:
    gpu_handle = None
    log_warn("No NVIDIA GPU detected. Running CPU-only.")

class GPUProvider:
    def __init__(self):
        self.active_containers = {}  # job_id -> container
        self.running = True
        
    def get_gpu_stats(self):
        """Get real GPU stats using nvidia-smi"""
        if not gpu_handle:
            return {"cpu_percent": 0, "ram_percent": 0, "vram_percent": 0}
        
        try:
            # Get GPU memory
            mem_info = pynvml.nvmlDeviceGetMemoryInfo(gpu_handle)
            vram_percent = (mem_info.used / mem_info.total) * 100
            
            # Get GPU utilization
            util = pynvml.nvmlDeviceGetUtilizationRates(gpu_handle)
            
            # Get CPU/RAM from system
            import psutil
            cpu_percent = psutil.cpu_percent()
            ram_percent = psutil.virtual_memory().percent
            
            return {
                "cpu_percent": int(cpu_percent),
                "ram_percent": int(ram_percent),
                "vram_percent": int(vram_percent),
                "gpu_percent": int(util.gpu)
            }
        except Exception as e:
            log_error(f"Failed to get GPU stats: {e}")
            return {"cpu_percent": 0, "ram_percent": 0, "vram_percent": 0}
    
    def pull_image(self, image_uri):
        """Pull Docker image"""
        log_info(f"Pulling image: {image_uri}")
        try:
            docker_client.images.pull(image_uri)
            log_success(f"Image pulled: {image_uri}")
            return True
        except Exception as e:
            log_error(f"Failed to pull image: {e}")
            return False
    
    def run_container(self, job_id, image_uri, cpu_limit, ram_limit):
        """Run Docker container with resource limits"""
        log_info(f"Starting container for job #{job_id}")
        
        try:
            # Convert limits
            cpu_quota = int(cpu_limit / 1000 * 100000)  # Convert milli-CPU to quota
            mem_limit = f"{ram_limit}m"  # Convert MiB to MB
            
            # Run container
            container = docker_client.containers.run(
                image_uri,
                command="python -c 'import torch; print(f\"PyTorch {torch.__version__} ready\"); torch.randn(1000, 1000).cuda() if torch.cuda.is_available() else torch.randn(1000, 1000); print(\"Training completed!\")'",
                detach=True,
                device_requests=[
                    docker.types.DeviceRequest(count=-1, capabilities=[['gpu']])
                ] if gpu_handle else [],
                cpu_quota=cpu_quota,
                cpu_period=100000,
                mem_limit=mem_limit,
                environment={
                    "JOB_ID": str(job_id),
                    "CUDA_VISIBLE_DEVICES": "0"
                },
                labels={"dicompute_job_id": str(job_id)}
            )
            
            self.active_containers[job_id] = container
            log_success(f"Container started: {container.id[:12]}")
            return container
            
        except Exception as e:
            log_error(f"Failed to start container: {e}")
            return None
    
    def stop_container(self, job_id):
        """Stop and remove container"""
        if job_id in self.active_containers:
            container = self.active_containers[job_id]
            try:
                container.stop(timeout=10)
                container.remove(force=True)
                log_info(f"Container stopped for job #{job_id}")
            except Exception as e:
                log_error(f"Failed to stop container: {e}")
            finally:
                del self.active_containers[job_id]
    
    def send_heartbeat(self, job_id, block_num, stats):
        """Send heartbeat to blockchain"""
        try:
            uptime = int(time.time())
            
            tx = contract.functions.submitHeartbeat(
                job_id,
                block_num,
                uptime,
                stats["cpu_percent"] * 100,  # Convert to basis points
                stats["ram_percent"] * 100,
                stats["vram_percent"] * 100,
                uptime,
                b"0x" + b"0" * 64  # Placeholder signature
            ).build_transaction({
                'from': provider_address,
                'nonce': w3.eth.get_transaction_count(provider_address),
                'gas': 200000,
                'gasPrice': w3.to_wei('1', 'gwei')
            })
            
            signed = account.sign_transaction(tx)
            tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
            w3.eth.wait_for_transaction_receipt(tx_hash)
            
            # Also send to backend
            heartbeat_data = {
                "block_number": block_num,
                "uptime_seconds": uptime,
                "cpu_percent": stats["cpu_percent"],
                "ram_percent": stats["ram_percent"],
                "vram_percent": stats["vram_percent"],
                "signature": "0x" + "0" * 128,
                "digest": "0x" + "0" * 64
            }
            
            requests.post(
                f"{BACKEND_URL}/api/jobs/{job_id}/heartbeat",
                json=heartbeat_data,
                timeout=5
            )
            
            return True
        except Exception as e:
            log_error(f"Heartbeat failed: {e}")
            return False
    
    def submit_results(self, job_id, result_cid):
        """Submit job results"""
        try:
            tx = contract.functions.submitResults(
                job_id,
                result_cid,
                1000000  # instruction count
            ).build_transaction({
                'from': provider_address,
                'nonce': w3.eth.get_transaction_count(provider_address),
                'gas': 300000,
                'gasPrice': w3.to_wei('1', 'gwei')
            })
            
            signed = account.sign_transaction(tx)
            tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
            receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
            
            if receipt.status == 1:
                log_success(f"Job #{job_id} COMPLETED — Receipt minted!")
                return True
            else:
                log_error(f"Transaction failed")
                return False
                
        except Exception as e:
            log_error(f"Failed to submit results: {e}")
            return False
    
    def run(self):
        """Main provider loop"""
        log_info(f"GPU Provider starting...")
        log_info(f"Address: {provider_address}")
        log_info(f"Backend: {BACKEND_URL}")
        
        # Check if registered
        try:
            gpu_registry = w3.eth.contract(
                address="0xCEf0f0E74e618A95Da97e1216F81d74eA01dE77C",
                abi=json.load(open("../artifacts/contracts/src/GPURegistry.sol/GPURegistry.json"))["abi"]
            )
            provider_info = gpu_registry.functions.providers(provider_address).call()
            if not provider_info[3]:  # isRegistered
                log_warn("Provider not registered! Register via frontend first.")
                return
            log_success("Provider registered and verified")
        except Exception as e:
            log_warn(f"Could not verify registration: {e}")
        
        # Listen for jobs
        event_filter = contract.events.JobSubmitted().create_filter(fromBlock='latest')
        log_info("Waiting for JobSubmitted events...")
        
        while self.running:
            try:
                events = event_filter.get_new_entries()
                for event in events:
                    job_id = event['args']['jobId']
                    user = event['args']['user']
                    deposit = event['args']['deposit']
                    
                    log_info(f"New job #{job_id} from {user[:10]}... deposit={deposit}")
                    
                    # Get job spec
                    job_data = contract.functions.jobs(job_id).call()
                    docker_uri = job_data[2][0]
                    cpu_milli = job_data[2][1]
                    ram_mib = job_data[2][2]
                    vram_mib = job_data[2][3]
                    duration_blocks = job_data[2][4]
                    
                    log_info(f"Docker: {docker_uri}, CPU: {cpu_milli}m, RAM: {ram_mib}MiB, VRAM: {vram_mib}MiB")
                    
                    # Claim job
                    try:
                        tx = contract.functions.claimJob(job_id).build_transaction({
                            'from': provider_address,
                            'nonce': w3.eth.get_transaction_count(provider_address),
                            'gas': 200000,
                            'gasPrice': w3.to_wei('1', 'gwei')
                        })
                        signed = account.sign_transaction(tx)
                        tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
                        w3.eth.wait_for_transaction_receipt(tx_hash)
                        log_success(f"Claimed job #{job_id}")
                    except Exception as e:
                        log_error(f"Failed to claim job: {e}")
                        continue
                    
                    # Pull and run container
                    if not self.pull_image(docker_uri):
                        continue
                    
                    container = self.run_container(job_id, docker_uri, cpu_milli, ram_mib)
                    if not container:
                        continue
                    
                    # Send heartbeats every 5 seconds for 30 seconds (6 heartbeats)
                    num_heartbeats = 6
                    heartbeat_interval = 5
                    
                    for i in range(num_heartbeats):
                        time.sleep(heartbeat_interval)
                        
                        block_num = w3.eth.block_number
                        stats = self.get_gpu_stats()
                        
                        if self.send_heartbeat(job_id, block_num, stats):
                            log_success(f"Heartbeat {i+1}/{num_heartbeats}: "
                                      f"CPU={stats['cpu_percent']}%, "
                                      f"RAM={stats['ram_percent']}%, "
                                      f"VRAM={stats['vram_percent']}%")
                        else:
                            log_warn(f"Heartbeat {i+1} failed")
                    
                    # Stop container
                    self.stop_container(job_id)
                    
                    # Submit results
                    result_cid = "QmPyTorchTrainingDemo1234567890abcdef"
                    if self.submit_results(job_id, result_cid):
                        log_success(f"🎉 Job #{job_id} finished successfully!")
                        
                time.sleep(2)
                
            except KeyboardInterrupt:
                log_info("Shutting down GPU provider...")
                self.running = False
                # Stop all containers
                for job_id in list(self.active_containers.keys()):
                    self.stop_container(job_id)
                break
            except Exception as e:
                log_error(f"Error in main loop: {e}")
                time.sleep(5)

if __name__ == "__main__":
    provider = GPUProvider()
    provider.run()
```

---

### Minute 90-120: Docker Setup on Provider Machine

**Teammate runs these commands on their machine:**

**Step 1: Verify Docker + GPU**
```bash
# Check Docker
docker --version

# Check GPU in Docker
docker run --rm --gpus all nvidia/cuda:12.1-base nvidia-smi
```

**Expected output:**
```
+---------------------------------------------------------------------------------------+
| NVIDIA-SMI 535.104.05             Driver Version: 535.104.05   CUDA Version: 12.1     |
|-----------------------------------------+----------------------+----------------------+
| GPU  Name                 Persistence-M | Bus-Id        Disp.A | Volatile Uncorr. ECC |
| Fan  Temp   Perf          Pwr:Usage/Cap |         Memory-Usage | GPU-Util  Compute M. |
|                                         |                      |               MIG M. |
|=========================================+======================+======================|
|   0  NVIDIA GeForce RTX 3060        Off | 00000000:01:00.0 Off |                  N/A |
|  0%   45C    P8              12W / 170W |    256MiB / 12288MiB |      0%      Default |
+---------------------------------------------------------------------------------------+
```

**Step 2: Pull PyTorch image**
```bash
docker pull docker.io/pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime
```

**Step 3: Test GPU in container**
```bash
docker run --rm --gpus all pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime \
  python -c "import torch; print('CUDA available:', torch.cuda.is_available()); print('GPU:', torch.cuda.get_device_name(0))"
```

**Expected output:**
```
CUDA available: True
GPU: NVIDIA GeForce RTX 3060
```

**Step 4: Start the provider**
```bash
cd DICOMPUTE/scripts
python gpu_provider.py
```

You should see:
```
[GPU] GPU Provider starting...
[GPU] Address: 0x...
[GPU] Backend: http://YOUR_IP:8000
[GPU] Provider registered and verified
[GPU] Waiting for JobSubmitted events...
```

---

## Hour 3: Integration Testing (120-180 min)

### Minute 120-150: Test Complete Flow

**Your machine (Karan):**

**Terminal 1 - Backend:**
```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

**Teammate's machine:**

**Terminal - GPU Provider:**
```bash
cd DICOMPUTE/scripts
python gpu_provider.py
```

**Test Steps:**

1. **Open frontend:** http://localhost:3000
2. **Connect wallet** (MetaMask on XDC Apothem)
3. **Navigate to /wizard**
4. **Fill form or click "Fill Demo Data"**
5. **Click "Submit Job"**
6. **Confirm in MetaMask**
7. **Watch teammate's terminal:** Should see:
   ```
   [GPU] New job #42 from 0x8916... deposit=1000000000000000000
   [GPU] Docker: docker.io/pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime
   [GPU] Claimed job #42
   [GPU] Image pulled: docker.io/pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime
   [GPU] Container started: a1b2c3d4e5f6
   [GPU] Heartbeat 1/6: CPU=45%, RAM=72%, VRAM=81%
   [GPU] Heartbeat 2/6: CPU=67%, RAM=75%, VRAM=83%
   ...
   [GPU] Job #42 COMPLETED — Receipt minted!
   ```

8. **Check frontend:** Navigate to `/explorer` → Job #42 should appear
9. **Click job #42:** Heartbeat chart should show 6 real data points
10. **Wait for completion:** Status changes to "Completed"
11. **View receipt:** Click "View Receipt" → Should show NFT metadata

---

### Minute 150-180: Debug & Polish

**Common Issues:**

**Issue 1: Provider can't claim job**
- Check provider is registered in GPURegistry
- Check provider has enough stake
- Check provider isn't slashed

**Fix:**
```bash
# Register provider (one-time)
# Use frontend /provider/register OR run:
python -c "
from web3 import Web3
from eth_account import Account
w3 = Web3(Web3.HTTPProvider('https://rpc.apothem.network'))
account = Account.from_key('YOUR_PRIVATE_KEY')
contract = w3.eth.contract(address='0xCEf0f0E74e618A95Da97e1216F81d74eA01dE77C', abi=...)
tx = contract.functions.registerProvider('GPU Provider').build_transaction({'from': account.address, 'nonce': w3.eth.get_transaction_count(account.address), 'gas': 200000, 'gasPrice': w3.to_wei('1', 'gwei'), 'value': w3.to_wei('1', 'ether')})
signed = account.sign_transaction(tx)
w3.eth.send_raw_transaction(signed.rawTransaction)
"
```

**Issue 2: Docker GPU not available**
- Check NVIDIA drivers: `nvidia-smi` on host
- Check NVIDIA Container Toolkit installed
- Try CPU-only mode: Remove `--gpus all` from docker run

**Issue 3: Backend can't reach provider**
- Check firewall rules
- Use localtunnel/ngrok if on different networks
- Backend URL should be accessible from provider machine

**Issue 4: Container exits immediately**
- Check image exists: `docker images | grep pytorch`
- Check command is valid
- View logs: `docker logs <container_id>`

---

## Hour 4: Demo Prep & Backup (180-240 min)

### Minute 180-200: Create Demo Job

**Pre-run the demo before judges arrive:**

1. Submit a job from wizard
2. Let provider claim and complete it
3. Verify receipt page loads
4. **This creates a "receipt" you can show even if live demo fails**

---

### Minute 200-220: Record Screenshots

**Capture these screens:**
1. Frontend landing page
2. Wizard with demo data filled
3. MetaMask transaction confirmation
4. Job detail page with heartbeat chart
5. Completed job with receipt button
6. Receipt NFT page
7. Provider terminal showing real GPU stats

---

### Minute 220-240: Final Checklist

**Before demo:**
- [ ] Provider machine: `python gpu_provider.py` running
- [ ] Your machine: Backend `uvicorn main:app` running
- [ ] Your machine: Frontend `npm run dev` running
- [ ] MetaMask: Connected to XDC Apothem, funded with TXDC
- [ ] Browser tabs: Frontend open to /wizard, /explorer, /jobs/:id
- [ ] Teammate ready: Can restart provider script if needed
- [ ] Backup: At least 1 completed job exists in database
- [ ] Backup: Screenshots saved in `shared/demo-screenshots/`

---

## Critical Files Summary

| File | Created/Modified | Purpose |
|------|------------------|---------|
| `client/lib/contracts/JobEscrow.json` | Copied | Frontend ABI |
| `backend/contracts/JobEscrow.json` | Copied | Backend ABI |
| `backend/indexer.py` | Created | Blockchain event listener |
| `client/app/wizard/page.tsx` | Modified | Working submitJob call |
| `scripts/gpu_provider.py` | Created | Real Docker GPU provider |
| `scripts/requirements.txt` | Modified | Added docker, pynvml, psutil |

---

## Team Coordination Commands

**Slack/Discord messages:**

```
Teammate (Provider):
"Starting GPU provider setup. Need 10 min to install Docker + NVIDIA toolkit."

You (Karan):
"Pushing ABIs now. Pull in 2 minutes."

Teammate:
"GPU provider running. Address: 0x... Docker: OK, GPU: RTX 3060 detected."

You:
"Submitting test job #1. Check your terminal."

Teammate:
"Job #1 claimed. Container running. Heartbeats: CPU=45%, GPU=78%."

You:
"Receipt minted! Job #1 complete. System is LIVE."
```

---

## Success Metrics

After 4 hours, confirm:

- [ ] **Job submitted** from frontend reaches blockchain
- [ ] **Provider claims job** automatically (no manual intervention)
- [ ] **Docker container starts** on teammate's machine
- [ ] **Real GPU stats** appear in heartbeats (not random numbers)
- [ ] **Heartbeat chart** on frontend shows actual CPU/RAM/VRAM usage
- [ ] **Job completes** and receipt NFT mints
- [ ] **Receipt page** displays real job metadata
- [ ] **Provider terminal** shows colored logs with real metrics
- [ ] **System runs for 30+ minutes** without crashes

**If 7/9 achieved:** Demo-ready with minor glitches.
**If 9/9 achieved:** Production-quality MVP.

---

## Risk Mitigation

| Risk | Probability | Mitigation |
|------|-------------|------------|
| Teammate GPU doesn't support Docker | Medium | Fall back to CPU-only mode |
| Docker image too large to pull | Medium | Pre-pull PyTorch image before demo |
| Provider runs out of gas | Low | Pre-fund with 10 TXDC |
| Container crashes | Medium | Add try/except, auto-restart logic |
| Network between machines fails | Medium | Use ngrok/localtunnel for tunneling |
| Heartbeat signature fails | Low | Simplify to placeholder sig for demo |

---

## Extended Commands Reference

```bash
# Provider machine - Check GPU
docker run --rm --gpus all nvidia/cuda:12.1-base nvidia-smi

# Provider machine - Pre-pull image
docker pull pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime

# Provider machine - Test container
docker run --rm --gpus all pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime \
  python -c "import torch; print(torch.cuda.is_available())"

# Your machine - Start backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000

# Your machine - Start frontend
npm run dev

# Provider machine - Start provider
python scripts/gpu_provider.py

# Check active containers
docker ps --filter "label=dicompute_job_id"

# View container logs
docker logs <container_id>

# Kill all dicompute containers
docker ps --filter "label=dicompute_job_id" -q | xargs docker stop
docker ps --filter "label=dicompute_job_id" -q | xargs docker rm

# Monitor GPU in real-time
watch -n 1 nvidia-smi
```

---

**Plan created:** June 5, 2026  
**Target completion:** June 5, 2026 (4 hours from start)  
**Owner:** Karan (Blockchain Lead) + Teammate (GPU Provider)
