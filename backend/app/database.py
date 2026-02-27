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
"""
database.py - Database connection and session management.
Uses SQLite for local development; swap DATABASE_URL for PostgreSQL in production.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.pool import StaticPool
import os
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



# Utility to get a session for a specific HR ID
def get_hr_db(hr_id: str):
    import os
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    hr_db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), f"hr_{hr_id}.db")
    hr_db_url = f"sqlite:///{hr_db_path}"
    hr_engine = create_engine(hr_db_url, connect_args={"check_same_thread": False})
    SessionHR = sessionmaker(autocommit=False, autoflush=False, bind=hr_engine)
    return SessionHR

# FastAPI dependency to get DB session for HR ID from header
from fastapi import Request, HTTPException, Depends
from typing import Generator
from jose import jwt, JWTError
import os
SECRET_KEY = os.getenv("SECRET_KEY", "devsecret")
ALGORITHM = "HS256"
from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/employee/login")

def get_db_for_hr(
    request: Request,
    token: str = Depends(oauth2_scheme),
) -> Generator:
    """
    Dependency: yields a DB session for the HR ID in the JWT token.
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
    # Check if HR DB exists
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), f"hr_{hr_id}.db")
    if not os.path.exists(db_path):
        from app.security_log import log_suspicious_access
        log_suspicious_access(hr_id, f"Attempted access to missing DB {db_path}")
        raise HTTPException(status_code=404, detail=f"HR database for ID '{hr_id}' not found. Please contact your administrator.")
    try:
        SessionHR = get_hr_db(hr_id)
        db = SessionHR()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to open HR database: {str(e)}")
    try:
        yield db
    finally:
        db.close()
