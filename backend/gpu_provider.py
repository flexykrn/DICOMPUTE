"""
GPU Provider Management System
Handles GPU registration, resource tracking, and job assignment
PERSISTENT - Stores data in database, survives restarts
"""

import json
import time
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import Provider, Job
from database import SessionLocal
import threading

class GPUProviderManager:
    """Manages GPU providers and their resources - PERSISTENT"""
    
    def __init__(self):
        self.provider_lock = threading.Lock()
        self.heartbeat_timeout = 300  # 5 minutes
        self._load_providers_from_db()
    
    def _get_db(self):
        """Get database session"""
        return SessionLocal()
    
    def _load_providers_from_db(self):
        """Load all registered providers from database on startup"""
        db = self._get_db()
        try:
            providers = db.query(Provider).filter(Provider.is_registered == True).all()
            print(f" Loaded {len(providers)} providers from database")
            for provider in providers:
                print(f"   - {provider.address}")
        except Exception as e:
            print(f" Could not load providers from DB: {e}")
        finally:
            db.close()
    
    def register_provider(self, address: str, specs: dict) -> bool:
        """Register a new GPU provider - PERSISTENT"""
        db = self._get_db()
        try:
            provider = db.query(Provider).filter(Provider.address == address).first()
            if not provider:
                provider = Provider(
                    address=address,
                    metadata_uri=json.dumps(specs),
                    stake="0",
                    is_registered=True
                )
                db.add(provider)
            else:
                provider.metadata_uri = json.dumps(specs)
                provider.is_registered = True
            
            db.commit()
            print(f" GPU Provider registered: {address}")
            print(f"   Specs: {specs}")
            return True
        except Exception as e:
            print(f" Registration error: {e}")
            db.rollback()
            return False
        finally:
            db.close()
    
    def update_heartbeat(self, address: str, metrics: dict) -> bool:
        """Update provider heartbeat - checks database"""
        db = self._get_db()
        try:
            provider = db.query(Provider).filter(
                Provider.address == address,
                Provider.is_registered == True
            ).first()
            
            if not provider:
                return False
            
            # Store heartbeat in metadata
            metadata = json.loads(provider.metadata_uri or '{}')
            metadata['last_heartbeat'] = time.time()
            metadata['gpu_usage'] = metrics.get('gpu_percent', 0)
            metadata['cpu_usage'] = metrics.get('cpu_percent', 0)
            metadata['ram_usage'] = metrics.get('ram_percent', 0)
            metadata['vram_usage'] = metrics.get('vram_percent', 0)
            metadata['status'] = 'online'
            
            provider.metadata_uri = json.dumps(metadata)
            db.commit()
            return True
        except Exception as e:
            print(f" Heartbeat error: {e}")
            return False
        finally:
            db.close()
    
    def get_available_providers(self, required_specs: dict) -> List[dict]:
        """Find providers that match job requirements - from database"""
        db = self._get_db()
        try:
            providers = db.query(Provider).filter(
                Provider.is_registered == True
            ).all()
            
            available = []
            current_time = time.time()
            
            for provider in providers:
                metadata = json.loads(provider.metadata_uri or '{}')
                specs = {k: v for k, v in metadata.items() if k not in ['last_heartbeat', 'gpu_usage', 'cpu_usage', 'ram_usage', 'vram_usage', 'status', 'current_job']}
                
                # Check heartbeat
                last_heartbeat = metadata.get('last_heartbeat', 0)
                if current_time - last_heartbeat > self.heartbeat_timeout:
                    continue
                
                # Check if busy
                current_job = metadata.get('current_job')
                if current_job is not None:
                    continue
                
                # Check specs
                if (specs.get('vram_gb', 0) >= required_specs.get('min_vram_gb', 0) and
                    specs.get('cpu_cores', 0) >= required_specs.get('min_cpu_cores', 0) and
                    specs.get('ram_gb', 0) >= required_specs.get('min_ram_gb', 0)):
                    
                    available.append({
                        'address': provider.address,
                        'specs': specs,
                        'status': 'online',
                        'last_heartbeat': last_heartbeat,
                        'gpu_usage': metadata.get('gpu_usage', 0),
                        'cpu_usage': metadata.get('cpu_usage', 0),
                        'ram_usage': metadata.get('ram_usage', 0),
                        'vram_usage': metadata.get('vram_usage', 0)
                    })
            
            # Sort by least GPU usage
            available.sort(key=lambda x: x['gpu_usage'])
            return available
        finally:
            db.close()
    
    def assign_job(self, provider_address: str, job_id: int) -> bool:
        """Assign a job to a provider - PERSISTENT"""
        db = self._get_db()
        try:
            provider = db.query(Provider).filter(
                Provider.address == provider_address
            ).first()
            
            if not provider:
                return False
            
            metadata = json.loads(provider.metadata_uri or '{}')
            if metadata.get('current_job') is not None:
                return False
            
            metadata['current_job'] = job_id
            provider.metadata_uri = json.dumps(metadata)
            db.commit()
            return True
        except Exception as e:
            print(f" Assign job error: {e}")
            return False
        finally:
            db.close()
    
    def release_job(self, provider_address: str, job_id: int, success: bool = True):
        """Release provider after job completion - PERSISTENT"""
        db = self._get_db()
        try:
            provider = db.query(Provider).filter(
                Provider.address == provider_address
            ).first()
            
            if provider:
                metadata = json.loads(provider.metadata_uri or '{}')
                metadata['current_job'] = None
                
                if success:
                    provider.total_jobs_completed += 1
                else:
                    provider.total_jobs_failed += 1
                
                provider.metadata_uri = json.dumps(metadata)
                db.commit()
        except Exception as e:
            print(f" Release job error: {e}")
        finally:
            db.close()
    
    def get_provider_status(self, address: str) -> Optional[dict]:
        """Get current status of a provider - from database"""
        db = self._get_db()
        try:
            provider = db.query(Provider).filter(
                Provider.address == address
            ).first()
            
            if not provider:
                return None
            
            metadata = json.loads(provider.metadata_uri or '{}')
            return {
                'address': provider.address,
                'specs': {k: v for k, v in metadata.items() if k not in ['last_heartbeat', 'gpu_usage', 'cpu_usage', 'ram_usage', 'vram_usage', 'status', 'current_job']},
                'status': metadata.get('status', 'unknown'),
                'last_heartbeat': metadata.get('last_heartbeat'),
                'current_job': metadata.get('current_job'),
                'gpu_usage': metadata.get('gpu_usage', 0),
                'cpu_usage': metadata.get('cpu_usage', 0),
                'ram_usage': metadata.get('ram_usage', 0),
                'vram_usage': metadata.get('vram_usage', 0),
                'total_jobs_completed': provider.total_jobs_completed,
                'total_jobs_failed': provider.total_jobs_failed
            }
        finally:
            db.close()
    
    def get_all_providers(self) -> List[dict]:
        """Get all registered providers - from database"""
        db = self._get_db()
        try:
            providers = db.query(Provider).filter(
                Provider.is_registered == True
            ).all()
            
            result = []
            current_time = time.time()
            
            for provider in providers:
                metadata = json.loads(provider.metadata_uri or '{}')
                last_heartbeat = metadata.get('last_heartbeat', 0)
                
                # Determine status
                if current_time - last_heartbeat > self.heartbeat_timeout:
                    status = 'offline'
                else:
                    status = metadata.get('status', 'online')
                
                specs = {k: v for k, v in metadata.items() if k not in ['last_heartbeat', 'gpu_usage', 'cpu_usage', 'ram_usage', 'vram_usage', 'status', 'current_job']}
                
                result.append({
                    'address': provider.address,
                    'specs': specs,
                    'status': status,
                    'last_heartbeat': last_heartbeat,
                    'current_job': metadata.get('current_job'),
                    'gpu_usage': metadata.get('gpu_usage', 0),
                    'cpu_usage': metadata.get('cpu_usage', 0),
                    'ram_usage': metadata.get('ram_usage', 0),
                    'vram_usage': metadata.get('vram_usage', 0),
                    'total_jobs_completed': provider.total_jobs_completed,
                    'total_jobs_failed': provider.total_jobs_failed
                })
            
            return result
        finally:
            db.close()
    
    def cleanup_offline_providers(self):
        """Mark offline providers - from database"""
        db = self._get_db()
        try:
            providers = db.query(Provider).filter(
                Provider.is_registered == True
            ).all()
            
            current_time = time.time()
            for provider in providers:
                metadata = json.loads(provider.metadata_uri or '{}')
                last_heartbeat = metadata.get('last_heartbeat', 0)
                
                if current_time - last_heartbeat > self.heartbeat_timeout * 2:
                    metadata['status'] = 'offline'
                    provider.metadata_uri = json.dumps(metadata)
                    print(f" Marked offline: {provider.address}")
            
            db.commit()
        except Exception as e:
            print(f" Cleanup error: {e}")
        finally:
            db.close()

# Global instance
gpu_manager = GPUProviderManager()
