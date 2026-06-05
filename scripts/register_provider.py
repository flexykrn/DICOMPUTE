#!/usr/bin/env python3
"""
Register the GPU provider on-chain
Run this ONCE before starting gpu_provider.py
"""

import json
import os
import sys
from pathlib import Path
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

# Config
PRIVATE_KEY = os.getenv("PROVIDER_KEY", "")
RPC_URL = os.getenv("RPC_URL", "https://erpc.apothem.network")
GPU_REGISTRY_ADDRESS = "0xCEf0f0E74e618A95Da97e1216F81d74eA01dE77C"
STAKE_AMOUNT_XDC = float(os.getenv("STAKE_AMOUNT", "1.0"))

if not PRIVATE_KEY:
    print("ERROR: PROVIDER_KEY not set in .env")
    sys.exit(1)

# Load ABI
abi_path = Path(__file__).parent.parent / "artifacts" / "contracts" / "src" / "GPURegistry.sol" / "GPURegistry.json"
with open(abi_path) as f:
    abi = json.load(f)["abi"]

# Connect
w3 = Web3(Web3.HTTPProvider(RPC_URL))
if not w3.is_connected():
    print(f"ERROR: Cannot connect to {RPC_URL}")
    sys.exit(1)

account = Account.from_key(PRIVATE_KEY)
provider_address = account.address

print(f"RPC: {RPC_URL}")
print(f"Provider: {provider_address}")
print(f"Balance: {w3.from_wei(w3.eth.get_balance(provider_address), 'ether')} XDC")

# Load contract
contract = w3.eth.contract(address=GPU_REGISTRY_ADDRESS, abi=abi)

# Check if already registered
try:
    info = contract.functions.providers(provider_address).call()
    if info[3]:  # isRegistered
        print(f"\nProvider already registered!")
        print(f"Stake: {w3.from_wei(info[2], 'ether')} XDC")
        print("You can now run: python gpu_provider.py")
        sys.exit(0)
except Exception as e:
    print(f"Warning checking registration: {e}")

# Register
stake_wei = w3.to_wei(STAKE_AMOUNT_XDC, 'ether')
print(f"\nRegistering with stake: {STAKE_AMOUNT_XDC} XDC ({stake_wei} wei)")

try:
    tx = contract.functions.registerProvider("GPU Provider - PyTorch Training").build_transaction({
        'from': provider_address,
        'nonce': w3.eth.get_transaction_count(provider_address),
        'gas': 200000,
        'gasPrice': w3.to_wei('25', 'gwei'),
        'value': stake_wei
    })
    
    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction if hasattr(signed, 'rawTransaction') else signed.raw_transaction)
    print(f"Transaction sent: 0x{tx_hash.hex()}")
    
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
    if receipt.status == 1:
        print("SUCCESS: Provider registered!")
        print(f"Explorer: https://explorer.apothem.network/tx/0x{tx_hash.hex()}")
        print("\nYou can now run: python gpu_provider.py")
    else:
        print("ERROR: Transaction failed")
        sys.exit(1)
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)
