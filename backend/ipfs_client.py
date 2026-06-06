"""
IPFS Client using Pinata for DICOMPUTE
Handles file upload/download via Pinata IPFS service
"""

import requests
import json
import os
from typing import Optional, Dict, Any

# Pinata configuration from environment
PINATA_API_KEY = os.getenv("PINATA_API_KEY", "")
PINATA_API_SECRET = os.getenv("PINATA_API_SECRET", "")
PINATA_JWT = os.getenv("PINATA_JWT", "")

PINATA_UPLOAD_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS"
PINATA_JSON_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS"
PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs"

class IPFSClient:
    def __init__(self):
        self.headers = {
            "Authorization": f"Bearer {PINATA_JWT}"
        } if PINATA_JWT else {}
    
    def upload_file(self, file_path: str) -> Optional[str]:
        """Upload file to IPFS via Pinata, return CID"""
        if not self.headers:
            print("Warning: No Pinata JWT configured, falling back to demo CID")
            return "QmDemoUpload"
        
        try:
            with open(file_path, 'rb') as f:
                files = {'file': f}
                response = requests.post(
                    PINATA_UPLOAD_URL,
                    files=files,
                    headers=self.headers
                )
                if response.status_code == 200:
                    result = response.json()
                    return result.get('IpfsHash')
                else:
                    print(f"Pinata upload error: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"IPFS upload error: {e}")
        return None
    
    def upload_json(self, data: Dict[str, Any]) -> Optional[str]:
        """Upload JSON to IPFS via Pinata, return CID"""
        if not self.headers:
            print("Warning: No Pinata JWT configured")
            return None
        
        try:
            response = requests.post(
                PINATA_JSON_URL,
                json={
                    "pinataContent": data,
                    "pinataMetadata": {"name": "dicompute-data.json"}
                },
                headers=self.headers
            )
            if response.status_code == 200:
                result = response.json()
                return result.get('IpfsHash')
        except Exception as e:
            print(f"IPFS upload error: {e}")
        return None
    
    def download_file(self, cid: str, output_path: str) -> bool:
        """Download file from Pinata Gateway by CID"""
        try:
            response = requests.get(
                f"{PINATA_GATEWAY}/{cid}",
                stream=True,
                timeout=30
            )
            if response.status_code == 200:
                with open(output_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                return True
            else:
                print(f"Pinata download error: {response.status_code}")
        except Exception as e:
            print(f"IPFS download error: {e}")
        return False
    
    def pin_cid(self, cid: str) -> bool:
        """CID is already pinned by Pinata on upload"""
        return True
    
    def unpin_cid(self, cid: str) -> bool:
        """Unpin CID via Pinata"""
        if not self.headers:
            return False
        try:
            response = requests.delete(
                f"https://api.pinata.cloud/pinning/unpin/{cid}",
                headers=self.headers
            )
            return response.status_code == 200
        except Exception as e:
            print(f"IPFS unpin error: {e}")
        return False

# Global instance
ipfs_client = IPFSClient()
