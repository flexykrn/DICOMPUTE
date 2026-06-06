"""
IPFS Client for NoCapCompute
Handles file upload/download to IPFS (local + Pinata cloud)
"""

import requests
import json
import os
from typing import Optional, Dict, Any

IPFS_API_URL = "http://localhost:5001/api/v0"
PINATA_API_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS"

class IPFSClient:
    def __init__(self, api_url: str = IPFS_API_URL):
        self.api_url = api_url
        self.pinata_api_key = os.getenv("PINATA_API_KEY")
        self.pinata_secret = os.getenv("PINATA_SECRET")
        self.use_pinata = bool(self.pinata_api_key and self.pinata_secret)
    
    def upload_file(self, file_path: str) -> Optional[str]:
        """Upload file to IPFS, return CID"""
        # Try Pinata first if configured
        if self.use_pinata:
            cid = self._upload_to_pinata(file_path)
            if cid:
                return cid
        
        # Fallback to local IPFS node
        return self._upload_to_local(file_path)
    
    def _upload_to_pinata(self, file_path: str) -> Optional[str]:
        """Upload to Pinata cloud"""
        try:
            headers = {
                "pinata_api_key": self.pinata_api_key,
                "pinata_secret_api_key": self.pinata_secret
            }
            
            with open(file_path, 'rb') as f:
                response = requests.post(
                    PINATA_API_URL,
                    files={'file': f},
                    headers=headers,
                    timeout=60
                )
                if response.status_code == 200:
                    result = response.json()
                    cid = result.get('IpfsHash')
                    print(f"✅ Uploaded to Pinata: {cid}")
                    return cid
        except Exception as e:
            print(f"Pinata upload error: {e}")
        return None
    
    def _upload_to_local(self, file_path: str) -> Optional[str]:
        """Upload to local IPFS node"""
        try:
            with open(file_path, 'rb') as f:
                response = requests.post(
                    f"{self.api_url}/add",
                    files={'file': f}
                )
                if response.status_code == 200:
                    result = response.json()
                    return result.get('Hash')
        except Exception as e:
            print(f"IPFS upload error: {e}")
        return None
    
    def upload_json(self, data: Dict[str, Any]) -> Optional[str]:
        """Upload JSON to IPFS, return CID"""
        try:
            response = requests.post(
                f"{self.api_url}/add",
                files={'file': ('data.json', json.dumps(data))}
            )
            if response.status_code == 200:
                result = response.json()
                return result.get('Hash')
        except Exception as e:
            print(f"IPFS upload error: {e}")
        return None
    
    def download_file(self, cid: str, output_path: str) -> bool:
        """Download file from IPFS by CID"""
        try:
            response = requests.post(
                f"{self.api_url}/cat?arg={cid}",
                stream=True
            )
            if response.status_code == 200:
                with open(output_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                return True
        except Exception as e:
            print(f"IPFS download error: {e}")
        return False
    
    def pin_cid(self, cid: str) -> bool:
        """Pin CID to keep it persistent"""
        try:
            response = requests.post(
                f"{self.api_url}/pin/add?arg={cid}"
            )
            return response.status_code == 200
        except Exception as e:
            print(f"IPFS pin error: {e}")
        return False
    
    def unpin_cid(self, cid: str) -> bool:
        """Unpin CID"""
        try:
            response = requests.post(
                f"{self.api_url}/pin/rm?arg={cid}"
            )
            return response.status_code == 200
        except Exception as e:
            print(f"IPFS unpin error: {e}")
        return False

# Global instance
ipfs_client = IPFSClient()