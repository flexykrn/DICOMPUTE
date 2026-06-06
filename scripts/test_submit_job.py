import os
import requests

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8001")

def test_flow():
    print("Testing NoCapCompute API...")
    
    # Test stats
    stats = requests.get(f"{BACKEND_URL}/api/stats").json()
    print(f"Stats: {stats}")
    
    # Test pending jobs
    pending = requests.get(f"{BACKEND_URL}/api/jobs/pending").json()
    print(f"Pending jobs: {len(pending)}")
    
    print("✅ API test complete!")

if __name__ == "__main__":
    test_flow()
