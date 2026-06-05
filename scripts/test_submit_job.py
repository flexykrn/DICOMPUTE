import os
import time
from pathlib import Path
from dotenv import load_dotenv
from web3 import Web3

load_dotenv(Path(__file__).parent / ".env")

RPC_URL = os.getenv("RPC_URL", "https://erpc.apothem.network")
JOB_ESCROW_ADDRESS = os.getenv("JOB_ESCROW_ADDRESS", "0x2Ff9B760510fc0aAd51a59f8aDA62F8B2631a075")
PRIVATE_KEY = os.getenv("PROVIDER_KEY", "")

w3 = Web3(Web3.HTTPProvider(RPC_URL))
assert w3.is_connected(), f"Cannot connect to {RPC_URL}"

account = w3.eth.account.from_key(PRIVATE_KEY)
user_address = account.address

# Load ABI
import json
abi_path = Path(__file__).parent.parent / "artifacts" / "contracts" / "src" / "JobEscrow.sol" / "JobEscrow.json"
with open(abi_path) as f:
    abi = json.load(f)["abi"]

contract = w3.eth.contract(address=JOB_ESCROW_ADDRESS, abi=abi)

# Build spec tuple
docker_uri = "docker.io/library/hello-world:latest"
cpu_milli = 1000
ram_mib = 1024
vram_mib = 0
duration_blocks = 10
max_price_per_block = w3.to_wei(0.001, "ether")  # small amount
deposit = duration_blocks * max_price_per_block

spec = (docker_uri, cpu_milli, ram_mib, vram_mib, duration_blocks, max_price_per_block)

print(f"User: {user_address}")
print(f"Deposit: {w3.from_wei(deposit, 'ether')} XDC")
print(f"Balance: {w3.from_wei(w3.eth.get_balance(user_address), 'ether')} XDC")

count_before = contract.functions.getJobCount().call()
print(f"Job count before: {count_before}")

# Build tx
tx = contract.functions.submitJob(spec, deposit).build_transaction({
    "from": user_address,
    "value": deposit,
    "nonce": w3.eth.get_transaction_count(user_address),
    "gas": 500000,
    "gasPrice": w3.to_wei(25, "gwei"),
    "chainId": 51,
})

signed = account.sign_transaction(tx)
result = w3.eth.send_raw_transaction(signed.raw_transaction)
print(f"Submitted tx: {result.hex()}")

receipt = w3.eth.wait_for_transaction_receipt(result, timeout=60)
print(f"Confirmed in block {receipt.blockNumber}, status={receipt.status}")

count_after = contract.functions.getJobCount().call()
print(f"Job count after: {count_after}")

# Get the new job ID
job_id = count_after
job = contract.functions.getJob(job_id).call()
print(f"Job #{job_id}: docker={job[2][0]}, deposit={job[4]}, state={job[5]}")

# Wait and check backend
print("Waiting 10s for backend indexer...")
time.sleep(10)

import requests
stats = requests.get("http://localhost:8001/api/stats").json()
print(f"Backend stats: {stats}")

pending = requests.get("http://localhost:8001/api/jobs/pending").json()
print(f"Pending jobs: {len(pending)}")
for j in pending:
    print(f"  - chain_job_id={j['chain_job_id']}, docker={j['docker_uri']}, state={j['state']}")
