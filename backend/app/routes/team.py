"""
routes/team.py
Team Lead-facing endpoints: team overview, skill heatmap, skill gaps.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db_for_hr
from app import models, schemas
from app.auth import get_current_employee, require_role
from app.services.team_service import (
    get_team_members,
    get_team_skill_heatmap,
    get_individual_skill_gap,
)

router = APIRouter(prefix="/api/team", tags=["Team"])


# ── List all teams ────────────────────────────────────────────
@router.get("/", response_model=List[schemas.TeamOut])
async def list_teams(db: Session = Depends(get_db_for_hr)):
    """Return all teams (public endpoint for nav/selection)."""
    return db.query(models.Team).all()


# ── Create a team (HR only) ───────────────────────────────────
@router.post("/", response_model=schemas.TeamOut, status_code=201)
async def create_team(
    payload: schemas.TeamCreate,
    db: Session = Depends(get_db_for_hr),
    _: models.Employee = Depends(require_role("hr")),
):
    """HR creates a new team."""
    team = models.Team(team_name=payload.team_name, team_lead_id=payload.team_lead_id)
    db.add(team)
    db.commit()
    db.refresh(team)
    return team


# ── Team detail ───────────────────────────────────────────────
@router.get("/{team_id}", response_model=schemas.TeamDetailOut)
async def get_team(
    team_id: int,
    db: Session = Depends(get_db_for_hr),
    _: models.Employee = Depends(get_current_employee),
):
    """Return a team with all its members."""
    team = db.query(models.Team).filter(models.Team.team_id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team


# ── Team members only ─────────────────────────────────────────
@router.get("/{team_id}/members", response_model=List[schemas.EmployeeOut])
async def team_members(
    team_id: int,
    db: Session = Depends(get_db_for_hr),
    current: models.Employee = Depends(require_role("team_lead", "hr")),
):
    """Return members of a team (Team Lead or HR only)."""
    return get_team_members(team_id, db)


# ── Skill heatmap ─────────────────────────────────────────────
@router.get("/{team_id}/heatmap", response_model=schemas.TeamSkillHeatmap)
async def skill_heatmap(
    team_id: int,
    db: Session = Depends(get_db_for_hr),
    current: models.Employee = Depends(require_role("team_lead", "hr")),
):
    """
    Return per-employee skill data suitable for heatmap visualisation.
    Accessible to Team Leads and HR.
    """
    return get_team_skill_heatmap(team_id, db)


# ── Individual skill gap ──────────────────────────────────────
@router.get("/{team_id}/skill-gap/{employee_id}")
async def individual_skill_gap(
    team_id: int,
    employee_id: int,
    project_id: int,
    db: Session = Depends(get_db_for_hr),
    current: models.Employee = Depends(require_role("team_lead", "hr")),
):
    """
    Skill gap for a specific team member against a specific project.
    Query param: ?project_id=<int>
    """
    return get_individual_skill_gap(employee_id, project_id, db)
