from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from database import get_db, init_db
from models import Job, Heartbeat, Provider, Receipt
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="DICOMPUTE API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    init_db()

# Schemas
class HeartbeatCreate(BaseModel):
    block_number: int
    uptime_seconds: int
    cpu_percent: int
    ram_percent: int
    vram_percent: int
    signature: str
    digest: str

class HeartbeatResponse(BaseModel):
    id: int
    job_id: int
    block_number: int
    uptime_seconds: int
    cpu_percent: int
    ram_percent: int
    vram_percent: int
    timestamp: str

class JobResponse(BaseModel):
    id: int
    chain_job_id: int
    user_address: str
    provider_address: Optional[str]
    docker_uri: str
    cpu_milli: int
    ram_mib: int
    vram_mib: int
    duration_blocks: int
    max_price_per_block: str
    deposit: str
    state: str
    started_at_block: Optional[int]
    completed_at_block: Optional[int]
    last_heartbeat_block: Optional[int]
    result_cid: Optional[str]
    instruction_count: Optional[int]
    created_at: str

class ProviderResponse(BaseModel):
    address: str
    metadata_uri: Optional[str]
    stake: str
    is_registered: bool
    is_slashed: bool
    total_jobs_completed: int
    total_jobs_failed: int

class ReceiptResponse(BaseModel):
    id: int
    token_id: int
    job_id: int
    user_address: str
    provider_address: str
    result_cid: Optional[str]
    instruction_count: Optional[int]
    cost: Optional[str]
    minted_at: str

class StatsResponse(BaseModel):
    total_jobs: int
    active_jobs: int
    completed_jobs: int
    slashed_jobs: int
    total_providers: int
    active_providers: int
    total_receipts: int

# Jobs API
@app.post("/api/jobs/{job_id}/heartbeat")
async def store_heartbeat(job_id: int, data: HeartbeatCreate, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.chain_job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    heartbeat = Heartbeat(
        job_id=job_id,
        block_number=data.block_number,
        uptime_seconds=data.uptime_seconds,
        cpu_percent=data.cpu_percent,
        ram_percent=data.ram_percent,
        vram_percent=data.vram_percent,
        signature=bytes.fromhex(data.signature.replace("0x", "")),
        digest=bytes.fromhex(data.digest.replace("0x", ""))
    )
    db.add(heartbeat)
    job.last_heartbeat_block = data.block_number
    db.commit()
    return {"ok": True}

@app.get("/api/jobs/{job_id}/heartbeats", response_model=List[HeartbeatResponse])
async def get_heartbeats(job_id: int, db: Session = Depends(get_db)):
    heartbeats = db.query(Heartbeat).filter(Heartbeat.job_id == job_id).order_by(Heartbeat.timestamp).all()
    return [
        {
            "id": hb.id,
            "job_id": hb.job_id,
            "block_number": hb.block_number,
            "uptime_seconds": hb.uptime_seconds,
            "cpu_percent": hb.cpu_percent,
            "ram_percent": hb.ram_percent,
            "vram_percent": hb.vram_percent,
            "timestamp": hb.timestamp.isoformat()
        }
        for hb in heartbeats
    ]

@app.get("/api/jobs", response_model=List[JobResponse])
async def list_jobs(
    state: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Job)
    if state:
        query = query.filter(Job.state == state)
    
    jobs = query.order_by(Job.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return [
        {
            "id": job.id,
            "chain_job_id": job.chain_job_id,
            "user_address": job.user_address,
            "provider_address": job.provider_address,
            "docker_uri": job.docker_uri,
            "cpu_milli": job.cpu_milli,
            "ram_mib": job.ram_mib,
            "vram_mib": job.vram_mib,
            "duration_blocks": job.duration_blocks,
            "max_price_per_block": str(job.max_price_per_block),
            "deposit": str(job.deposit),
            "state": job.state,
            "started_at_block": job.started_at_block,
            "completed_at_block": job.completed_at_block,
            "last_heartbeat_block": job.last_heartbeat_block,
            "result_cid": job.result_cid,
            "instruction_count": job.instruction_count,
            "created_at": job.created_at.isoformat()
        }
        for job in jobs
    ]

@app.get("/api/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.chain_job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {
        "id": job.id,
        "chain_job_id": job.chain_job_id,
        "user_address": job.user_address,
        "provider_address": job.provider_address,
        "docker_uri": job.docker_uri,
        "cpu_milli": job.cpu_milli,
        "ram_mib": job.ram_mib,
        "vram_mib": job.vram_mib,
        "duration_blocks": job.duration_blocks,
        "max_price_per_block": str(job.max_price_per_block),
        "deposit": str(job.deposit),
        "state": job.state,
        "started_at_block": job.started_at_block,
        "completed_at_block": job.completed_at_block,
        "last_heartbeat_block": job.last_heartbeat_block,
        "result_cid": job.result_cid,
        "instruction_count": job.instruction_count,
        "created_at": job.created_at.isoformat()
    }

# Providers API
@app.get("/api/providers", response_model=List[ProviderResponse])
async def list_providers(db: Session = Depends(get_db)):
    providers = db.query(Provider).all()
    return [
        {
            "address": p.address,
            "metadata_uri": p.metadata_uri,
            "stake": str(p.stake),
            "is_registered": p.is_registered,
            "is_slashed": p.is_slashed,
            "total_jobs_completed": p.total_jobs_completed,
            "total_jobs_failed": p.total_jobs_failed
        }
        for p in providers
    ]

@app.get("/api/providers/{address}", response_model=ProviderResponse)
async def get_provider(address: str, db: Session = Depends(get_db)):
    provider = db.query(Provider).filter(Provider.address == address).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    return {
        "address": provider.address,
        "metadata_uri": provider.metadata_uri,
        "stake": str(provider.stake),
        "is_registered": provider.is_registered,
        "is_slashed": provider.is_slashed,
        "total_jobs_completed": provider.total_jobs_completed,
        "total_jobs_failed": provider.total_jobs_failed
    }

# Receipts API
@app.get("/api/receipts", response_model=List[ReceiptResponse])
async def list_receipts(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    receipts = db.query(Receipt).order_by(Receipt.minted_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return [
        {
            "id": r.id,
            "token_id": r.token_id,
            "job_id": r.job_id,
            "user_address": r.user_address,
            "provider_address": r.provider_address,
            "result_cid": r.result_cid,
            "instruction_count": r.instruction_count,
            "cost": str(r.cost) if r.cost else None,
            "minted_at": r.minted_at.isoformat()
        }
        for r in receipts
    ]

@app.get("/api/receipts/{token_id}", response_model=ReceiptResponse)
async def get_receipt(token_id: int, db: Session = Depends(get_db)):
    receipt = db.query(Receipt).filter(Receipt.token_id == token_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    return {
        "id": receipt.id,
        "token_id": receipt.token_id,
        "job_id": receipt.job_id,
        "user_address": receipt.user_address,
        "provider_address": receipt.provider_address,
        "result_cid": receipt.result_cid,
        "instruction_count": receipt.instruction_count,
        "cost": str(receipt.cost) if receipt.cost else None,
        "minted_at": receipt.minted_at.isoformat()
    }

# Stats API
@app.get("/api/stats", response_model=StatsResponse)
async def get_stats(db: Session = Depends(get_db)):
    total_jobs = db.query(Job).count()
    active_jobs = db.query(Job).filter(Job.state == "active").count()
    completed_jobs = db.query(Job).filter(Job.state == "completed").count()
    slashed_jobs = db.query(Job).filter(Job.state == "slashed").count()
    total_providers = db.query(Provider).count()
    active_providers = db.query(Provider).filter(Provider.is_registered == True, Provider.is_slashed == False).count()
    total_receipts = db.query(Receipt).count()
    
    return {
        "total_jobs": total_jobs,
        "active_jobs": active_jobs,
        "completed_jobs": completed_jobs,
        "slashed_jobs": slashed_jobs,
        "total_providers": total_providers,
        "active_providers": active_providers,
        "total_receipts": total_receipts
    }

# Health check
@app.get("/health")
async def health():
    return {"status": "ok", "service": "dicompute-api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
