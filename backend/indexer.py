"""
Blockchain Event Indexer for NoCapCompute
Listens to XDC Apothem smart contract events and stores in database
"""

import time
import threading
from typing import Optional
from web3 import Web3
from sqlalchemy.orm import Session
from database import get_db, init_db
from models import Job, Provider
import json
import os

# XDC Apothem RPC
XDC_RPC = os.getenv("RPC_URL", "https://erpc.apothem.network")

# Contract addresses (update after deployment)
JOB_ESCROW_ADDRESS = os.getenv("JOB_ESCROW_ADDRESS", "0x2Ff9B760510fc0aAd51a59f8aDA62F8B2631a075")

class BlockchainIndexer:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(XDC_RPC))
        self.running = False
        self.thread = None
        
        # Load ABI (placeholder - update with actual ABI)
        self.job_escrow_abi = self._load_abi()
        
        if self.w3.is_connected():
            print(f"✅ Connected to XDC Apothem (Block: {self.w3.eth.block_number})")
        else:
            print("❌ Failed to connect to XDC Apothem")
    
    def _load_abi(self):
        """Load JobEscrow ABI from file"""
        abi_path = os.path.join(os.path.dirname(__file__), "contracts", "JobEscrow.json")
        if os.path.exists(abi_path):
            with open(abi_path) as f:
                return json.load(f)
        
        # Minimal ABI for events
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
                    {"indexed": False, "name": "resultCID", "type": "string"}
                ],
                "name": "JobCompleted",
                "type": "event"
            }
        ]
    
    def start(self):
        """Start indexer in background thread"""
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self._run, daemon=True)
            self.thread.start()
            print("🚀 Blockchain indexer started")
    
    def stop(self):
        """Stop indexer"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)
            print("🛑 Blockchain indexer stopped")
    
    def _run(self):
        """Main indexer loop"""
        while self.running:
            try:
                self._index_events()
                time.sleep(2)  # Poll every 2 seconds
            except Exception as e:
                print(f"❌ Indexer error: {e}")
                time.sleep(5)  # Wait longer on error
    
    def _index_events(self):
        """Index new blockchain events"""
        if not self.w3.is_connected():
            print("⚠️ Not connected to blockchain")
            return
        
        # Get latest block
        latest_block = self.w3.eth.block_number
        
        # Create contract instance
        contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(JOB_ESCROW_ADDRESS),
            abi=self.job_escrow_abi
        )
        
        # Process JobSubmitted events
        try:
            events = contract.events.JobSubmitted().get_logs(
                fromBlock=latest_block - 10,
                toBlock=latest_block
            )
            for event in events:
                self._handle_job_submitted(event)
        except Exception as e:
            print(f"JobSubmitted error: {e}")
        
        # Process JobClaimed events
        try:
            events = contract.events.JobClaimed().get_logs(
                fromBlock=latest_block - 10,
                toBlock=latest_block
            )
            for event in events:
                self._handle_job_claimed(event)
        except Exception as e:
            print(f"JobClaimed error: {e}")
        
        # Process JobCompleted events
        try:
            events = contract.events.JobCompleted().get_logs(
                fromBlock=latest_block - 10,
                toBlock=latest_block
            )
            for event in events:
                self._handle_job_completed(event)
        except Exception as e:
            print(f"JobCompleted error: {e}")
    
    def _handle_job_submitted(self, event):
        """Handle JobSubmitted event"""
        job_id = event['args']['jobId']
        user = event['args']['user']
        deposit = event['args']['deposit']
        
        # Create database session
        db = next(get_db())
        try:
            # Check if job already exists
            existing = db.query(Job).filter(Job.chain_job_id == job_id).first()
            if not existing:
                job = Job(
                    chain_job_id=job_id,
                    user_address=user,
                    deposit=str(deposit),
                    state="pending"
                )
                db.add(job)
                db.commit()
                print(f"📥 Indexed job #{job_id} from {user}")
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
                print(f"✅ Job #{job_id} claimed by {provider}")
        finally:
            db.close()
    
    def _handle_job_completed(self, event):
        """Handle JobCompleted event"""
        job_id = event['args']['jobId']
        result_cid = event['args'].get('resultCID', '')
        
        db = next(get_db())
        try:
            job = db.query(Job).filter(Job.chain_job_id == job_id).first()
            if job and job.state == "active":
                job.state = "completed"
                job.result_cid = result_cid
                db.commit()
                print(f"🎉 Job #{job_id} completed with CID: {result_cid}")
        finally:
            db.close()

# Global instance
indexer = BlockchainIndexer()

def run_indexer():
    """Start the blockchain indexer"""
    init_db()  # Ensure database is initialized
    indexer.start()