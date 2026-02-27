"""
embedding_service.py
Handles sentence-transformer embeddings + FAISS index management.

Two separate FAISS indices:
  - employee_index  → one vector per employee
  - project_index   → one vector per project

Index files are persisted to disk so they survive restarts.
"""

import os
import json
import numpy as np
try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
from sentence_transformers import SentenceTransformer
from typing import List, Optional
from sqlalchemy.orm import Session

from app import models

# ── Model ─────────────────────────────────────────────────────────────────────
# all-MiniLM-L6-v2 produces 384-dim embeddings; fast and accurate
_model: Optional[SentenceTransformer] = None

EMBEDDING_DIM = 384
EMPLOYEE_INDEX_PATH = "faiss_employee.index"
PROJECT_INDEX_PATH = "faiss_project.index"


def _get_model() -> SentenceTransformer:
    """Lazy-load the sentence-transformer model (once per process)."""
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


# ── FAISS helpers ─────────────────────────────────────────────────────────────

def _load_or_create_index(path: str) -> faiss.IndexFlatIP:
    """
    Load a FAISS inner-product (cosine) index from disk, or create a fresh one.
    Vectors must be L2-normalised before adding for cosine similarity to hold.
    """
    if not FAISS_AVAILABLE:
        class DummyIndex:
            def __init__(self): self.ntotal = 0
            def add(self, vec): pass
            def reconstruct(self, idx): return np.zeros((1, EMBEDDING_DIM), dtype=np.float32)
        return DummyIndex()
    if os.path.exists(path):
        return faiss.read_index(path)
    return faiss.IndexFlatIP(EMBEDDING_DIM)


def _save_index(index: faiss.IndexFlatIP, path: str) -> None:
    if FAISS_AVAILABLE:
        faiss.write_index(index, path)


def _normalize(vec: np.ndarray) -> np.ndarray:
    """L2-normalise a 1-D or 2-D numpy array in place and return it."""
    if vec.ndim == 1:
        vec = vec.reshape(1, -1)
    norms = np.linalg.norm(vec, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1e-10, norms)
    return (vec / norms).astype(np.float32)


# ── Text serialisation helpers ────────────────────────────────────────────────

def _employee_to_text(employee: models.Employee) -> str:
    """
    Convert an Employee ORM object into a rich text string for embedding.
    Includes skills, certifications, past projects, and experience level.
    """
    skills = ", ".join(employee.skills or [])
    certs = ", ".join(employee.certifications or [])
    past_projects = ", ".join(employee.projects or [])
    return (
        f"Employee: {employee.name}. "
        f"Skills: {skills}. "
        f"Experience: {employee.experience} years. "
        f"Certifications: {certs}. "
        f"Past projects: {past_projects}."
    )


def _project_to_text(project: models.Project) -> str:
    """Convert a Project ORM object into a text string for embedding."""
    skills = ", ".join(project.required_skills or [])
    return (
        f"Project: {project.title}. "
        f"Description: {project.description}. "
        f"Required skills: {skills}. "
        f"Required experience: {project.required_experience} years."
    )


# ── Public API ────────────────────────────────────────────────────────────────

def generate_employee_embedding(employee: models.Employee) -> np.ndarray:
    """Return normalised 384-dim embedding for an employee."""
    text = _employee_to_text(employee)
    vec = _get_model().encode(text, convert_to_numpy=True)
    return _normalize(vec)


def generate_project_embedding(project: models.Project) -> np.ndarray:
    """Return normalised 384-dim embedding for a project."""
    text = _project_to_text(project)
    vec = _get_model().encode(text, convert_to_numpy=True)
    return _normalize(vec)


def update_employee_vector(employee_id: int, db: Session) -> int:
    """
    (Re)compute the embedding for a single employee and upsert it into
    the FAISS employee index.  Returns the FAISS row index assigned.
    """
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not employee:
        raise ValueError(f"Employee {employee_id} not found")

    index = _load_or_create_index(EMPLOYEE_INDEX_PATH)
    vec = generate_employee_embedding(employee)
    if not FAISS_AVAILABLE:
        employee.embedding_index = 0
        db.commit()
        return 0
    if employee.embedding_index is not None:
        pass
    row_idx = index.ntotal
    index.add(vec)
    _save_index(index, EMPLOYEE_INDEX_PATH)
    employee.embedding_index = row_idx
    db.commit()
    return row_idx


def update_project_vector(project_id: int, db: Session) -> int:
    """
    (Re)compute the embedding for a project and store it in the FAISS
    project index.  Returns the assigned FAISS row index.
    """
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise ValueError(f"Project {project_id} not found")

    index = _load_or_create_index(PROJECT_INDEX_PATH)
    vec = generate_project_embedding(project)
    if not FAISS_AVAILABLE:
        project.embedding_reference = 0
        db.commit()
        return 0
    row_idx = index.ntotal
    index.add(vec)
    _save_index(index, PROJECT_INDEX_PATH)
    project.embedding_reference = row_idx
    db.commit()
    return row_idx


def get_employee_vector(embedding_index: int) -> Optional[np.ndarray]:
    """Retrieve employee embedding vector from FAISS by row index."""
    index = _load_or_create_index(EMPLOYEE_INDEX_PATH)
    if not FAISS_AVAILABLE:
        return np.zeros((1, EMBEDDING_DIM), dtype=np.float32)
    if embedding_index is None or embedding_index >= index.ntotal:
        return None
    return index.reconstruct(embedding_index).reshape(1, -1)


def get_project_vector(embedding_reference: int) -> Optional[np.ndarray]:
    """Retrieve project embedding vector from FAISS by row index."""
    index = _load_or_create_index(PROJECT_INDEX_PATH)
    if not FAISS_AVAILABLE:
        return np.zeros((1, EMBEDDING_DIM), dtype=np.float32)
    if embedding_reference is None or embedding_reference >= index.ntotal:
        return None
    return index.reconstruct(embedding_reference).reshape(1, -1)


def get_team_embedding(team_id: int, db: Session) -> Optional[np.ndarray]:
    """
    Compute weighted average embedding for a team.
    Team lead weight = 1.5; all other members weight = 1.0.
    Returns normalised 384-dim vector or None if team has no embeddings.
    """
    team = db.query(models.Team).filter(models.Team.team_id == team_id).first()
    if not team or not team.members:
        return None

    weighted_sum = np.zeros((1, EMBEDDING_DIM), dtype=np.float32)
    total_weight = 0.0

    for member in team.members:
        if member.embedding_index is None:
            continue
        vec = get_employee_vector(member.embedding_index)
        if vec is None:
            continue
        weight = 1.5 if member.id == team.team_lead_id else 1.0
        weighted_sum += weight * vec
        total_weight += weight

    if total_weight == 0:
        return None

    averaged = weighted_sum / total_weight
    return _normalize(averaged)


def compute_cosine_similarity(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
    """
    Cosine similarity between two normalised vectors (dot product = cosine for unit vecs).
    Returns a float in [0, 1].
    """
    vec_a = _normalize(vec_a.reshape(1, -1))
    vec_b = _normalize(vec_b.reshape(1, -1))
    return float(np.dot(vec_a, vec_b.T)[0, 0])
