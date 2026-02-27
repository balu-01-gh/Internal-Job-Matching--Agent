"""
schemas.py - Pydantic v2 request/response models for all endpoints.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ─────────────────────────────────────────────────────────────
# Auth
# ─────────────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: str   # accepts both email address and username
    password: str


# ─────────────────────────────────────────────────────────────
# Employee
# ─────────────────────────────────────────────────────────────

# ── New registration schemas ──────────────────────────────────

class EmployeeRegister(BaseModel):
    """Self-registration payload for a regular employee."""
    emp_id: str
    name: str
    email: EmailStr
    team_code: str          # must match an existing Team.team_code
    hr_id: str              # HR ID to select the correct DB
    username: str
    password: str
    password2: str


class TeamLeadRegister(BaseModel):
    """Team Lead registration — simultaneously creates the team."""
    team_code: str          # custom team ID chosen by the lead (unique)
    team_name: str
    lead_name: str
    lead_id: str            # custom lead employee ID
    lead_email: EmailStr
    hr_id: str              # HR ID to select the correct DB
    username: str
    password: str
    password2: str


class HRRegister(BaseModel):
    """HR self-registration."""
    hr_id: str
    name: str
    email: EmailStr
    username: str
    password: str
    password2: str


# ── Legacy / internal create (kept for seed.py & internal use) ─

class EmployeeCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    skills: List[str] = []
    experience: float = 0.0
    projects: List[str] = []
    certifications: List[str] = []
    role: str = "employee"
    team_id: Optional[int] = None
    emp_id: Optional[str] = None
    username: Optional[str] = None


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    skills: Optional[List[str]] = None
    experience: Optional[float] = None
    projects: Optional[List[str]] = None
    certifications: Optional[List[str]] = None
    team_id: Optional[int] = None


class EmployeeOut(BaseModel):
    id: int
    emp_id: Optional[str]
    username: Optional[str]
    name: str
    email: str
    skills: List[str]
    experience: float
    projects: List[str]
    certifications: List[str]
    role: str
    team_id: Optional[int]
    resume_uploaded: bool = False

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────────────────────
# Team
# ─────────────────────────────────────────────────────────────

class TeamCreate(BaseModel):
    team_name: str
    team_code: Optional[str] = None
    team_lead_id: Optional[int] = None


class TeamOut(BaseModel):
    team_id: int
    team_name: str
    team_code: Optional[str]
    team_lead_id: Optional[int]

    model_config = {"from_attributes": True}


class TeamDetailOut(BaseModel):
    team_id: int
    team_name: str
    team_lead_id: Optional[int]
    members: List[EmployeeOut]

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────────────────────
# Project
# ─────────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    title: str
    description: str
    required_skills: List[str] = []
    required_experience: float = Field(default=1.0, ge=0)


class ProjectOut(BaseModel):
    id: int
    title: str
    description: str
    required_skills: List[str]
    required_experience: float
    embedding_reference: Optional[int]

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────────────────────
# Application / Match Results
# ─────────────────────────────────────────────────────────────

class ApplicationOut(BaseModel):
    id: int
    project_id: int
    team_id: int
    score: float
    created_at: datetime

    model_config = {"from_attributes": True}


class TeamMatchResult(BaseModel):
    """Single team entry in the HR ranking response."""
    team_id: int
    team_name: str
    score: float
    match_percentage: float
    skill_coverage: float
    experience_match: float
    embedding_similarity: float
    team_balance: float


class ProjectMatchResult(BaseModel):
    """Single project entry in employee Top-5 response."""
    project_id: int
    title: str
    description: str
    required_skills: List[str]
    score: float
    match_percentage: float
    skill_gap: List[str]  # skills the employee is missing


# ─────────────────────────────────────────────────────────────
# Skill Heatmap
# ─────────────────────────────────────────────────────────────

class SkillHeatmapRow(BaseModel):
    """One row per employee for heatmap display."""
    employee_name: str
    skills: List[str]


class TeamSkillHeatmap(BaseModel):
    employees: List[SkillHeatmapRow]
    all_skills: List[str]  # union of all skills across the team
