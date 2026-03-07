"""
routes/register.py
Public self-registration endpoints for employees, team leads, and HR.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db, get_db_for_hr
from app import models, schemas
from app.auth import hash_password
from app.services.embedding_service import update_employee_vector

router = APIRouter(prefix="/api/register", tags=["Registration"])


# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────

def _assert_passwords_match(p1: str, p2: str):
    if p1 != p2:
        raise HTTPException(status_code=400, detail="Passwords do not match")


def _assert_username_free(username: str, db: Session):
    if db.query(models.Employee).filter(models.Employee.username == username).first():
        raise HTTPException(status_code=400, detail="Username already taken")


def _assert_email_free(email: str, db: Session):
    if db.query(models.Employee).filter(models.Employee.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")


def _assert_emp_id_free(emp_id: str, db: Session):
    if db.query(models.Employee).filter(models.Employee.emp_id == emp_id).first():
        raise HTTPException(status_code=400, detail="Employee ID already in use")


# ─────────────────────────────────────────────────────────────
# Team Lead Registration — creates team + adds lead as first row
# ─────────────────────────────────────────────────────────────

@router.post("/teamlead", response_model=schemas.EmployeeOut, status_code=201)
def register_teamlead(
    payload: schemas.TeamLeadRegister,
    db: Session = Depends(get_db),
):
    """
    Register a new Team Lead.

    1. Validates uniqueness of team_code, username, email, lead_id.
    2. Creates the Team record with the given team_code.
    3. Creates the Employee record (role=team_lead) and links them.
    4. Sets Team.team_lead_id to point back at the new employee.
    5. Generates FAISS embedding (non-fatal if it fails).
    """
    _assert_passwords_match(payload.password, payload.password2)

    # Use HR-specific DB
    import os
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.database import Base, _BASE_DIR

    hr_db_path = os.path.join(_BASE_DIR, f"hr_{payload.hr_id}.db")
    if not os.path.exists(hr_db_path):
        raise HTTPException(status_code=404, detail="HR ID not found. Please check with your HR.")
    hr_db_url = f"sqlite:///{hr_db_path}"
    hr_engine = create_engine(hr_db_url, connect_args={"check_same_thread": False})
    SessionHR = sessionmaker(autocommit=False, autoflush=False, bind=hr_engine)
    Base.metadata.create_all(bind=hr_engine)
    hr_db = SessionHR()
    from app.auth import create_access_token
    try:
        # Uniqueness checks in HR DB
        _assert_username_free(payload.username, hr_db)
        _assert_email_free(payload.lead_email, hr_db)
        _assert_emp_id_free(payload.lead_id, hr_db)
        # Team code must be unique in HR DB
        if hr_db.query(models.Team).filter(models.Team.team_code == payload.team_code).first():
            raise HTTPException(status_code=400, detail="Team code already in use")
        # 1. Create Team
        team = models.Team(
            team_name=payload.team_name,
            team_code=payload.team_code,
        )
        hr_db.add(team)
        hr_db.flush()
        # 2. Create Team Lead employee
        lead = models.Employee(
            emp_id=payload.lead_id,
            username=payload.username,
            name=payload.lead_name,
            email=payload.lead_email,
            password_hash=hash_password(payload.password),
            role="team_lead",
            team_id=team.team_id,
            skills=[],
            experience=0.0,
            projects=[],
            certifications=[],
            resume_uploaded=False,
        )
        hr_db.add(lead)
        hr_db.flush()
        # 3. Assign team lead
        team.team_lead_id = lead.id
        hr_db.commit()
        hr_db.refresh(lead)
        # 4. Generate embedding (non-fatal)
        try:
            update_employee_vector(lead.id, hr_db)
        except Exception:
            pass
        
        return lead
    finally:
        hr_db.close()


# ─────────────────────────────────────────────────────────────
# Employee Registration — joins existing team via team_code
# ─────────────────────────────────────────────────────────────

@router.post("/employee", response_model=schemas.EmployeeOut, status_code=201)
def register_employee(
    payload: schemas.EmployeeRegister,
    db: Session = Depends(get_db),
):
    """
    Register a new Employee.

    Looks up the team by team_code so the employee's record is stored
    in the correct team automatically.
    """
    _assert_passwords_match(payload.password, payload.password2)

    # Use HR-specific DB
    import os
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.database import Base, _BASE_DIR

    hr_db_path = os.path.join(_BASE_DIR, f"hr_{payload.hr_id}.db")
    if not os.path.exists(hr_db_path):
        raise HTTPException(status_code=404, detail="HR ID not found. Please check with your HR.")
    hr_db_url = f"sqlite:///{hr_db_path}"
    hr_engine = create_engine(hr_db_url, connect_args={"check_same_thread": False})
    SessionHR = sessionmaker(autocommit=False, autoflush=False, bind=hr_engine)
    Base.metadata.create_all(bind=hr_engine)
    hr_db = SessionHR()
    try:
        _assert_username_free(payload.username, hr_db)
        _assert_email_free(payload.email, hr_db)
        _assert_emp_id_free(payload.emp_id, hr_db)
        # Team must exist in HR DB
        team = hr_db.query(models.Team).filter(models.Team.team_code == payload.team_code).first()
        if not team:
            raise HTTPException(
                status_code=404,
                detail="Team not found. Ask your Team Lead for the correct Team Code.",
            )
        employee = models.Employee(
            emp_id=payload.emp_id,
            username=payload.username,
            name=payload.name,
            email=payload.email,
            password_hash=hash_password(payload.password),
            role="employee",
            team_id=team.team_id,
            skills=[],
            experience=0.0,
            projects=[],
            certifications=[],
            resume_uploaded=False,
        )
        hr_db.add(employee)
        hr_db.commit()
        hr_db.refresh(employee)
        try:
            update_employee_vector(employee.id, hr_db)
        except Exception:
            pass
        # Convert to dict before closing session to prevent DetachedInstanceError
        result = schemas.EmployeeOut.model_validate(employee)
        return result
    finally:
        hr_db.close()


# ─────────────────────────────────────────────────────────────
# HR Registration
# ─────────────────────────────────────────────────────────────

@router.post("/hr", response_model=schemas.EmployeeOut, status_code=201)
def register_hr(
    payload: schemas.HRRegister,
    db: Session = Depends(get_db),
):
    """Register a new HR user (no team affiliation)."""
    _assert_passwords_match(payload.password, payload.password2)
    _assert_username_free(payload.username, db)
    _assert_email_free(payload.email, db)
    _assert_emp_id_free(payload.hr_id, db)

    # Create a new SQLite DB for this HR
    import os
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.database import Base, _BASE_DIR

    hr_db_path = os.path.join(_BASE_DIR, f"hr_{payload.hr_id}.db")
    hr_db_url = f"sqlite:///{hr_db_path}"
    hr_engine = create_engine(hr_db_url, connect_args={"check_same_thread": False})
    SessionHR = sessionmaker(autocommit=False, autoflush=False, bind=hr_engine)

    # Create tables if not exist
    Base.metadata.create_all(bind=hr_engine)

    # Add HR user to their own DB
    hr_db = SessionHR()
    from app.auth import create_access_token
    try:
        hr_user = models.Employee(
            emp_id=payload.hr_id,
            username=payload.username,
            name=payload.name,
            email=payload.email,
            password_hash=hash_password(payload.password),
            role="hr",
            team_id=None,
            skills=[],
            experience=0.0,
            projects=[],
            certifications=[],
            resume_uploaded=False,
        )
        hr_db.add(hr_user)
        hr_db.commit()
        hr_db.refresh(hr_user)
    finally:
        hr_db.close()

    return hr_user


# ─────────────────────────────────────────────────────────────
# Team code lookup (used by frontend to auto-fill team name)
# ─────────────────────────────────────────────────────────────

@router.get("/team-lookup/{team_code}", response_model=schemas.TeamOut)
async def team_lookup(team_code: str, hr_id: str, db: Session = Depends(get_db)):
    """Return team info for a given team_code and hr_id (no auth required)."""
    import os
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.database import Base, _BASE_DIR

    hr_db_path = os.path.join(_BASE_DIR, f"hr_{hr_id}.db")
    if not os.path.exists(hr_db_path):
        raise HTTPException(status_code=404, detail="HR ID not found.")
    hr_db_url = f"sqlite:///{hr_db_path}"
    hr_engine = create_engine(hr_db_url, connect_args={"check_same_thread": False})
    SessionHR = sessionmaker(autocommit=False, autoflush=False, bind=hr_engine)
    hr_db = SessionHR()
    try:
        team = hr_db.query(models.Team).filter(models.Team.team_code == team_code).first()
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        # Detach before closing session
        hr_db.expunge(team)
        return team
    finally:
        hr_db.close()
