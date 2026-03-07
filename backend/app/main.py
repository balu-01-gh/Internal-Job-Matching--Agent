"""
main.py - FastAPI application entry point.
Registers all routers, sets up CORS, middleware, and initialises the database on startup.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.database import engine, Base
from app.config import settings
from app.routes import employee, team, project, hr, register
from app.google_auth import router as google_auth_router
from app.middleware import (
    RateLimitMiddleware,
    RequestLoggerMiddleware,
    SecurityHeadersMiddleware,
)
from app.exceptions import setup_exception_handlers
from app.cache import cache

# ── Configure logging ─────────────────────────────────────────────────────────
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s" 
    if settings.log_format == "text" else "%(message)s",
)
logger = logging.getLogger("klh")


# ── Lifespan context manager ──────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"Environment: {settings.environment}")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized")
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    await cache.clear()
    logger.info("Cache cleared")


# ── Application instance ──────────────────────────────────────────────────────
app = FastAPI(
    title="KLH Internal Team-Project Matching Platform",
    description="AI-powered system that matches internal teams to projects using hybrid scoring.",
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/docs" if settings.is_development else None,
    redoc_url="/redoc" if settings.is_development else None,
)

# ── Setup exception handlers ──────────────────────────────────────────────────
setup_exception_handlers(app)

# ── Middleware (order matters - last added = first executed) ──────────────────

# GZip compression for responses > 500 bytes
app.add_middleware(GZipMiddleware, minimum_size=500)

# Security headers (XSS, clickjacking protection)
app.add_middleware(
    SecurityHeadersMiddleware,
    enable_hsts=settings.is_production,
)

# Rate limiting
if settings.rate_limit_enabled:
    app.add_middleware(
        RateLimitMiddleware,
        default_rate=settings.rate_limit_default,
        auth_rate=settings.rate_limit_auth,
        upload_rate=settings.rate_limit_upload,
    )

# Request logging
app.add_middleware(RequestLoggerMiddleware)

# CORS (allow React dev server)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods,
    allow_headers=settings.cors_allow_headers,
)

# ── Register routers ──────────────────────────────────────────────────────────
app.include_router(employee.router)
app.include_router(team.router)
app.include_router(project.router)
app.include_router(hr.router)
app.include_router(register.router)
app.include_router(google_auth_router)  # Google OAuth


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health():
    """Health check endpoint for load balancers and monitoring."""
    from app.cache import cache as app_cache
    
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "cache_stats": app_cache.stats(),
    }


@app.get("/ready", tags=["Health"])
async def readiness():
    """Readiness probe - checks if dependencies are available."""
    from sqlalchemy import text
    from app.database import SessionLocal
    
    checks = {"database": False, "cache": False}
    
    # Database check
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        checks["database"] = True
    except Exception:
        pass
    
    # Cache check
    try:
        await cache.set("health_check", "ok", ttl=5)
        checks["cache"] = True
    except Exception:
        pass
    
    all_healthy = all(checks.values())
    return {
        "ready": all_healthy,
        "checks": checks,
    }


# ── Entry point (uvicorn) ─────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
