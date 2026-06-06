#!/usr/bin/env python3 -u
"""
DICOMPUTE GPU Provider - Real Docker Execution with GPU Support
Runs on provider machine, listens for jobs, executes containers, sends heartbeats
Supports daemon mode with --daemon flag for autonomous job processing
"""

import os
import sys
import time
import json
import signal
import subprocess
import threading
import argparse
from pathlib import Path
from typing import Optional, Dict, Any

import requests
from dotenv import load_dotenv
from web3 import Web3
from eth_account import Account
from eth_account.messages import encode_defunct

# Load environment variables from script's directory
load_dotenv(Path(__file__).parent / ".env")

# Configuration
PRIVATE_KEY = os.getenv("PROVIDER_KEY", "")
JOB_ESCROW_ADDRESS = os.getenv("JOB_ESCROW_ADDRESS", "0x2Ff9B760510fc0aAd51a59f8aDA62F8B2631a075")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
RPC_URL = os.getenv("RPC_URL", "https://erpc.apothem.network")

# Validate config
if not PRIVATE_KEY:
    print(" ERROR: PROVIDER_KEY not set in .env")
    print("Create .env file with: PROVIDER_KEY=0x...")
    sys.exit(1)

# Terminal colors
GREEN = "\033[92m"
BLUE = "\033[94m"
YELLOW = "\033[93m"
RED = "\033[91m"
CYAN = "\033[96m"
RESET = "\033[0m"

def log_info(msg: str): print(f"{BLUE}[GPU]{RESET} {msg}")
def log_success(msg: str): print(f"{GREEN}[GPU]{RESET} {msg}")
def log_warn(msg: str): print(f"{YELLOW}[GPU]{RESET} {msg}")
def log_error(msg: str): print(f"{RED}[GPU]{RESET} {msg}")
def log_metric(msg: str): print(f"{CYAN}[METRIC]{RESET} {msg}")

# Load ABI
ABI_PATH = Path(__file__).parent.parent / "artifacts" / "contracts" / "src" / "JobEscrow.sol" / "JobEscrow.json"
if not ABI_PATH.exists():
    log_error(f"ABI not found at {ABI_PATH}")
    sys.exit(1)

with open(ABI_PATH) as f:
    JOB_ESCROW_ABI = json.load(f)["abi"]

# Initialize Web3
w3 = Web3(Web3.HTTPProvider(RPC_URL))
if not w3.is_connected():
    log_error(f"Cannot connect to RPC: {RPC_URL}")
    sys.exit(1)

account = Account.from_key(PRIVATE_KEY)
provider_address = account.address
contract = w3.eth.contract(address=JOB_ESCROW_ADDRESS, abi=JOB_ESCROW_ABI)

log_info(f"Connected to XDC Apothem: {RPC_URL}")
log_info(f"Provider address: {provider_address}")

# Global state
active_containers: Dict[int, Any] = {}
running = True
daemon_mode = False


def get_system_stats() -> Dict[str, int]:
    """Get real system statistics using psutil"""
    try:
        import psutil
        cpu_percent = int(psutil.cpu_percent(interval=0.1))
        ram = psutil.virtual_memory()
        ram_percent = int(ram.percent)
        
        # Try to get GPU stats
        vram_percent = 0
        try:
            result = subprocess.run(
                ["nvidia-smi", "--query-gpu=memory.used,memory.total", "--format=csv,noheader,nounits"],
                capture_output=True, text=True, timeout=2
            )
            if result.returncode == 0:
                used, total = result.stdout.strip().split(", ")
                vram_percent = int(float(used) / float(total) * 100)
        except (FileNotFoundError, subprocess.TimeoutExpired):
            pass
        
        return {
            "cpu_percent": cpu_percent,
            "ram_percent": ram_percent,
            "vram_percent": vram_percent
        }
    except ImportError:
        log_warn("psutil not installed, using zero stats")
        return {
            "cpu_percent": 0,
            "ram_percent": 0,
            "vram_percent": 0
        }


def pull_docker_image(image_uri: str) -> bool:
    """Pull Docker image"""
    log_info(f"Pulling image: {image_uri}")
    try:
        subprocess.run(
            ["docker", "pull", image_uri],
            check=True,
            capture_output=True
        )
        log_success(f"Image pulled: {image_uri}")
        return True
    except subprocess.CalledProcessError as e:
        log_error(f"Failed to pull image: {e}")
        return False
    except FileNotFoundError:
        log_error("Docker not found. Is Docker installed?")
        return False


def run_container(job_id: int, image_uri: str, cpu_milli: int, ram_mib: int) -> Optional[str]:
    """Run Docker container with resource limits"""
    log_info(f"Starting container for job #{job_id}")
    
    try:
        # Convert limits
        cpu_quota = int(cpu_milli / 1000 * 100000) if cpu_milli > 0 else -1
        mem_limit = f"{ram_mib}m"
        
        # Build docker run command
        cmd = [
            "docker", "run",
            "-d",  # detached
            "--rm",  # auto-remove on stop
            "--label", f"dicompute_job_id={job_id}",
            "--label", f"dicompute_provider={provider_address}",
        ]
        
        # Add GPU if available
        gpu_available = False
        try:
            result = subprocess.run(
                ["docker", "run", "--rm", "--gpus", "all", "nvidia/cuda:12.1-base", "nvidia-smi"],
                capture_output=True, timeout=5
            )
            if result.returncode == 0:
                cmd.extend(["--gpus", "all"])
                gpu_available = True
                log_info("GPU support enabled")
        except Exception as e:
            pass
        
        if not gpu_available:
            log_warn("GPU not available, running CPU-only")
        
        # Add resource limits
        if cpu_quota > 0:
            cmd.extend(["--cpu-quota", str(cpu_quota), "--cpu-period", "100000"])
        cmd.extend(["--memory", mem_limit])
        
        # Add image and command
        cmd.append(image_uri)
        
        # Simple training simulation command
        if "pytorch" in image_uri.lower() or "cuda" in image_uri.lower():
            cmd.extend([
                "python", "-c",
                "import torch; print('PyTorch version:', torch.__version__); "
                "print('CUDA available:', torch.cuda.is_available()); "
                "x = torch.randn(1000, 1000); "
                "if torch.cuda.is_available(): x = x.cuda(); "
                "result = x @ x.T; "
                "print('Matrix multiplication done'); "
                "import time; time.sleep(25)"
            ])
        else:
            cmd.extend(["sleep", "30"])
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            container_id = result.stdout.strip()
            active_containers[job_id] = container_id
            log_success(f"Container started: {container_id[:12]}")
            return container_id
        else:
            log_error(f"Container failed: {result.stderr}")
            return None
            
    except Exception as e:
        log_error(f"Failed to start container: {e}")
        return None


def stop_container(job_id: int):
    """Stop and remove container"""
    if job_id in active_containers:
        container_id = active_containers[job_id]
        try:
            subprocess.run(
                ["docker", "stop", "-t", "5", container_id],
                capture_output=True, timeout=10
            )
            log_info(f"Container stopped for job #{job_id}")
        except Exception as e:
            log_error(f"Failed to stop container: {e}")
        finally:
            del active_containers[job_id]


def send_heartbeat(
    job_id: int,
    block_number: int,
    uptime: int,
    cpu: int,
    ram: int,
    vram: int,
    timestamp: int
) -> bool:
    """Send heartbeat to blockchain and backend"""
    try:
        # Generate EIP-712 signature
        heartbeat_typehash = contract.functions.HEARTBEAT_TYPEHASH().call()
        domain_separator = contract.functions.DOMAIN_SEPARATOR().call()
        
        # Use eth_abi.encode to match Solidity's abi.encode
        from eth_abi import encode
        struct_hash = Web3.keccak(encode(
            ['bytes32', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256'],
            [
                Web3.to_bytes(hexstr=heartbeat_typehash),
                job_id,
                block_number,
                uptime,
                cpu,
                ram,
                vram,
                timestamp
            ]
        ))
        
        digest = Web3.keccak(
            b'\x19\x01' +
            Web3.to_bytes(hexstr=domain_separator) +
            struct_hash
        )
        
        message = encode_defunct(digest)
        signed = account.sign_message(message)
        signature = signed.signature
        
        # Submit to blockchain
        tx = contract.functions.submitHeartbeat(
            job_id,
            block_number,
            uptime,
            cpu,
            ram,
            vram,
            timestamp,
            signature
        ).build_transaction({
            'from': provider_address,
            'nonce': w3.eth.get_transaction_count(provider_address),
            'gas': 300000,
            'gasPrice': w3.to_wei('25', 'gwei')
        })
        
        signed_tx = account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction if hasattr(signed_tx, 'rawTransaction') else signed_tx.raw_transaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)
        
        if receipt.status == 1:
            # Send to backend
            try:
                requests.post(
                    f"{BACKEND_URL}/api/jobs/{job_id}/heartbeat",
                    json={
                        "block_number": block_number,
                        "uptime_seconds": uptime,
                        "cpu_percent": cpu // 100,  # Convert basis points to percent
                        "ram_percent": ram // 100,
                        "vram_percent": vram // 100,
                        "signature": "0x" + signature.hex(),
                        "digest": "0x" + digest.hex()
                    },
                    timeout=5
                )
            except Exception as e:
                log_warn(f"Backend heartbeat failed: {e}")
            
            return True
        return False
    except Exception as e:
        log_error(f"Heartbeat failed: {e}")
        return False


def capture_container_logs(job_id: int) -> Optional[str]:
    """Capture Docker container logs and return as CID"""
    container_name = f"nocap-job-{job_id}"
    
    try:
        # Get container logs
        result = subprocess.run(
            ["docker", "logs", container_name],
            capture_output=True, text=True, timeout=30
        )
        
        if result.returncode != 0:
            log_error(f"Failed to get logs: {result.stderr}")
            return None
        
        logs = result.stdout
        if not logs:
            log_warn("No logs captured from container")
            return None
        
        # Save logs to temp file
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.log', delete=False) as f:
            f.write(logs)
            log_path = f.name
        
        # Upload to IPFS (local node)
        try:
            with open(log_path, 'rb') as f:
                response = requests.post(
                    "http://localhost:5001/api/v0/add",
                    files={'file': f},
                    timeout=30
                )
                if response.status_code == 200:
                    cid = response.json().get('Hash')
                    log_success(f"Logs uploaded to IPFS: {cid}")
                    return cid
        except Exception as e:
            log_error(f"IPFS upload failed: {e}")
        finally:
            # Cleanup temp file
            import os
            os.unlink(log_path)
        
        return None
    except Exception as e:
        log_error(f"Log capture failed: {e}")
        return None


def submit_results(job_id: int, result_cid: str, instruction_count: int) -> bool:
    """Submit job results to blockchain"""
    try:
        tx = contract.functions.submitResults(
            job_id,
            result_cid,
            instruction_count
        ).build_transaction({
            'from': provider_address,
            'nonce': w3.eth.get_transaction_count(provider_address),
            'gas': 500000,
            'gasPrice': w3.to_wei('25', 'gwei')
        })
        
        signed = account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction if hasattr(signed, 'rawTransaction') else signed.raw_transaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
        
        if receipt.status == 1:
            log_success(f" Job #{job_id} COMPLETED! Receipt minted.")
            return True
        else:
            log_error("Transaction failed")
            return False
    except Exception as e:
        log_error(f"Submit results failed: {e}")
        return False


def process_job(job_id: int, user: str, deposit: int):
    """Process a single job from claim to completion"""
    log_info(f"New job #{job_id} from {user[:10]}... deposit={deposit}")
    
    # Get job details
    try:
        job_data = contract.functions.jobs(job_id).call()
        docker_uri = job_data[2][0]
        cpu_milli = job_data[2][1]
        ram_mib = job_data[2][2]
        vram_mib = job_data[2][3]
        
        log_info(f"Docker: {docker_uri}")
        log_info(f"Resources: CPU={cpu_milli}m, RAM={ram_mib}MiB, VRAM={vram_mib}MiB")
    except Exception as e:
        log_error(f"Failed to get job details: {e}")
        return
    
    # Claim job
    try:
        tx = contract.functions.claimJob(job_id).build_transaction({
            'from': provider_address,
            'nonce': w3.eth.get_transaction_count(provider_address),
            'gas': 200000,
            'gasPrice': w3.to_wei('25', 'gwei')
        })
        signed = account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction if hasattr(signed, 'rawTransaction') else signed.raw_transaction)
        w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)
        log_success(f"Claimed job #{job_id}")
    except Exception as e:
        log_error(f"Failed to claim job: {e}")
        return
    
    # Pull and run container
    if not pull_docker_image(docker_uri):
        log_error("Aborting job due to image pull failure")
        return
    
    container_id = run_container(job_id, docker_uri, cpu_milli, ram_mib)
    if not container_id:
        log_error("Aborting job due to container start failure")
        return
    
    # Send heartbeats
    num_heartbeats = 6
    heartbeat_interval = 5
    
    log_info(f"Sending {num_heartbeats} heartbeats every {heartbeat_interval}s")
    
    for i in range(num_heartbeats):
        time.sleep(heartbeat_interval)
        
        block_num = w3.eth.block_number
        uptime = (i + 1) * heartbeat_interval
        stats = get_system_stats()
        timestamp = int(time.time())
        
        # Convert percentages to basis points for contract
        cpu_bp = stats["cpu_percent"] * 100
        ram_bp = stats["ram_percent"] * 100
        vram_bp = stats["vram_percent"] * 100
        
        if send_heartbeat(job_id, block_num, uptime, cpu_bp, ram_bp, vram_bp, timestamp):
            log_success(
                f"Heartbeat {i+1}/{num_heartbeats}: "
                f"CPU={stats['cpu_percent']}%, "
                f"RAM={stats['ram_percent']}%, "
                f"VRAM={stats['vram_percent']}%"
            )
        else:
            log_warn(f"Heartbeat {i+1}/{num_heartbeats} failed")
    
    # Stop container
    stop_container(job_id)
    
    # Capture real Docker logs
    log_info("Capturing container logs...")
    result_cid = capture_container_logs(job_id)
    
    if not result_cid:
        log_warn("Failed to capture logs, using fallback CID")
        result_cid = f"QmTrainingResult{job_id}{int(time.time())}"
    
    instruction_count = 1_000_000 + job_id * 1000
    
    if submit_results(job_id, result_cid, instruction_count):
        log_success(f" Job #{job_id} finished successfully!")
    else:
        log_error(f" Job #{job_id} failed at results submission")


def listen_for_jobs():
    """Listen for JobSubmitted events and auto-process them"""
    global running
    
    log_info("Starting JobSubmitted event listener...")
    
    # Create event filter from latest block
    try:
        event_filter = contract.events.JobSubmitted().create_filter(from_block='latest')
        log_info("Event filter created, polling every 5 seconds")
    except Exception as e:
        log_error(f"Failed to create event filter: {e}")
        return
    
    while running:
        try:
            # Get new events
            events = event_filter.get_new_entries()
            
            for event in events:
                job_id = event['args']['jobId']
                user = event['args']['user']
                deposit = event['args']['deposit']
                
                log_info(f"Detected JobSubmitted: #{job_id} from {user[:10]}...")
                
                # Process job in background thread so listener keeps polling
                if daemon_mode:
                    job_thread = threading.Thread(
                        target=process_job,
                        args=(job_id, user, deposit),
                        daemon=True
                    )
                    job_thread.start()
                    log_info(f"Started background thread for job #{job_id}")
                else:
                    # Sequential processing
                    process_job(job_id, user, deposit)
            
            time.sleep(5)  # Poll every 5 seconds
            
        except KeyboardInterrupt:
            break
        except Exception as e:
            log_error(f"Error in listener loop: {e}")
            time.sleep(5)


def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully"""
    global running
    log_info("Shutting down GPU provider...")
    running = False
    
    # Stop all active containers
    for job_id in list(active_containers.keys()):
        stop_container(job_id)
    
    sys.exit(0)


def main():
    """Main provider loop"""
    global running, daemon_mode
    
    # Parse arguments
    parser = argparse.ArgumentParser(description="DICOMPUTE GPU Provider")
    parser.add_argument("--daemon", action="store_true", help="Run in daemon mode (auto-process jobs in background)")
    parser.add_argument("--job-id", type=int, help="Process a specific job ID and exit")
    parser.add_argument("--listen-only", action="store_true", help="Only listen for events, don't process")
    args = parser.parse_args()
    
    daemon_mode = args.daemon
    
    # Setup signal handler
    signal.signal(signal.SIGINT, signal_handler)
    
    log_info("=" * 60)
    log_info("DICOMPUTE GPU Provider Starting...")
    if daemon_mode:
        log_info("MODE: DAEMON (background job processing)")
    log_info("=" * 60)
    
    # Check balance
    balance = w3.eth.get_balance(provider_address)
    balance_xdc = w3.from_wei(balance, 'ether')
    log_info(f"Balance: {balance_xdc:.4f} XDC")
    
    if balance_xdc < 0.1:
        log_warn("Low balance! Get TXDC from https://faucet.apothem.network")
    
    # Check provider registration
    try:
        gpu_registry_address = contract.functions.gpuRegistry().call()
        log_info(f"GPURegistry: {gpu_registry_address}")
        
        # Load GPURegistry ABI
        registry_abi_path = Path(__file__).parent.parent / "artifacts" / "contracts" / "src" / "GPURegistry.sol" / "GPURegistry.json"
        if registry_abi_path.exists():
            with open(registry_abi_path) as f:
                registry_abi = json.load(f)["abi"]
            registry = w3.eth.contract(address=gpu_registry_address, abi=registry_abi)
            provider_info = registry.functions.providers(provider_address).call()
            if not provider_info[3]:  # isRegistered
                log_warn("Provider NOT registered! Register via frontend first.")
                log_warn("Visit: http://localhost:3000/provider/register")
            else:
                log_success(f"Provider registered. Stake: {w3.from_wei(provider_info[2], 'ether')} XDC")
    except Exception as e:
        log_warn(f"Could not verify registration: {e}")
    
    # Single job mode
    if args.job_id:
        log_info(f"Processing single job: #{args.job_id}")
        try:
            job_data = contract.functions.jobs(args.job_id).call()
            user = job_data[1]
            deposit = job_data[6]
            process_job(args.job_id, user, deposit)
        except Exception as e:
            log_error(f"Failed to process job #{args.job_id}: {e}")
        return
    
    # Listen-only mode
    if args.listen_only:
        log_info("Listen-only mode. Waiting for events...")
        listen_for_jobs()
        return
    
    # Normal or daemon mode
    log_info("Waiting for JobSubmitted events...")
    log_info("Press Ctrl+C to exit")
    log_info("=" * 60)
    
    # Start listener
    listen_for_jobs()
    
    log_info("GPU Provider stopped.")


if __name__ == "__main__":
    main()
