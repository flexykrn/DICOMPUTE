import os
import time
import json
from pathlib import Path
from dotenv import load_dotenv
from web3 import Web3
from eth_account import Account

load_dotenv(Path(__file__).parent / ".env")

RPC_URL = os.getenv("RPC_URL", "https://erpc.apothem.network")
JOB_ESCROW_ADDRESS = os.getenv("JOB_ESCROW_ADDRESS", "0x2Ff9B760510fc0aAd51a59f8aDA62F8B2631a075")
PRIVATE_KEY = os.getenv("PROVIDER_KEY", "")

w3 = Web3(Web3.HTTPProvider(RPC_URL))
assert w3.is_connected(), f"Cannot connect to {RPC_URL}"

account = w3.eth.account.from_key(PRIVATE_KEY)
provider_address = account.address

with open(Path(__file__).parent.parent / "artifacts" / "contracts" / "src" / "JobEscrow.sol" / "JobEscrow.json") as f:
    abi = json.load(f)["abi"]

contract = w3.eth.contract(address=JOB_ESCROW_ADDRESS, abi=abi)

job_id = int(os.getenv("JOB_ID", "2"))
print(f"Provider: {provider_address}")
print(f"Completing job #{job_id}")

# Claim job
tx = contract.functions.claimJob(job_id).build_transaction({
    "from": provider_address,
    "nonce": w3.eth.get_transaction_count(provider_address),
    "gas": 300000,
    "gasPrice": w3.to_wei(25, "gwei"),
    "chainId": 51,
})
signed = account.sign_transaction(tx)
result = w3.eth.send_raw_transaction(signed.raw_transaction)
receipt = w3.eth.wait_for_transaction_receipt(result, timeout=60)
print(f"Claimed job #{job_id} in block {receipt.blockNumber}, status={receipt.status}")

# Wait a few seconds to simulate work
print("Simulating work for 3s...")
time.sleep(3)

# Submit results
result_cid = f"QmRealResult{job_id}{int(time.time())}"
instruction_count = 1_000_000 + job_id * 1000

tx = contract.functions.submitResults(job_id, result_cid, instruction_count).build_transaction({
    "from": provider_address,
    "nonce": w3.eth.get_transaction_count(provider_address),
    "gas": 500000,
    "gasPrice": w3.to_wei(25, "gwei"),
    "chainId": 51,
})
signed = account.sign_transaction(tx)
result = w3.eth.send_raw_transaction(signed.raw_transaction)
receipt = w3.eth.wait_for_transaction_receipt(result, timeout=60)
print(f"Submitted results for job #{job_id} in block {receipt.blockNumber}, status={receipt.status}")

# Check backend
import requests
time.sleep(5)
stats = requests.get("http://localhost:8001/api/stats").json()
print(f"Backend stats: {stats}")
job = requests.get(f"http://localhost:8001/api/jobs/{job_id}").json()
print(f"Job #{job_id} state: {job['state']}, result: {job.get('result_cid')}")
