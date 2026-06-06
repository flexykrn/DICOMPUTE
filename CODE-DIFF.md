# NoCapCompute - Current Code vs Production Requirements

## Summary

| Aspect | Current (V1) | Required (V2) | Gap |
|--------|-------------|---------------|-----|
| **Database** | SQLite | PostgreSQL + asyncpg | 🔴 HIGH |
| **Event Indexer** | Basic thread | Async background task | 🔴 HIGH |
| **WebSocket** | Basic connection | Real-time streaming | 🟡 MEDIUM |
| **IPFS** | Local node only | Pinata/Web3.Storage | 🟡 MEDIUM |
| **Provider Script** | Python mock | Real Docker + events | 🔴 HIGH |
| **Receipt Storage** | Not indexed | Store in DB | 🔴 HIGH |

---

## Detailed Diff

### 1. DATABASE (🔴 HIGH)

**Current (`backend/database.py`):**
```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./dicompute.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
```

**Required (V2):**
```python
import asyncpg
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base
from sqlalchemy.ext.asyncio import async_sessionmaker

# PostgreSQL with async support
DATABASE_URL = "postgresql+asyncpg://user:pass@localhost/dicompute"
engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession)
Base = declarative_base()

# Alembic for migrations
# alembic init migrations
```

**Gap:** SQLite → PostgreSQL migration needed

---

### 2. EVENT INDEXER (🔴 HIGH)

**Current (`backend/indexer.py`):**
```python
class BlockchainIndexer:
    def start(self):
        # Minimal ABI for events
        # Basic thread-based polling
        pass
    
    def stop(self):
        pass
```

**Required (V2):**
```python
import asyncio
from web3 import Web3

class EventIndexer:
    async def start(self):
        # Async background task
        # Listen to ALL contract events
        # Store in PostgreSQL
        pass
    
    async def handle_event(self, event):
        # Process JobSubmitted, JobClaimed, 
        # HeartbeatReceived, JobCompleted, ReceiptMinted
        pass
```

**Gap:** Not listening to ReceiptMinted events

---

### 3. WEBSOCKET (🟡 MEDIUM)

**Current (`backend/main.py`):**
```python
@app.websocket("/ws/jobs")
async def websocket_jobs(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        await websocket.send_json({"status": "ok"})
```

**Required (V2):**
```python
@app.websocket("/ws/jobs/{job_id}")
async def websocket_job(websocket: WebSocket, job_id: str):
    await websocket.accept()
    # Subscribe to job updates
    # Stream heartbeats in real-time
    # Broadcast to all connected clients
    pass
```

**Gap:** No job-specific streaming

---

### 4. IPFS (🟡 MEDIUM)

**Current (`backend/ipfs_client.py`):**
```python
class IPFSClient:
    def __init__(self, api_url="http://localhost:5001/api/v0"):
        self.api_url = api_url
    
    def upload_file(self, file_path):
        # Local IPFS node only
        pass
```

**Required (V2):**
```python
class IPFSClient:
    def __init__(self):
        self.pinata_api_key = os.getenv("PINATA_API_KEY")
        self.pinata_secret = os.getenv("PINATA_SECRET")
        self.web3_storage_token = os.getenv("WEB3_STORAGE_TOKEN")
    
    async def upload_to_pinata(self, file_path):
        # Pinata cloud service
        pass
    
    async def upload_to_web3storage(self, file_path):
        # Web3.Storage
        pass
```

**Gap:** Only local IPFS, no cloud pinning

---

### 5. GPU PROVIDER SCRIPT (🔴 HIGH)

**Current (`scripts/gpu_provider.py`):**
```python
def run_provider():
    # Mock provider
    # Hardcoded CID
    # No event listening
    pass
```

**Required (V2):**
```python
async def run_provider():
    # Real Docker execution
    # Listen to JobSubmitted events
    # Auto-claim jobs
    # Real log capture
    # IPFS upload
    pass
```

**Gap:** Mock → Real implementation needed

---

### 6. RECEIPT STORAGE (🔴 HIGH)

**Current:**
```python
# ReceiptMinted event NOT handled in indexer
# No database table for receipts
```

**Required (V2):**
```python
class Receipt(Base):
    __tablename__ = "receipts"
    
    id = Column(Integer, primary_key=True)
    token_id = Column(Integer, unique=True)
    job_id = Column(Integer, ForeignKey("jobs.id"))
    owner_address = Column(String)
    metadata_uri = Column(String)
    minted_at = Column(DateTime)
```

**Gap:** Receipts not stored in database

---

## Critical Fixes Priority

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| 🔴 P0 | Receipt NFT indexing | 2h | HIGH |
| 🔴 P0 | GPU provider events | 3h | HIGH |
| 🔴 P0 | Real Docker logs | 2h | HIGH |
| 🟡 P1 | PostgreSQL migration | 4h | MEDIUM |
| 🟡 P1 | WebSocket streaming | 3h | MEDIUM |
| 🟢 P2 | IPFS cloud pinning | 2h | LOW |

---

## Recommendation

**For Hackathon (Tonight):**
1. Fix P0 issues (Receipt, Provider, Docker)
2. Demo will work end-to-end

**For V2 (Next Week):**
1. PostgreSQL migration
2. Full WebSocket
3. Cloud IPFS
4. Provider dashboard
