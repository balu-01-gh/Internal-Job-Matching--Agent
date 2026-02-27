"""
routes/hr.py
HR-facing endpoints: evaluate all teams for a project, view ranked results.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db_for_hr
from app import models, schemas
from app.auth import require_role
from app.services.matching_service import get_top_5_teams, rank_teams
from app.services.team_service import get_team_skill_heatmap

router = APIRouter(prefix="/api/hr", tags=["HR"])


# ── Evaluate all teams for a project ─────────────────────────
@router.get("/rank-teams/{project_id}")
async def rank_all_teams(
    project_id: int,
    db: Session = Depends(get_db_for_hr),
    _: models.Employee = Depends(require_role("hr")),
):
    """
    HR triggers evaluation of all teams for a project.
    Returns every team ranked by composite score (descending).
    """
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    results = rank_teams(project_id, db)
    if not results:
        return {"project_id": project_id, "teams": [], "message": "No teams available"}

    # Attach match_percentage for frontend display
    for r in results:
        r["match_percentage"] = round(r["final_score"] * 100, 2)

    return {"project_id": project_id, "project_title": project.title, "teams": results}


# ── Top 5 teams ───────────────────────────────────────────────
@router.get("/top-teams/{project_id}")
async def top_5_teams(
    project_id: int,
    db: Session = Depends(get_db_for_hr),
    _: models.Employee = Depends(require_role("hr")),
):
    """Return the Top 5 ranked teams for a project."""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    results = get_top_5_teams(project_id, db)
    for r in results:
        r["match_percentage"] = round(r["final_score"] * 100, 2)

    return {
        "project_id": project_id,
        "project_title": project.title,
        "top_teams": results,
    }


# ── Team details with heatmap (HR view) ──────────────────────
@router.get("/team-details/{team_id}", response_model=schemas.TeamDetailOut)
async def team_details(
    team_id: int,
    db: Session = Depends(get_db_for_hr),
    _: models.Employee = Depends(require_role("hr")),
):
    """HR views full team details including members."""
    team = db.query(models.Team).filter(models.Team.team_id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team


# ── All teams overview ────────────────────────────────────────
@router.get("/teams")
async def all_teams(
    db: Session = Depends(get_db_for_hr),
    _: models.Employee = Depends(require_role("hr")),
):
    """Return all teams with member counts."""
    teams = db.query(models.Team).all()
    return [
        {
            "team_id": t.team_id,
            "team_name": t.team_name,
            "team_lead_id": t.team_lead_id,
            "member_count": len(t.members or []),
        }
        for t in teams
    ]


# ── Application history for a project ────────────────────────
@router.get("/applications/{project_id}", response_model=List[schemas.ApplicationOut])
async def project_applications(
    project_id: int,
    db: Session = Depends(get_db_for_hr),
    _: models.Employee = Depends(require_role("hr")),
):
    """Return stored application/score records for a project."""
    return (
        db.query(models.Application)
        .filter(models.Application.project_id == project_id)
        .order_by(models.Application.score.desc())
        .all()
    )


# ── Save/persist evaluation results ──────────────────────────
@router.post("/evaluate/{project_id}")
async def save_evaluation(
    project_id: int,
    db: Session = Depends(get_db_for_hr),
    _: models.Employee = Depends(require_role("hr")),
):
    """
    Run full evaluation and persist Application records for all teams.
    Safe to call multiple times (upserts by project_id + team_id).
    """
    results = rank_teams(project_id, db)
    saved = []

    for r in results:
        existing = (
            db.query(models.Application)
            .filter(
                models.Application.project_id == project_id,
                models.Application.team_id == r["team_id"],
            )
            .first()
        )
        if existing:
            existing.score = r["final_score"]
        else:
            app = models.Application(
                project_id=project_id,
                team_id=r["team_id"],
                score=r["final_score"],
            )
            db.add(app)
        saved.append({"team_id": r["team_id"], "score": r["final_score"]})

    db.commit()
    return {"saved": len(saved), "results": saved}
