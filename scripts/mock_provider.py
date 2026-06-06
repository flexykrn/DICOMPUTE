import os
import time
import json
import random
from dotenv import load_dotenv
from web3 import Web3
from eth_account import Account
from eth_account.messages import encode_defunct

load_dotenv()

# Config
PRIVATE_KEY = os.getenv("PROVIDER_KEY", "")
JOB_ESCROW_ADDRESS = os.getenv("JOB_ESCROW_ADDRESS", "")
RPC_URL = os.getenv("RPC_URL", "https://erpc.apothem.network")
FAST_MODE = os.getenv("FAST_MODE", "false").lower() == "true"

# Colors for terminal output
GREEN = "\033[92m"
BLUE = "\033[94m"
YELLOW = "\033[93m"
RED = "\033[91m"
RESET = "\033[0m"

def log_info(msg): print(f"{BLUE}[INFO]{RESET} {msg}")
def log_success(msg): print(f"{GREEN}[SUCCESS]{RESET} {msg}")
def log_warn(msg): print(f"{YELLOW}[WARN]{RESET} {msg}")
def log_error(msg): print(f"{RED}[ERROR]{RESET} {msg}")

# Minimal ABI for JobEscrow
JOB_ESCROW_ABI = [
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "name": "jobId", "type": "uint256"},
            {"indexed": True, "name": "user", "type": "address"},
            {"name": "deposit", "type": "uint256"}
        ],
        "name": "JobSubmitted",
        "type": "event"
    },
    {
        "inputs": [{"name": "jobId", "type": "uint256"}],
        "name": "claimJob",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"name": "jobId", "type": "uint256"},
            {"name": "blockNumber", "type": "uint256"},
            {"name": "uptimeSeconds", "type": "uint256"},
            {"name": "cpuPercent", "type": "uint256"},
            {"name": "ramPercent", "type": "uint256"},
            {"name": "vramPercent", "type": "uint256"},
            {"name": "timestamp", "type": "uint256"},
            {"name": "signature", "type": "bytes"}
        ],
        "name": "submitHeartbeat",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"name": "jobId", "type": "uint256"},
            {"name": "resultCID", "type": "string"},
            {"name": "instructionCount", "type": "uint256"}
        ],
        "name": "submitResults",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "HEARTBEAT_TYPEHASH",
        "outputs": [{"name": "", "type": "bytes32"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "DOMAIN_SEPARATOR",
        "outputs": [{"name": "", "type": "bytes32"}],
        "stateMutability": "view",
        "type": "function"
    }
]

def main():
    if not PRIVATE_KEY or not JOB_ESCROW_ADDRESS:
        log_error("Missing PROVIDER_KEY or JOB_ESCROW_ADDRESS in .env")
        return

    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    if not w3.is_connected():
        log_error(f"Cannot connect to RPC: {RPC_URL}")
        return

    account = Account.from_key(PRIVATE_KEY)
    provider_address = account.address
    log_info(f"Provider: {provider_address}")
    log_info(f"Connected to: {RPC_URL}")
    log_info(f"Fast mode: {FAST_MODE}")

    contract = w3.eth.contract(address=JOB_ESCROW_ADDRESS, abi=JOB_ESCROW_ABI)

    # Get contract constants
    try:
        heartbeat_typehash = contract.functions.HEARTBEAT_TYPEHASH().call()
        domain_separator = contract.functions.DOMAIN_SEPARATOR().call()
        log_info(f"Got DOMAIN_SEPARATOR from contract")
    except Exception as e:
        log_error(f"Failed to get contract constants: {e}")
        # Fallback: compute manually if needed
        domain_separator = bytes(32)  # Will need proper calculation
        heartbeat_typehash = bytes(32)

    # Event filter for JobSubmitted
    event_filter = contract.events.JobSubmitted().create_filter(from_block='latest')
    log_info("Waiting for JobSubmitted events...")

    heartbeat_interval = 2 if FAST_MODE else 5
    num_heartbeats = 3 if FAST_MODE else 6

    while True:
        try:
            events = event_filter.get_new_entries()
            for event in events:
                job_id = event['args']['jobId']
                user = event['args']['user']
                deposit = event['args']['deposit']
                
                log_info(f"New job #{job_id} from {user}, deposit: {deposit}")
                
                # Claim job
                try:
                    tx = contract.functions.claimJob(job_id).build_transaction({
                        'from': provider_address,
                        'nonce': w3.eth.get_transaction_count(provider_address),
                        'gas': 200000,
                        'gasPrice': w3.to_wei('25', 'gwei')
                    })
                    signed = account.sign_transaction(tx)
                    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
                    w3.eth.wait_for_transaction_receipt(tx_hash)
                    log_success(f"Claimed job #{job_id}")
                except Exception as e:
                    log_error(f"Failed to claim job #{job_id}: {e}")
                    continue

                # Send heartbeats
                for i in range(num_heartbeats):
                    time.sleep(heartbeat_interval)
                    
                    block_num = w3.eth.block_number
                    uptime = i * heartbeat_interval
                    cpu = random.randint(4000, 8000)
                    ram = random.randint(2000, 6000)
                    vram = random.randint(1000, 4000)
                    timestamp = int(time.time())
                    
                    # Build EIP-712 struct hash
                    struct_hash = Web3.keccak(
                        eth_abi.encode(
                            ['bytes32', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256'],
                            [heartbeat_typehash, job_id, block_num, uptime, cpu, ram, vram, timestamp]
                        )
                    )
                    
                    # Build digest
                    digest = Web3.keccak(
                        b'\x19\x01' + domain_separator + struct_hash
                    )
                    
                    # Sign
                    message = encode_defunct(digest)
                    signed = account.sign_message(message)
                    signature = signed.signature.hex()
                    
                    try:
                        tx = contract.functions.submitHeartbeat(
                            job_id, block_num, uptime, cpu, ram, vram, timestamp, signature
                        ).build_transaction({
                            'from': provider_address,
                            'nonce': w3.eth.get_transaction_count(provider_address),
                            'gas': 200000,
                            'gasPrice': w3.to_wei('25', 'gwei')
                        })
                        signed_tx = account.sign_transaction(tx)
                        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
                        w3.eth.wait_for_transaction_receipt(tx_hash)
                        log_success(f"Heartbeat {i+1}/{num_heartbeats}: uptime={uptime}s, cpu={cpu/100:.1f}%")
                    except Exception as e:
                        log_error(f"Heartbeat failed: {e}")

                # Submit results
                try:
                    result_cid = "QmPyTorchTrainingDemo1234567890abcdef"
                    instruction_count = 1000000
                    
                    tx = contract.functions.submitResults(
                        job_id, result_cid, instruction_count
                    ).build_transaction({
                        'from': provider_address,
                        'nonce': w3.eth.get_transaction_count(provider_address),
                        'gas': 300000,
                        'gasPrice': w3.to_wei('25', 'gwei')
                    })
                    signed = account.sign_transaction(tx)
                    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
                    w3.eth.wait_for_transaction_receipt(tx_hash)
                    log_success(f"Job #{job_id} COMPLETED  Receipt minted!")
                except Exception as e:
                    log_error(f"Failed to submit results: {e}")

            time.sleep(2)
        except Exception as e:
            log_error(f"Error in event loop: {e}")
            time.sleep(5)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log_info("Shutting down mock provider...")
