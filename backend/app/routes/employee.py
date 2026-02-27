"""
routes/employee.py
Handles signup, login, resume upload, and employee-facing project matches.
"""

import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.database import get_db, get_db_for_hr
from app import models, schemas
from app.auth import (
    hash_password, verify_password,
    create_access_token, get_current_employee,
)
from app.services.embedding_service import update_employee_vector
from app.services.matching_service import get_top_5_projects_for_employee

router = APIRouter(prefix="/api", tags=["Login"])


# ── Signup ────────────────────────────────────────────────────
@router.post("/signup", response_model=schemas.EmployeeOut, status_code=201)
def signup(payload: schemas.EmployeeCreate, db: Session = Depends(get_db_for_hr)):
    """Register a new employee. Email must be unique."""
    if db.query(models.Employee).filter(models.Employee.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    employee = models.Employee(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        skills=payload.skills,
        experience=payload.experience,
        projects=payload.projects,
        certifications=payload.certifications,
        role=payload.role,
        team_id=payload.team_id,
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)

    # Generate and store embedding immediately after creation
    try:
        update_employee_vector(employee.id, db)
    except Exception:
        pass  # Non-fatal; can be re-triggered via /update-embedding

    return employee


# ── Login ─────────────────────────────────────────────────────
@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.LoginRequest, hr_id: str, db: Session = Depends(get_db_for_hr)):
    """Authenticate by email or username and return a JWT access token. Requires HR ID."""
    from app.security_log import log_failed_login
    employee = (
        db.query(models.Employee).filter(models.Employee.email == payload.email).first()
        or db.query(models.Employee).filter(models.Employee.username == payload.email).first()
    )
    if not employee:
        log_failed_login(payload.email, "User not found")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(payload.password, employee.password_hash):
        log_failed_login(payload.email, "Wrong password")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": employee.email, "role": employee.role, "hr_id": hr_id})
    return {"access_token": token, "token_type": "bearer"}
    """Authenticate by email or username and return a JWT access token."""
    # Try email first, then username
    from app.security_log import log_failed_login
    employee = (
        db.query(models.Employee).filter(models.Employee.email == payload.email).first()
        or db.query(models.Employee).filter(models.Employee.username == payload.email).first()
    )
    if not employee:
        log_failed_login(payload.email, "User not found")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(payload.password, employee.password_hash):
        log_failed_login(payload.email, "Wrong password")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Get HR ID from employee record (emp_id for HR, or from team/team_lead for others)
    hr_id = None
    if employee.role == "hr":
        hr_id = employee.emp_id
    else:
        # Find HR by traversing team/team_lead
        if employee.team_id:
            team = db.query(models.Team).filter(models.Team.team_id == employee.team_id).first()
            if team and team.team_lead_id:
                lead = db.query(models.Employee).filter(models.Employee.id == team.team_lead_id).first()
                if lead and lead.emp_id:
                    hr_id = lead.emp_id
    if not hr_id:
        hr_id = "unknown"
    token = create_access_token({"sub": employee.email, "role": employee.role, "hr_id": hr_id})
    return {"access_token": token, "token_type": "bearer"}


# ── Get profile ───────────────────────────────────────────────
@router.get("/me", response_model=schemas.EmployeeOut)
async def get_me(current: models.Employee = Depends(get_current_employee)):
    """Return the authenticated employee's profile."""
    return current


# ── Update profile ────────────────────────────────────────────
@router.put("/me", response_model=schemas.EmployeeOut)
async def update_me(
    payload: schemas.EmployeeUpdate,
    db: Session = Depends(get_db_for_hr),
    current: models.Employee = Depends(get_current_employee),
):
    """Update the authenticated employee's profile fields."""
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current, field, value)
    db.commit()
    db.refresh(current)

    # Regenerate embedding when profile changes
    try:
        update_employee_vector(current.id, db)
    except Exception:
        pass

    return current


# ── Resume upload ─────────────────────────────────────────────
@router.post("/upload-resume", response_model=schemas.EmployeeOut)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db_for_hr),
    current: models.Employee = Depends(get_current_employee),
):
    """
    Accept a PDF resume, parse skills/experience via pdfplumber + spaCy,
    update the employee record, and regenerate the FAISS embedding.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    contents = await file.read()

    # ── Parse PDF ─────────────────────────────────────────────
    try:
        import pdfplumber
        import spacy
        import re

        nlp = spacy.load("en_core_web_sm")

        with pdfplumber.open(io.BytesIO(contents)) as pdf:
            text = " ".join(page.extract_text() or "" for page in pdf.pages)

        doc = nlp(text)

        # ── Skills: noun/proper-noun tokens > 2 chars, title-cased or all-caps ──
        extracted_skills = list({
            token.text for token in doc
            if token.pos_ in ("NOUN", "PROPN") and len(token.text) > 2
        })[:30]

        # ── Experience: look for patterns like "3 years", "2+ years" ──
        years_pattern = re.findall(
            r'(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:years?|yrs?)',
            text,
            re.IGNORECASE,
        )
        extracted_experience = max((float(y) for y in years_pattern), default=current.experience or 0.0)

        # ── Projects: lines that start with a bullet/dash or look like project titles ──
        project_lines = re.findall(
            r'(?:project|worked on|developed|built)[^.\n]{5,60}',
            text,
            re.IGNORECASE,
        )
        extracted_projects = [p.strip() for p in project_lines[:5]]

        # ── Certifications: common cert keywords ──
        cert_lines = re.findall(
            r'(?:certified|certification|certificate)[^.\n]{3,60}',
            text,
            re.IGNORECASE,
        )
        extracted_certs = [c.strip() for c in cert_lines[:5]]

        # Merge extracted data with existing (preserve previously stored info)
        current.skills = list(set((current.skills or []) + extracted_skills))[:40]
        current.experience = max(extracted_experience, current.experience or 0.0)
        current.projects = list(set((current.projects or []) + extracted_projects))[:10]
        current.certifications = list(set((current.certifications or []) + extracted_certs))[:10]
        current.resume_uploaded = True

    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Resume parsing failed: {str(e)}")

    db.commit()
    db.refresh(current)

    # Regenerate embedding after resume update
    try:
        update_employee_vector(current.id, db)
    except Exception:
        pass

    return current


# ── Top 5 projects ────────────────────────────────────────────
@router.get("/top-projects")
async def top_projects(
    db: Session = Depends(get_db_for_hr),
    current: models.Employee = Depends(get_current_employee),
):
    """Return Top 5 projects that best match the authenticated employee."""
    return get_top_5_projects_for_employee(current.id, db)


# ── Re-generate embedding (utility) ──────────────────────────
@router.post("/update-embedding")
async def update_embedding(
    db: Session = Depends(get_db_for_hr),
    current: models.Employee = Depends(get_current_employee),
):
    """Force regeneration of the employee's FAISS embedding."""
    idx = update_employee_vector(current.id, db)
    return {"message": "Embedding updated", "faiss_index": idx}
