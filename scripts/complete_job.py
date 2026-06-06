import os
import requests
import sys

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8001")

def complete_job(job_id: int):
    print(f"Completing job {job_id}...")
    
    # Get job details
    job = requests.get(f"{BACKEND_URL}/api/jobs/{job_id}").json()
    print(f"Job state: {job['state']}")
    
    # Get stats
    stats = requests.get(f"{BACKEND_URL}/api/stats").json()
    print(f"Total jobs: {stats.get('total_jobs', 0)}")
    
    print("✅ Job completion test done!")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        complete_job(int(sys.argv[1]))
    else:
        print("Usage: python complete_job.py <job_id>")
