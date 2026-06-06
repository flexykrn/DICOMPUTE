"""
Blockchain Event Indexer for DICOMPUTE
Listens to XDC Apothem smart contract events and stores in database
"""

import time
import threading
from typing import Optional
from web3 import Web3
from sqlalchemy.orm import Session
from database import get_db, init_db
from models import Job, Provider, Receipt
import json
import os

# XDC Apothem RPC
XDC_RPC = os.getenv("RPC_URL", "https://erpc.apothem.network")

# Contract addresses (update after deployment)
JOB_ESCROW_ADDRESS = os.getenv("JOB_ESCROW_ADDRESS", "0x2Ff9B760510fc0aAd51a59f8aDA62F8B2631a075")
PROOF_RECEIPT_ADDRESS = os.getenv("PROOF_RECEIPT_ADDRESS", "0xb35EfE4E7071B1c7ce7f00CC7BB667cEc706DBa2")

class BlockchainIndexer:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(XDC_RPC))
        self.running = False
        self.thread = None
        self.last_indexed_block = None
        self.deployment_block = 82731250
        
        # Load ABIs - try file first, fallback to inline
        self.job_escrow_abi = self._load_abi("JobEscrow.json") or self._load_job_escrow_fallback_abi()
        self.proof_receipt_abi = self._load_abi("ProofReceipt.json") or self._load_proof_receipt_fallback_abi()
        
        if self.w3.is_connected():
            print(f" Connected to XDC Apothem (Block: {self.w3.eth.block_number})")
        else:
            print(" Failed to connect to XDC Apothem")
    
    def _load_abi(self, filename: str):
        """Load contract ABI from file"""
        abi_path = os.path.join(os.path.dirname(__file__), "contracts", filename)
        if os.path.exists(abi_path):
            with open(abi_path) as f:
                data = json.load(f)
                if isinstance(data, dict) and "abi" in data:
                    return data["abi"]
                return data
        return None
    
    def _load_job_escrow_fallback_abi(self):
        """Minimal ABI for JobEscrow events"""
        return [
            {
                "anonymous": False,
                "inputs": [
                    {"indexed": True, "name": "jobId", "type": "uint256"},
                    {"indexed": True, "name": "user", "type": "address"},
                    {"indexed": False, "name": "deposit", "type": "uint256"}
                ],
                "name": "JobSubmitted",
                "type": "event"
            },
            {
                "anonymous": False,
                "inputs": [
                    {"indexed": True, "name": "jobId", "type": "uint256"},
                    {"indexed": True, "name": "provider", "type": "address"}
                ],
                "name": "JobClaimed",
                "type": "event"
            },
            {
                "anonymous": False,
                "inputs": [
                    {"indexed": True, "name": "jobId", "type": "uint256"},
                    {"indexed": True, "name": "provider", "type": "address"},
                    {"indexed": False, "name": "payout", "type": "uint256"}
                ],
                "name": "JobCompleted",
                "type": "event"
            },
            {
                "anonymous": False,
                "inputs": [
                    {"indexed": True, "name": "jobId", "type": "uint256"},
                    {"indexed": False, "name": "resultCID", "type": "string"},
                    {"indexed": False, "name": "instructionCount", "type": "uint256"}
                ],
                "name": "ResultsSubmitted",
                "type": "event"
            }
        ]
    
    def _load_proof_receipt_fallback_abi(self):
        """Minimal ABI for ProofReceipt events"""
        return [
            {
                "anonymous": False,
                "inputs": [
                    {"indexed": True, "name": "tokenId", "type": "uint256"},
                    {"indexed": True, "name": "jobId", "type": "uint256"},
                    {"indexed": True, "name": "user", "type": "address"},
                    {"indexed": False, "name": "provider", "type": "address"},
                    {"indexed": False, "name": "resultCID", "type": "string"},
                    {"indexed": False, "name": "cost", "type": "uint256"}
                ],
                "name": "ReceiptMinted",
                "type": "event"
            }
        ]
    
    def start(self):
        """Start indexer in background thread"""
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self._run, daemon=True)
            self.thread.start()
            print(" Blockchain indexer started")
    
    def stop(self):
        """Stop indexer"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)
            print(" Blockchain indexer stopped")
    
    def _run(self):
        """Main indexer loop"""
        while self.running:
            try:
                self._index_events()
                time.sleep(2)  # Poll every 2 seconds
            except Exception as e:
                print(f" Indexer error: {e}")
                time.sleep(5)  # Wait longer on error
    
    def _index_events(self):
        """Index new blockchain events"""
        if not self.w3.is_connected():
            print(" Not connected to blockchain")
            return
        
        # Get latest block
        latest_block = self.w3.eth.block_number
        
        # Determine from_block
        if self.last_indexed_block is None:
            from_block = self.deployment_block
        else:
            from_block = self.last_indexed_block + 1
        
        if from_block < 0:
            from_block = 0
        if from_block > latest_block:
            return
        
        # Create contract instances
        contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(JOB_ESCROW_ADDRESS),
            abi=self.job_escrow_abi
        )
        proof_contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(PROOF_RECEIPT_ADDRESS),
            abi=self.proof_receipt_abi
        )
        
        # Process JobSubmitted events
        try:
            event_filter = contract.events.JobSubmitted().create_filter(
                from_block=from_block,
                to_block=latest_block
            )
            events = event_filter.get_all_entries()
            for event in events:
                self._handle_job_submitted(event, contract)
        except Exception as e:
            print(f"JobSubmitted error: {e}")
        
        # Process JobClaimed events
        try:
            event_filter = contract.events.JobClaimed().create_filter(
                from_block=from_block,
                to_block=latest_block
            )
            events = event_filter.get_all_entries()
            for event in events:
                self._handle_job_claimed(event)
        except Exception as e:
            print(f"JobClaimed error: {e}")
        
        # Process ResultsSubmitted events
        try:
            event_filter = contract.events.ResultsSubmitted().create_filter(
                from_block=from_block,
                to_block=latest_block
            )
            events = event_filter.get_all_entries()
            for event in events:
                self._handle_results_submitted(event)
        except Exception as e:
            print(f"ResultsSubmitted error: {e}")
        
        # Process JobCompleted events
        try:
            event_filter = contract.events.JobCompleted().create_filter(
                from_block=from_block,
                to_block=latest_block
            )
            events = event_filter.get_all_entries()
            for event in events:
                self._handle_job_completed(event)
        except Exception as e:
            print(f"JobCompleted error: {e}")
        
        # Process ReceiptMinted events
        try:
            event_filter = proof_contract.events.ReceiptMinted().create_filter(
                from_block=from_block,
                to_block=latest_block
            )
            events = event_filter.get_all_entries()
            for event in events:
                self._handle_receipt_minted(event)
        except Exception as e:
            print(f"ReceiptMinted error: {e}")
        
        # Process HeartbeatReceived events
        try:
            event_filter = contract.events.HeartbeatReceived().create_filter(
                fromBlock=from_block,
                toBlock=latest_block
            )
            for event in event_filter.get_all_entries():
                self._handle_heartbeat_received(event)
        except Exception as e:
            print(f"HeartbeatReceived error: {e}")

        # Process ProviderRegistered events
        try:
            event_filter = contract.events.ProviderRegistered().create_filter(
                fromBlock=from_block,
                toBlock=latest_block
            )
            for event in event_filter.get_all_entries():
                self._handle_provider_registered(event)
        except Exception as e:
            print(f"ProviderRegistered error: {e}")

        self.last_indexed_block = latest_block
    
    def _handle_job_submitted(self, event, contract):
        """Handle JobSubmitted event"""
        job_id = event['args']['jobId']
        user = event['args']['user']
        deposit = event['args']['deposit']
        
        # Fetch full job details from contract to get spec
        docker_uri = ""
        cpu_milli = 0
        ram_mib = 0
        vram_mib = 0
        duration_blocks = 0
        max_price_per_block = "0"
        try:
            job_data = contract.functions.getJob(job_id).call()
            spec = job_data[2]
            docker_uri = spec[0]
            cpu_milli = int(spec[1])
            ram_mib = int(spec[2])
            vram_mib = int(spec[3])
            duration_blocks = int(spec[4])
            max_price_per_block = str(spec[5])
        except Exception as e:
            print(f" Could not fetch job spec for #{job_id}: {e}")
        
        # Create database session
        db = next(get_db())
        try:
            # Check if job already exists
            existing = db.query(Job).filter(Job.chain_job_id == job_id).first()
            if not existing:
                job = Job(
                    chain_job_id=job_id,
                    user_address=user,
                    docker_uri=docker_uri,
                    cpu_milli=cpu_milli,
                    ram_mib=ram_mib,
                    vram_mib=vram_mib,
                    duration_blocks=duration_blocks,
                    max_price_per_block=max_price_per_block,
                    deposit=str(deposit),
                    state="pending"
                )
                db.add(job)
                db.commit()
                print(f" Indexed job #{job_id} from {user}")
        finally:
            db.close()
    
    def _handle_job_claimed(self, event):
        """Handle JobClaimed event"""
        job_id = event['args']['jobId']
        provider = event['args']['provider']
        
        db = next(get_db())
        try:
            job = db.query(Job).filter(Job.chain_job_id == job_id).first()
            if job and job.state == "pending":
                job.state = "active"
                job.provider_address = provider
                db.commit()
                print(f" Job #{job_id} claimed by {provider}")
        finally:
            db.close()
    
    def _handle_results_submitted(self, event):
        """Handle ResultsSubmitted event - captures result CID"""
        job_id = event['args']['jobId']
        result_cid = event['args'].get('resultCID', '')
        instruction_count = event['args'].get('instructionCount', 0)
        
        db = next(get_db())
        try:
            job = db.query(Job).filter(Job.chain_job_id == job_id).first()
            if job:
                job.result_cid = result_cid
                job.instruction_count = instruction_count
                db.commit()
                print(f" Results submitted for job #{job_id}: {result_cid[:50]}")
        finally:
            db.close()
    
    def _handle_job_completed(self, event):
        """Handle JobCompleted event"""
        job_id = event['args']['jobId']
        
        db = next(get_db())
        try:
            job = db.query(Job).filter(Job.chain_job_id == job_id).first()
            if job and job.state == "active":
                job.state = "completed"
                db.commit()
                print(f" Job #{job_id} completed")
        finally:
            db.close()
    
    def _handle_receipt_minted(self, event):
        """Handle ReceiptMinted event"""
        args = event['args']
        token_id = args['tokenId']
        job_id = args['jobId']
        user = args['user']
        provider = args['provider']
        result_cid = args.get('resultCID', '')
        cost = args.get('cost', 0)
        
        db = next(get_db())
        try:
            existing = db.query(Receipt).filter(Receipt.token_id == token_id).first()
            if not existing:
                receipt = Receipt(
                    token_id=token_id,
                    job_id=job_id,
                    user_address=user,
                    provider_address=provider,
                    result_cid=result_cid,
                    cost=str(cost)
                )
                db.add(receipt)
                db.commit()
                print(f" Indexed receipt NFT #{token_id} for job #{job_id}")
        finally:
            db.close()

# Global instance
indexer = BlockchainIndexer()

def run_indexer():
    """Start the blockchain indexer"""
    init_db()  # Ensure database is initialized
    indexer.start()

    def _handle_heartbeat_received(self, event):
        """Handle HeartbeatReceived event"""
        args = event['args']
        job_id = args['jobId']
        block_number = event['blockNumber']
        
        print(f"  Heartbeat for job #{job_id} at block {block_number}")
        
        # Update job's last heartbeat block
        db = next(get_db())
        try:
            job = db.query(Job).filter(Job.chain_job_id == job_id).first()
            if job:
                job.last_heartbeat_block = block_number
                db.commit()
                print(f"  Updated last_heartbeat_block for job #{job_id}")
        except Exception as e:
            print(f"  Heartbeat DB error: {e}")
        finally:
            db.close()

    def _handle_provider_registered(self, event):
        """Handle ProviderRegistered event"""
        args = event['args']
        provider_address = args['provider']
        stake = args['stake']
        
        print(f"  Provider registered: {provider_address[:20]}... stake={stake}")
        
        db = next(get_db())
        try:
            provider = db.query(Provider).filter(Provider.address == provider_address).first()
            if not provider:
                provider = Provider(
                    address=provider_address,
                    stake=stake,
                    is_registered=True
                )
                db.add(provider)
                db.commit()
                print(f"  Added new provider to DB")
        except Exception as e:
            print(f"  Provider DB error: {e}")
        finally:
            db.close()
