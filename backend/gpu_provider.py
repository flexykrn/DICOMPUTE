"""
GPU Provider Management System
Handles GPU registration, resource tracking, and job assignment
"""

import json
import time
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import Provider, Job
from database import get_db
import threading

class GPUProviderManager:
    """Manages GPU providers and their resources"""
    
    def __init__(self):
        self.active_providers: Dict[str, dict] = {}
        self.provider_lock = threading.Lock()
        self.heartbeat_timeout = 30  # seconds
    
    def register_provider(self, address: str, specs: dict) -> bool:
        """Register a new GPU provider"""
        with self.provider_lock:
            self.active_providers[address] = {
                "address": address,
                "specs": specs,
                "status": "online",
                "last_heartbeat": time.time(),
                "current_job": None,
                "gpu_usage": 0.0,
                "cpu_usage": 0.0,
                "ram_usage": 0.0,
                "vram_usage": 0.0,
                "total_jobs_completed": 0,
                "total_jobs_failed": 0
            }
        
        # Update database
        db = next(get_db())
        try:
            provider = db.query(Provider).filter(Provider.address == address).first()
            if not provider:
                provider = Provider(
                    address=address,
                    metadata_uri=json.dumps(specs),
                    is_registered=True
                )
                db.add(provider)
                db.commit()
            
            print(f"✅ GPU Provider registered: {address}")
            print(f"   Specs: {specs}")
            return True
        except Exception as e:
            print(f"❌ Registration error: {e}")
            return False
        finally:
            db.close()
    
    def update_heartbeat(self, address: str, metrics: dict) -> bool:
        """Update provider heartbeat with current metrics"""
        with self.provider_lock:
            if address not in self.active_providers:
                return False
            
            provider = self.active_providers[address]
            provider["last_heartbeat"] = time.time()
            provider["gpu_usage"] = metrics.get("gpu_percent", 0)
            provider["cpu_usage"] = metrics.get("cpu_percent", 0)
            provider["ram_usage"] = metrics.get("ram_percent", 0)
            provider["vram_usage"] = metrics.get("vram_percent", 0)
            provider["status"] = "online"
            
            return True
    
    def get_available_providers(self, required_specs: dict) -> List[dict]:
        """Find providers that match job requirements"""
        available = []
        current_time = time.time()
        
        with self.provider_lock:
            for address, provider in self.active_providers.items():
                # Check if provider is online
                if current_time - provider["last_heartbeat"] > self.heartbeat_timeout:
                    provider["status"] = "offline"
                    continue
                
                # Check if provider is busy
                if provider["current_job"] is not None:
                    continue
                
                # Check specs
                specs = provider["specs"]
                if (specs.get("vram_gb", 0) >= required_specs.get("min_vram_gb", 0) and
                    specs.get("cpu_cores", 0) >= required_specs.get("min_cpu_cores", 0) and
                    specs.get("ram_gb", 0) >= required_specs.get("min_ram_gb", 0)):
                    
                    available.append(provider)
        
        # Sort by least usage (best performance)
        available.sort(key=lambda x: x["gpu_usage"])
        return available
    
    def assign_job(self, provider_address: str, job_id: int) -> bool:
        """Assign a job to a provider"""
        with self.provider_lock:
            if provider_address not in self.active_providers:
                return False
            
            provider = self.active_providers[provider_address]
            if provider["current_job"] is not None:
                return False
            
            provider["current_job"] = job_id
            return True
    
    def release_job(self, provider_address: str, job_id: int, success: bool = True):
        """Release provider after job completion"""
        with self.provider_lock:
            if provider_address in self.active_providers:
                provider = self.active_providers[provider_address]
                provider["current_job"] = None
                
                if success:
                    provider["total_jobs_completed"] += 1
                else:
                    provider["total_jobs_failed"] += 1
    
    def get_provider_status(self, address: str) -> Optional[dict]:
        """Get current status of a provider"""
        with self.provider_lock:
            return self.active_providers.get(address)
    
    def get_all_providers(self) -> List[dict]:
        """Get all registered providers"""
        with self.provider_lock:
            return list(self.active_providers.values())
    
    def cleanup_offline_providers(self):
        """Remove providers that haven't sent heartbeat"""
        current_time = time.time()
        with self.provider_lock:
            offline = [
                addr for addr, p in self.active_providers.items()
                if current_time - p["last_heartbeat"] > self.heartbeat_timeout * 2
            ]
            for addr in offline:
                del self.active_providers[addr]
                print(f"🧹 Removed offline provider: {addr}")

# Global instance
gpu_manager = GPUProviderManager()
