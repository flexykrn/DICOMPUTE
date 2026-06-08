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
    
    # Check blockchain RPC (use longer timeout, downgrade errors to warning)
    try:
        rpc_url = os.getenv("RPC_URL", "https://erpc.apothem.network")
        response = requests.post(
            rpc_url,
            json={"jsonrpc": "2.0", "method": "eth_blockNumber", "params": [], "id": 1},
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        if response.status_code == 200:
            result = response.json()
            if "result" in result:
                block_num = int(result["result"], 16)
                services["blockchain"] = {"status": "ok", "message": f"Block #{block_num}"}
            else:
                services["blockchain"] = {"status": "warning", "message": "Unexpected RPC response"}
        else:
            services["blockchain"] = {"status": "warning", "message": f"HTTP {response.status_code}"}
    except Exception as e:
        services["blockchain"] = {"status": "warning", "message": str(e)}
    
    # Check IPFS (Pinata) - downgrade to warning if not configured
    try:
        pinata_jwt = os.getenv("PINATA_JWT", "")
        if pinata_jwt:
            response = requests.get(
                "https://api.pinata.cloud/data/testAuthentication",
                headers={"Authorization": f"Bearer {pinata_jwt}"},
                timeout=10
            )
            if response.status_code == 200:
                services["ipfs"] = {"status": "ok", "message": "Pinata authenticated"}
            else:
                services["ipfs"] = {"status": "warning", "message": f"HTTP {response.status_code}"}
        else:
            services["ipfs"] = {"status": "warning", "message": "No PINATA_JWT configured"}
    except Exception as e:
        services["ipfs"] = {"status": "warning", "message": str(e)}
    
    # Overall status: only mark degraded if database or API has errors
    critical_errors = any(
        s["status"] == "error" 
        for name, s in services.items() 
        if name in ("api", "database")
    )
    status = "healthy" if not critical_errors else "degraded"
    
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
