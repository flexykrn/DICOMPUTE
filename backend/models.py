from sqlalchemy import create_engine, Column, Integer, String, BigInteger, Text, Boolean, DateTime, LargeBinary, Numeric, ForeignKey, Index
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True)
    chain_job_id = Column(BigInteger, unique=True, nullable=False, index=True)
    user_address = Column(String(42), nullable=False, index=True)
    provider_address = Column(String(42), ForeignKey("providers.address"), index=True)
    docker_uri = Column(Text, nullable=False)
    cpu_milli = Column(Integer, nullable=False)
    ram_mib = Column(Integer, nullable=False)
    vram_mib = Column(Integer, nullable=False)
    duration_blocks = Column(Integer, nullable=False)
    max_price_per_block = Column(Numeric(78, 0), nullable=False)
    deposit = Column(Numeric(78, 0), nullable=False)
    state = Column(String(20), nullable=False, default="pending", index=True)
    started_at_block = Column(BigInteger)
    completed_at_block = Column(BigInteger)
    last_heartbeat_block = Column(BigInteger)
    result_cid = Column(Text)
    instruction_count = Column(BigInteger)
    logs = Column(Text, nullable=True)  # Container logs/output
    input_data_cid = Column(Text, nullable=True)  # IPFS CID for input dataset
    expected_output = Column(Text, nullable=True)  # Expected output format/pattern
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    heartbeats = relationship("Heartbeat", back_populates="job", lazy="selectin")
    receipt = relationship("Receipt", back_populates="job", uselist=False)
    provider = relationship("Provider", back_populates="jobs")

class Heartbeat(Base):
    __tablename__ = "heartbeats"
    
    id = Column(Integer, primary_key=True)
    job_id = Column(BigInteger, ForeignKey("jobs.chain_job_id"), nullable=False, index=True)
    block_number = Column(BigInteger, nullable=False)
    uptime_seconds = Column(BigInteger, nullable=False)
    cpu_percent = Column(Integer, nullable=False)
    ram_percent = Column(Integer, nullable=False)
    vram_percent = Column(Integer, nullable=False)
    signature = Column(LargeBinary, nullable=False)
    digest = Column(LargeBinary, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    job = relationship("Job", back_populates="heartbeats")

class Provider(Base):
    __tablename__ = "providers"
    
    address = Column(String(42), primary_key=True)
    metadata_uri = Column(Text)
    stake = Column(Numeric(78, 0), nullable=False)
    is_registered = Column(Boolean, default=True)
    is_slashed = Column(Boolean, default=False)
    total_jobs_completed = Column(Integer, default=0)
    total_jobs_failed = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    jobs = relationship("Job", back_populates="provider")

class Receipt(Base):
    __tablename__ = "receipts"
    
    id = Column(Integer, primary_key=True)
    token_id = Column(BigInteger, unique=True, nullable=False)
    job_id = Column(BigInteger, ForeignKey("jobs.chain_job_id"), unique=True)
    user_address = Column(String(42), nullable=False, index=True)
    provider_address = Column(String(42), nullable=False)
    result_cid = Column(Text)
    instruction_count = Column(BigInteger)
    cost = Column(Numeric(78, 0))
    minted_at = Column(DateTime, default=datetime.utcnow)
    
    job = relationship("Job", back_populates="receipt")
