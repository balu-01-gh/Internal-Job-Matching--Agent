"""
team_service.py - Business logic for team-level operations.
"""

from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app import models


def get_team_members(team_id: int, db: Session) -> List[models.Employee]:
    """Return all employees belonging to a team."""
    team = db.query(models.Team).filter(models.Team.team_id == team_id).first()
    if not team:
        raise ValueError(f"Team {team_id} not found")
    return team.members or []


def get_team_skill_heatmap(team_id: int, db: Session) -> Dict[str, Any]:
    """
    Build data for the skill heatmap visualisation.
    Returns:
      - employees: [{name, skills:[...]}]
      - all_skills: sorted union of all skills
    """
    members = get_team_members(team_id, db)
    all_skills: set = set()
    employees_data = []

    for member in members:
        skills = member.skills or []
        all_skills.update(s.lower() for s in skills)
        employees_data.append({
            "employee_name": member.name,
            "skills": skills,
        })

    return {
        "employees": employees_data,
        "all_skills": sorted(all_skills),
    }


def get_individual_skill_gap(employee_id: int, project_id: int, db: Session) -> Dict[str, Any]:
    """
    Compute the skill gap for a specific employee against a specific project.
    """
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    project = db.query(models.Project).filter(models.Project.id == project_id).first()

    if not employee or not project:
        raise ValueError("Employee or project not found")

    emp_skills = {s.lower() for s in (employee.skills or [])}
    req_skills = project.required_skills or []

    missing = [s for s in req_skills if s.lower() not in emp_skills]
    covered = [s for s in req_skills if s.lower() in emp_skills]

    return {
        "employee_id": employee_id,
        "employee_name": employee.name,
        "project_title": project.title,
        "covered_skills": covered,
        "missing_skills": missing,
        "coverage_percentage": round(len(covered) / len(req_skills) * 100, 2) if req_skills else 100.0,
    }
