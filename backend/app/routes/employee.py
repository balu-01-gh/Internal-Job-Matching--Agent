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

router = APIRouter(prefix="/api/employee", tags=["Employee"])


# ── Login ─────────────────────────────────────────────────────
@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    """Authenticate by email or username and return a JWT access token."""
    from app.security_log import log_failed_login
    from app.database import get_hr_db
    import os
    from app.database import _BASE_DIR
    
    try:
        # Determine which DB to use
        target_db = db
        actual_hr_id = payload.hr_id
        
        if payload.hr_id and payload.hr_id != "default":
            hr_db_path = os.path.join(_BASE_DIR, f"hr_{payload.hr_id}.db")
            if os.path.exists(hr_db_path):
                SessionHR = get_hr_db(payload.hr_id)
                target_db = SessionHR()
            else:
                log_failed_login(payload.email, f"HR ID {payload.hr_id} not found")
                raise HTTPException(status_code=404, detail="HR ID not found")
        
        employee = (
            target_db.query(models.Employee).filter(models.Employee.email == payload.email).first()
            or target_db.query(models.Employee).filter(models.Employee.username == payload.email).first()
            or target_db.query(models.Employee).filter(models.Employee.emp_id == payload.email).first()
        )
        
        if not employee:
            if target_db != db: target_db.close()
            log_failed_login(payload.email, "User not found")
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
        if not verify_password(payload.password, employee.password_hash):
            if target_db != db: target_db.close()
            log_failed_login(payload.email, "Wrong password")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        token = create_access_token({
            "sub": employee.email, 
            "role": employee.role, 
            "hr_id": actual_hr_id if actual_hr_id and actual_hr_id != "default" else employee.emp_id
        })
        
        if target_db != db: target_db.close()
        return {"access_token": token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        log_failed_login(payload.email, str(e))
        raise HTTPException(status_code=500, detail=f"Login error: {str(e)}")



# ── Get profile ───────────────────────────────────────────────
@router.get("/me", response_model=schemas.EmployeeOut)
async def get_me(current: models.Employee = Depends(get_current_employee)):
    """Return the authenticated employee's profile (from HR-specific DB)."""
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
    except Exception as e:
        import logging
        logging.getLogger("klh").warning(f"Embedding update failed for employee {current.id}: {e}")

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

    # Validate file size (max 20 MB)
    MAX_RESUME_SIZE = 20 * 1024 * 1024
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(contents) > MAX_RESUME_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 20 MB)")

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
    except Exception as e:
        import logging
        logging.getLogger("klh").warning(f"Embedding update failed after resume upload for employee {current.id}: {e}")

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
