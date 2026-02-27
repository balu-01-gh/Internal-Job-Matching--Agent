"""
matching_service.py
Implements the core hybrid scoring formula:

  final_score = 0.4*embedding_similarity
              + 0.3*skill_coverage
              + 0.2*experience_match
              + 0.1*team_balance
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app import models
from app.services.embedding_service import (
    get_team_embedding,
    get_project_vector,
    compute_cosine_similarity,
    generate_employee_embedding,
    get_employee_vector,
)


# ─────────────────────────────────────────────────────────────
# Score component helpers
# ─────────────────────────────────────────────────────────────

def _skill_coverage(required: List[str], team_skills: List[str]) -> float:
    """
    Fraction of required skills covered by the team.
    |required ∩ team_skills| / |required|
    Returns 0.0 if no skills are required.
    """
    if not required:
        return 1.0
    required_lower = {s.lower() for s in required}
    team_lower = {s.lower() for s in team_skills}
    covered = required_lower & team_lower
    return len(covered) / len(required_lower)


def _experience_match(avg_experience: float, required: float) -> float:
    """
    min(avg_team_experience / required_experience, 1.0)
    Capped at 1.0; returns 1.0 if no experience required.
    """
    if required <= 0:
        return 1.0
    return min(avg_experience / required, 1.0)


def _team_balance(members: List[models.Employee]) -> float:
    """
    Simple diversity metric:  unique skills / total skills across the team.
    Ranges [0, 1]; higher = broader unique coverage relative to total.
    Falls back to 0.5 for empty teams.
    """
    if not members:
        return 0.5

    all_skills = []
    for m in members:
        all_skills.extend([s.lower() for s in (m.skills or [])])

    if not all_skills:
        return 0.5

    unique_ratio = len(set(all_skills)) / len(all_skills)
    return min(unique_ratio, 1.0)


def _embedding_similarity(team_id: int, project: models.Project, db: Session) -> float:
    """Cosine similarity between team embedding and project embedding."""
    if project.embedding_reference is None:
        return 0.0

    team_vec = get_team_embedding(team_id, db)
    if team_vec is None:
        return 0.0

    proj_vec = get_project_vector(project.embedding_reference)
    if proj_vec is None:
        return 0.0

    return compute_cosine_similarity(team_vec, proj_vec)


# ─────────────────────────────────────────────────────────────
# Main scoring function
# ─────────────────────────────────────────────────────────────

def calculate_team_score(team_id: int, project_id: int, db: Session) -> Dict[str, float]:
    """
    Calculate the full hybrid score for a team against a project.
    Returns a dict with all component scores and the final score.
    """
    team = db.query(models.Team).filter(models.Team.team_id == team_id).first()
    if not team:
        raise ValueError(f"Team {team_id} not found")

    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise ValueError(f"Project {project_id} not found")

    members = team.members or []

    # Aggregate team skills (union)
    team_skills: List[str] = []
    for m in members:
        team_skills.extend(m.skills or [])

    # Average experience
    avg_exp = (
        sum(m.experience for m in members) / len(members)
        if members else 0.0
    )

    # Compute components
    emb_sim = _embedding_similarity(team_id, project, db)
    skill_cov = _skill_coverage(project.required_skills or [], team_skills)
    exp_match = _experience_match(avg_exp, project.required_experience)
    t_balance = _team_balance(members)

    # Weighted formula (DO NOT MODIFY)
    final = (
        0.4 * emb_sim
        + 0.3 * skill_cov
        + 0.2 * exp_match
        + 0.1 * t_balance
    )

    return {
        "team_id": team_id,
        "project_id": project_id,
        "final_score": round(final, 4),
        "embedding_similarity": round(emb_sim, 4),
        "skill_coverage": round(skill_cov, 4),
        "experience_match": round(exp_match, 4),
        "team_balance": round(t_balance, 4),
    }


# ─────────────────────────────────────────────────────────────
# Ranking helpers
# ─────────────────────────────────────────────────────────────

def rank_teams(project_id: int, db: Session) -> List[Dict[str, Any]]:
    """
    Score every team against the given project and return them sorted
    by final_score descending.
    """
    teams = db.query(models.Team).all()
    results = []
    for team in teams:
        try:
            score_data = calculate_team_score(team.team_id, project_id, db)
            score_data["team_name"] = team.team_name
            results.append(score_data)
        except Exception:
            continue  # Skip teams with data issues

    results.sort(key=lambda x: x["final_score"], reverse=True)
    return results


def get_top_5_teams(project_id: int, db: Session) -> List[Dict[str, Any]]:
    """Return the top 5 teams for a project."""
    return rank_teams(project_id, db)[:5]


# ─────────────────────────────────────────────────────────────
# Employee → Project matching
# ─────────────────────────────────────────────────────────────

def get_top_5_projects_for_employee(employee_id: int, db: Session) -> List[Dict[str, Any]]:
    """
    Find Top 5 projects that best match a single employee.
    Uses individual employee embedding vs project embedding + skill gap.
    """
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not employee:
        raise ValueError(f"Employee {employee_id} not found")

    if employee.embedding_index is None:
        return []

    emp_vec = get_employee_vector(employee.embedding_index)
    if emp_vec is None:
        return []

    projects = db.query(models.Project).all()
    results = []
    for project in projects:
        if project.embedding_reference is None:
            continue

        proj_vec = get_project_vector(project.embedding_reference)
        if proj_vec is None:
            continue

        sim = compute_cosine_similarity(emp_vec, proj_vec)

        # Skill gap: required skills this employee lacks
        emp_skills_lower = {s.lower() for s in (employee.skills or [])}
        req_skills_lower = {s.lower() for s in (project.required_skills or [])}
        missing = [s for s in project.required_skills if s.lower() not in emp_skills_lower]

        results.append({
            "project_id": project.id,
            "title": project.title,
            "description": project.description,
            "required_skills": project.required_skills,
            "score": round(sim, 4),
            "match_percentage": round(sim * 100, 2),
            "skill_gap": missing,
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:5]
