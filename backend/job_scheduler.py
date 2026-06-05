"""
Job Scheduler for GPU Resource Allocation
Matches jobs to available GPU providers
"""

import time
import threading
from typing import Optional, List
from sqlalchemy.orm import Session
from models import Job
from database import get_db
from gpu_provider import gpu_manager

class JobScheduler:
    """Schedules jobs to GPU providers"""
    
    def __init__(self):
        self.running = False
        self.scheduler_thread = None
        self.check_interval = 5  # seconds
    
    def start(self):
        """Start the scheduler"""
        if not self.running:
            self.running = True
            self.scheduler_thread = threading.Thread(target=self._run, daemon=True)
            self.scheduler_thread.start()
            print("🚀 Job scheduler started")
    
    def stop(self):
        """Stop the scheduler"""
        self.running = False
        if self.scheduler_thread:
            self.scheduler_thread.join(timeout=5)
            print("🛑 Job scheduler stopped")
    
    def _run(self):
        """Main scheduler loop"""
        while self.running:
            try:
                self._schedule_pending_jobs()
                time.sleep(self.check_interval)
            except Exception as e:
                print(f"❌ Scheduler error: {e}")
                time.sleep(10)
    
    def _schedule_pending_jobs(self):
        """Find pending jobs and assign to providers"""
        db = next(get_db())
        try:
            # Get all pending jobs
            pending_jobs = db.query(Job).filter(Job.state == "pending").all()
            
            for job in pending_jobs:
                # Find matching provider
                required_specs = {
                    "min_vram_gb": job.vram_mib / 1024 if job.vram_mib else 0,
                    "min_cpu_cores": job.cpu_milli / 1000 if job.cpu_milli else 1,
                    "min_ram_gb": job.ram_mib / 1024 if job.ram_mib else 1
                }
                
                # Get available providers
                providers = gpu_manager.get_available_providers(required_specs)
                
                if providers:
                    # Assign to best provider (least GPU usage)
                    best_provider = providers[0]
                    provider_address = best_provider["address"]
                    
                    # Assign job
                    if gpu_manager.assign_job(provider_address, job.chain_job_id):
                        # Update job in database
                        job.state = "active"
                        job.provider_address = provider_address
                        db.commit()
                        
                        print(f"✅ Job #{job.chain_job_id} assigned to {provider_address}")
                        print(f"   GPU: {best_provider['specs'].get('gpu_name', 'Unknown')}")
                        print(f"   VRAM: {best_provider['specs'].get('vram_gb', 0)} GB")
                else:
                    print(f"⏳ No available provider for job #{job.chain_job_id}")
                    
        finally:
            db.close()
    
    def get_job_status(self, job_id: int) -> Optional[dict]:
        """Get current status of a job"""
        db = next(get_db())
        try:
            job = db.query(Job).filter(Job.chain_job_id == job_id).first()
            if job:
                return {
                    "job_id": job.chain_job_id,
                    "state": job.state,
                    "provider": job.provider_address,
                    "docker_uri": job.docker_uri,
                    "created_at": job.created_at.isoformat() if job.created_at else None
                }
            return None
        finally:
            db.close()
    
    def get_queue_status(self) -> dict:
        """Get current queue status"""
        db = next(get_db())
        try:
            pending = db.query(Job).filter(Job.state == "pending").count()
            active = db.query(Job).filter(Job.state == "active").count()
            completed = db.query(Job).filter(Job.state == "completed").count()
            
            providers = gpu_manager.get_all_providers()
            online_providers = sum(1 for p in providers if p["status"] == "online")
            
            return {
                "pending_jobs": pending,
                "active_jobs": active,
                "completed_jobs": completed,
                "total_providers": len(providers),
                "online_providers": online_providers,
                "available_slots": online_providers - active
            }
        finally:
            db.close()

# Global instance
scheduler = JobScheduler()

def run_scheduler():
    """Start the job scheduler"""
    scheduler.start()
