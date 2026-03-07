"""
Pytest configuration and fixtures.
"""

import os
import sys
import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Add app to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import Base, get_db, get_db_for_hr
from app.main import app
from app.auth import hash_password, create_access_token
from app import models


# ── Test database setup ────────────────────────────────────────────────────────
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    """Override database dependency for tests."""
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Fixtures ───────────────────────────────────────────────────────────────────

@pytest.fixture(scope="function")
def db() -> Generator:
    """Create a fresh database for each test."""
    Base.metadata.create_all(bind=test_engine)
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db) -> Generator:
    """Create a test client with database override."""
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_db_for_hr] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def sample_employee(db) -> models.Employee:
    """Create a sample employee for testing."""
    employee = models.Employee(
        name="Test Employee",
        email="test@example.com",
        password_hash=hash_password("testpass123"),
        emp_id="EMP001",
        username="testuser",
        role="employee",
        skills=["Python", "FastAPI", "SQL"],
        experience=3.5,
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


@pytest.fixture
def sample_hr(db) -> models.Employee:
    """Create a sample HR user for testing."""
    hr_user = models.Employee(
        name="HR Manager",
        email="hr@example.com",
        password_hash=hash_password("hrpass123"),
        emp_id="HR001",
        username="hrmanager",
        role="hr",
    )
    db.add(hr_user)
    db.commit()
    db.refresh(hr_user)
    return hr_user


@pytest.fixture
def sample_team_lead(db) -> models.Employee:
    """Create a sample team lead for testing."""
    lead = models.Employee(
        name="Team Lead",
        email="lead@example.com",
        password_hash=hash_password("leadpass123"),
        emp_id="TL001",
        username="teamlead",
        role="team_lead",
        skills=["Leadership", "Project Management", "Python"],
        experience=5.0,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@pytest.fixture
def sample_team(db, sample_team_lead) -> models.Team:
    """Create a sample team for testing."""
    team = models.Team(
        team_name="Alpha Team",
        team_code="ALPHA123",
        team_lead_id=sample_team_lead.id,
    )
    db.add(team)
    db.commit()
    
    # Add lead to team
    sample_team_lead.team_id = team.team_id
    db.commit()
    db.refresh(team)
    return team


@pytest.fixture
def sample_project(db) -> models.Project:
    """Create a sample project for testing."""
    project = models.Project(
        title="AI Platform Development",
        description="Build an AI-powered matching platform",
        required_skills=["Python", "FastAPI", "Machine Learning"],
        required_experience=3.0,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@pytest.fixture
def auth_headers(sample_employee) -> dict:
    """Get authentication headers for sample employee."""
    token = create_access_token({"sub": sample_employee.email, "role": sample_employee.role, "hr_id": "default"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def hr_auth_headers(sample_hr) -> dict:
    """Get authentication headers for HR user."""
    token = create_access_token({"sub": sample_hr.email, "role": sample_hr.role, "hr_id": "default"})
    return {"Authorization": f"Bearer {token}"}
