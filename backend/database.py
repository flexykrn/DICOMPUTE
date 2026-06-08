from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from models import Base
import os

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dicompute.db")

if DATABASE_URL.startswith("postgresql"):
    # PostgreSQL with async support (for V2)
    try:
        from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
        engine = create_async_engine(DATABASE_URL)
        SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        print("Connected to PostgreSQL")
    except ImportError:
        print("asyncpg not installed, falling back to SQLite")
        DATABASE_URL = "sqlite:///./dicompute.db"
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
else:
    # SQLite (V1 default)
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    print("Using SQLite (set DATABASE_URL for PostgreSQL)")

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
