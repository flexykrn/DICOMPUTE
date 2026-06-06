"""
Docker Container Manager for GPU Jobs
Handles container lifecycle for remote GPU execution
"""

import subprocess
import json
import time
from typing import Optional, Dict, Any
import threading

class DockerContainerManager:
    """Manages Docker containers for GPU jobs"""
    
    def __init__(self):
        self.active_containers: Dict[str, dict] = {}
        self.container_lock = threading.Lock()
    
    def run_container(self, job_id: int, docker_uri: str, gpu_id: str = "0") -> Optional[str]:
        """Start a Docker container with GPU access (falls back to CPU if no GPU)"""
        container_name = f"nocap-job-{job_id}"
        
        try:
            # Check if GPU is available
            gpu_available = self._check_gpu_available()
            
            # Build Docker run command
            cmd = ["docker", "run", "-d", "--name", container_name, "-e", f"JOB_ID={job_id}"]
            
            # Add GPU flag only if GPU is available
            if gpu_available:
                cmd.extend(["--gpus", f"\"device={gpu_id}\""])
            else:
                print(" No GPU found, running on CPU")
            
            cmd.append(docker_uri)
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                container_id = result.stdout.strip()
                
                with self.container_lock:
                    self.active_containers[container_name] = {
                        "container_id": container_id,
                        "job_id": job_id,
                        "docker_uri": docker_uri,
                        "gpu_id": gpu_id if gpu_available else None,
                        "started_at": time.time(),
                        "status": "running"
                    }
                
                print(f" Container started: {container_name}")
                print(f"   ID: {container_id[:12]}")
                print(f"   GPU: {gpu_id if gpu_available else 'CPU only'}")
                return container_id
            else:
                print(f" Container failed: {result.stderr}")
                return None
                
        except Exception as e:
            print(f" Docker error: {e}")
            return None
    
    def _check_gpu_available(self) -> bool:
        """Check if NVIDIA GPU is available"""
        try:
            result = subprocess.run(
                ["nvidia-smi"],
                capture_output=True,
                timeout=5
            )
            return result.returncode == 0
        except Exception as e:
            return False
    
    def stop_container(self, job_id: int) -> bool:
        """Stop a running container"""
        container_name = f"nocap-job-{job_id}"
        
        try:
            subprocess.run(
                ["docker", "stop", container_name],
                capture_output=True,
                timeout=30
            )
            
            with self.container_lock:
                if container_name in self.active_containers:
                    self.active_containers[container_name]["status"] = "stopped"
            
            print(f" Container stopped: {container_name}")
            return True
            
        except Exception as e:
            print(f" Stop error: {e}")
            return False
    
    def get_container_logs(self, job_id: int) -> str:
        """Get container logs"""
        container_name = f"nocap-job-{job_id}"
        
        try:
            result = subprocess.run(
                ["docker", "logs", container_name],
                capture_output=True,
                text=True,
                timeout=10
            )
            return result.stdout
        except Exception as e:
            return f"Error getting logs: {e}"
    
    def get_container_stats(self, job_id: int) -> Optional[dict]:
        """Get container resource usage"""
        container_name = f"nocap-job-{job_id}"
        
        try:
            result = subprocess.run(
                ["docker", "stats", container_name, "--no-stream", "--format", "json"],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                return json.loads(result.stdout)
            return None
            
        except Exception as e:
            print(f" Stats error: {e}")
            return None
    
    def get_gpu_usage(self) -> list:
        """Get GPU usage statistics"""
        try:
            result = subprocess.run(
                ["nvidia-smi", "--query-gpu=index,name,utilization.gpu,memory.used", "--format=csv,noheader,nounits"],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            gpus = []
            for line in result.stdout.strip().split('\n'):
                parts = [p.strip() for p in line.split(',')]
                if len(parts) >= 4:
                    gpus.append({
                        "index": parts[0],
                        "name": parts[1],
                        "gpu_percent": float(parts[2]),
                        "vram_mb": float(parts[3])
                    })
            
            return gpus
            
        except Exception as e:
            print(f" GPU stats error: {e}")
            return []
    
    def cleanup_finished_containers(self):
        """Remove finished containers from tracking"""
        with self.container_lock:
            finished = [
                name for name, info in self.active_containers.items()
                if info["status"] == "stopped"
            ]
            for name in finished:
                del self.active_containers[name]

# Global instance
docker_manager = DockerContainerManager()
