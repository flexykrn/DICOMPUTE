"""
Health check endpoint for Render deployment
Validates all critical services on startup
"""

import os
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any

router = APIRouter(prefix="/health", tags=["health"])

class HealthStatus(BaseModel):
    status: str
    version: str
    services: Dict[str, Any]
    timestamp: str

@router.get("", response_model=HealthStatus)
async def health_check():
    """Health check endpoint for Render and monitoring"""
    from datetime import datetime
    
    services = {
        "api": {"status": "ok", "message": "FastAPI running"},
        "database": {"status": "unknown", "message": "Not checked"},
        "blockchain": {"status": "unknown", "message": "Not checked"},
        "ipfs": {"status": "unknown", "message": "Not checked"},
    }
    
    # Check database
    try:
        from database import engine
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        services["database"] = {"status": "ok", "message": "SQLite connected"}
    except Exception as e:
        services["database"] = {"status": "error", "message": str(e)}
    
    # Check blockchain RPC
    try:
        rpc_url = os.getenv("RPC_URL", "https://erpc.apothem.network")
        response = requests.post(
            rpc_url,
            json={"jsonrpc": "2.0", "method": "eth_blockNumber", "params": [], "id": 1},
            timeout=5
        )
        if response.status_code == 200:
            block_num = int(response.json().get("result", "0x0"), 16)
            services["blockchain"] = {"status": "ok", "message": f"Block #{block_num}"}
        else:
            services["blockchain"] = {"status": "error", "message": f"HTTP {response.status_code}"}
    except Exception as e:
        services["blockchain"] = {"status": "error", "message": str(e)}
    
    # Check IPFS (Pinata)
    try:
        pinata_jwt = os.getenv("PINATA_JWT", "")
        if pinata_jwt:
            response = requests.get(
                "https://api.pinata.cloud/data/testAuthentication",
                headers={"Authorization": f"Bearer {pinata_jwt}"},
                timeout=5
            )
            if response.status_code == 200:
                services["ipfs"] = {"status": "ok", "message": "Pinata authenticated"}
            else:
                services["ipfs"] = {"status": "error", "message": f"HTTP {response.status_code}"}
        else:
            services["ipfs"] = {"status": "warning", "message": "No PINATA_JWT configured"}
    except Exception as e:
        services["ipfs"] = {"status": "error", "message": str(e)}
    
    # Overall status
    any_error = any(s["status"] == "error" for s in services.values())
    status = "degraded" if any_error else "healthy"
    
    return HealthStatus(
        status=status,
        version="1.0.0",
        services=services,
        timestamp=datetime.utcnow().isoformat() + "Z"
    )

@router.get("/ready")
async def readiness_check():
    """Kubernetes-style readiness probe"""
    try:
        from database import engine
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"ready": True}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Not ready: {str(e)}")
