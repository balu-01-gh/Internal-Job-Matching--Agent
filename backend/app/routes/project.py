"""
routes/project.py
Project CRUD endpoints. HR creates projects; all authenticated users can browse.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db_for_hr, get_db
from app import models, schemas
from app.auth import get_current_employee, require_role
from app.services.embedding_service import update_project_vector

router = APIRouter(prefix="/api/project", tags=["Project"])


# ── List all projects ─────────────────────────────────────────
@router.get("/", response_model=List[schemas.ProjectOut])
async def list_projects(hr_id: str, db: Session = Depends(get_db_for_hr)):
    """List all available projects for a specific HR."""
    return db.query(models.Project).all()


# ── Get single project ────────────────────────────────────────
@router.get("/{project_id}", response_model=schemas.ProjectOut)
async def get_project(
    project_id: int,
    db: Session = Depends(get_db_for_hr),
):
    """Retrieve a project by ID."""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


# ── Create project (HR only) ──────────────────────────────────
@router.post("/", response_model=schemas.ProjectOut, status_code=201)
async def create_project(
    payload: schemas.ProjectCreate,
    db: Session = Depends(get_db_for_hr),
    _: models.Employee = Depends(require_role("hr")),
):
    """
    HR creates a project. Embedding is generated and indexed in FAISS
    immediately after creation.
    """
    project = models.Project(
        title=payload.title,
        description=payload.description,
        required_skills=payload.required_skills,
        required_experience=payload.required_experience,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    # Index the project in FAISS
    try:
        update_project_vector(project.id, db)
        db.refresh(project)
    except Exception as e:
        # Non-fatal: project is created, but embedding may need manual trigger
        pass

    return project


# ── Update project (HR only) ──────────────────────────────────
@router.put("/{project_id}", response_model=schemas.ProjectOut)
async def update_project(
    project_id: int,
    payload: schemas.ProjectCreate,
    db: Session = Depends(get_db_for_hr),
    _: models.Employee = Depends(require_role("hr")),
):
    """HR updates a project and regenerates its embedding."""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.title = payload.title
    project.description = payload.description
    project.required_skills = payload.required_skills
    project.required_experience = payload.required_experience
    db.commit()
    db.refresh(project)

    try:
        update_project_vector(project.id, db)
        db.refresh(project)
    except Exception:
        pass

    return project


# ── Delete project (HR only) ──────────────────────────────────
@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: int,
    db: Session = Depends(get_db_for_hr),
    _: models.Employee = Depends(require_role("hr")),
):
    """HR deletes a project."""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return None


# ── Re-generate project embedding (HR only) ───────────────────
@router.post("/{project_id}/embed")
async def embed_project(
    project_id: int,
    db: Session = Depends(get_db_for_hr),
    _: models.Employee = Depends(require_role("hr")),
):
    """Force regeneration of a project's FAISS embedding."""
    idx = update_project_vector(project_id, db)
    return {"message": "Embedding updated", "faiss_index": idx}
