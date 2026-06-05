import json
from web3 import Web3
from eth_account import Account

RPC_URL = "https://erpc.apothem.network"
PRIVATE_KEY = "851f2396c6ff431410782c211db3a996a332f0decad132f21d5f60bb077f35e9"
JOB_ESCROW = "0x2Ff9B760510fc0aAd51a59f8aDA62F8B2631a075"

w3 = Web3(Web3.HTTPProvider(RPC_URL))
account = w3.eth.account.from_key(PRIVATE_KEY)
addr = account.address

def transfer_ownership(contract_name, contract_address):
    with open(f"../artifacts/contracts/src/{contract_name}.sol/{contract_name}.json") as f:
        abi = json.load(f)["abi"]
    contract = w3.eth.contract(address=contract_address, abi=abi)
    
    current_owner = contract.functions.owner().call()
    print(f"{contract_name} owner: {current_owner}")
    
    if current_owner.lower() == JOB_ESCROW.lower():
        print(f"  Already owned by JobEscrow")
        return
    
    tx = contract.functions.transferOwnership(JOB_ESCROW).build_transaction({
        "from": addr,
        "nonce": w3.eth.get_transaction_count(addr),
        "gas": 100000,
        "gasPrice": w3.to_wei(25, "gwei"),
        "chainId": 51,
    })
    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
    print(f"  Transfer tx: {tx_hash.hex()}, status={receipt.status}")
    
    new_owner = contract.functions.owner().call()
    print(f"  New owner: {new_owner}")

transfer_ownership("ProofReceipt", "0xb35EfE4E7071B1c7ce7f00CC7BB667cEc706DBa2")
transfer_ownership("GPURegistry", "0xCEf0f0E74e618A95Da97e1216F81d74eA01dE77C")
transfer_ownership("ReputationSystem", "0xf02ac8fDab069bd62B2CE9F53Ea0d09c725880E3")
