"""
main.py - FastAPI application entry point.
Registers all routers, sets up CORS, and initialises the database on startup.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routes import employee, team, project, hr, register

# ── Create all tables on startup (SQLite / initial Postgres setup) ─────────────
Base.metadata.create_all(bind=engine)

# ── Application instance ──────────────────────────────────────────────────────
app = FastAPI(
    title="KLH Internal Team-Project Matching Platform",
    description="AI-powered system that matches internal teams to projects using hybrid scoring.",
    version="1.0.0",
)

# ── CORS (allow React dev server) ─────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register routers ──────────────────────────────────────────────────────────
app.include_router(employee.router)
app.include_router(team.router)
app.include_router(project.router)
app.include_router(hr.router)
app.include_router(register.router)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "service": "KLH Matching Platform"}


# ── Entry point (uvicorn) ─────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
