"""
database.py - Database connection and session management.
Uses SQLite for local development; swap DATABASE_URL for PostgreSQL in production.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.pool import StaticPool
import os
import threading
from dotenv import load_dotenv

load_dotenv()

# Resolve DB path relative to this file's directory so it always points to
# backend/klh.db regardless of which directory uvicorn is started from.
_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # = backend/
_DEFAULT_DB = f"sqlite:///{os.path.join(_BASE_DIR, 'klh.db')}"
DATABASE_URL = os.getenv("DATABASE_URL", _DEFAULT_DB)

# SQLite-specific kwargs for thread safety in dev
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
poolclass_kwargs = {"poolclass": StaticPool} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    **poolclass_kwargs,
    echo=False,  # Set True to log SQL queries during development
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


def get_db():
    """
    FastAPI dependency: yields a DB session for the default (global) database.
    Usage: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Utility to get a session for a specific HR ID
# Engine cache: avoids creating a new engine (and opening new connections)
# on every request for the same HR ID.
_hr_engine_cache: dict = {}
_hr_engine_lock = threading.Lock()


def get_hr_db(hr_id: str):
    """Return a cached SessionMaker for the given HR tenant database."""
    if hr_id not in _hr_engine_cache:
        with _hr_engine_lock:
            # Double-checked locking
            if hr_id not in _hr_engine_cache:
                hr_db_path = os.path.join(_BASE_DIR, f"hr_{hr_id}.db")
                hr_db_url = f"sqlite:///{hr_db_path}"
                # Use NullPool for file-based SQLite so each session gets a
                # fresh connection instead of StaticPool reusing a stale one.
                from sqlalchemy.pool import NullPool
                hr_engine = create_engine(
                    hr_db_url,
                    connect_args={"check_same_thread": False},
                    poolclass=NullPool,
                )
                # Ensure all tables exist in this tenant DB
                Base.metadata.create_all(bind=hr_engine)
                _hr_engine_cache[hr_id] = sessionmaker(
                    autocommit=False, autoflush=False, bind=hr_engine
                )
    return _hr_engine_cache[hr_id]


# FastAPI dependency to get DB session for HR ID from header
from fastapi import Request, HTTPException, Depends
from typing import Generator
from jose import jwt, JWTError
from app.config import settings
SECRET_KEY = settings.secret_key
ALGORITHM = settings.algorithm
from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

def get_db_for_hr(
    request: Request,
    token: str = Depends(oauth2_scheme),
) -> Generator:
    """
    Dependency: yields a DB session for the HR ID in the JWT token.
    For now, uses the default database (single-tenant).
    Usage: db: Session = Depends(get_db_for_hr)
    """
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        hr_id = payload.get("hr_id")
        if not hr_id:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Use the specific HR database for this tenant
    SessionHR = get_hr_db(hr_id)
    db = SessionHR()
    try:
        yield db
    finally:
        db.close()
