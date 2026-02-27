"""
models.py - SQLAlchemy ORM models for all database entities.
"""

from sqlalchemy import (
    Column, Integer, String, Float, ForeignKey,
    DateTime, JSON, Boolean, func
)
from sqlalchemy.orm import relationship
from app.database import Base


class Team(Base):
    """Represents a team of employees working together on projects."""
    __tablename__ = "teams"

    team_id = Column(Integer, primary_key=True, index=True)
    team_name = Column(String, nullable=False)
    team_code = Column(String, unique=True, nullable=True, index=True)  # custom join code set by team lead
    team_lead_id = Column(Integer, ForeignKey("employees.id"), nullable=True)

    # Relationships
    members = relationship(
        "Employee",
        back_populates="team",
        foreign_keys="Employee.team_id",
    )
    team_lead = relationship(
        "Employee",
        foreign_keys=[team_lead_id],
        post_update=True,  # Avoids circular FK insert conflicts
    )
    applications = relationship("Application", back_populates="team")


class Employee(Base):
    """
    Represents a platform user.
    Roles: 'employee' | 'team_lead' | 'hr'
    """
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    emp_id = Column(String, unique=True, nullable=True, index=True)  # custom employee / lead / hr ID
    username = Column(String, unique=True, nullable=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)

    # Stored as JSON arrays for SQLite/PostgreSQL compatibility
    skills = Column(JSON, default=list)          # e.g. ["Python", "FastAPI"]
    experience = Column(Float, default=0.0)       # years of experience
    projects = Column(JSON, default=list)         # past project titles
    certifications = Column(JSON, default=list)   # certification names

    role = Column(String, default="employee")     # employee | team_lead | hr
    team_id = Column(Integer, ForeignKey("teams.team_id"), nullable=True)

    resume_uploaded = Column(Boolean, default=False)  # True after first resume upload

    # FAISS vector index reference (row index in the FAISS index file)
    embedding_index = Column(Integer, nullable=True)

    # Relationships
    team = relationship(
        "Team",
        back_populates="members",
        foreign_keys=[team_id],
    )


class Project(Base):
    """Represents a project that teams can be matched to."""
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    required_skills = Column(JSON, default=list)      # e.g. ["React", "Node.js"]
    required_experience = Column(Float, default=1.0)  # minimum years

    # Reference to FAISS index row for the project embedding
    embedding_reference = Column(Integer, nullable=True)

    applications = relationship("Application", back_populates="project")


class Application(Base):
    """
    Records a team's evaluated match score against a project.
    Created/updated by the HR evaluation flow.
    """
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.team_id"), nullable=False)
    score = Column(Float, default=0.0)  # Final composite matching score [0, 1]
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    project = relationship("Project", back_populates="applications")
    team = relationship("Team", back_populates="applications")
