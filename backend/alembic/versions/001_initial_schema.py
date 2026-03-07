"""Initial schema with indexes

Revision ID: 001
Revises: 
Create Date: 2026-03-02
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create teams table
    op.create_table(
        'teams',
        sa.Column('team_id', sa.Integer(), primary_key=True),
        sa.Column('team_name', sa.String(), nullable=False),
        sa.Column('team_code', sa.String(), unique=True, nullable=True),
        sa.Column('team_lead_id', sa.Integer(), nullable=True),
    )
    op.create_index('ix_teams_team_id', 'teams', ['team_id'])
    op.create_index('ix_teams_team_code', 'teams', ['team_code'])
    
    # Create employees table
    op.create_table(
        'employees',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('emp_id', sa.String(), unique=True, nullable=True),
        sa.Column('username', sa.String(), unique=True, nullable=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), unique=True, nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('skills', sa.JSON(), default=list),
        sa.Column('experience', sa.Float(), default=0.0),
        sa.Column('projects', sa.JSON(), default=list),
        sa.Column('certifications', sa.JSON(), default=list),
        sa.Column('role', sa.String(), default='employee'),
        sa.Column('team_id', sa.Integer(), sa.ForeignKey('teams.team_id'), nullable=True),
        sa.Column('resume_uploaded', sa.Boolean(), default=False),
        sa.Column('embedding_index', sa.Integer(), nullable=True),
    )
    op.create_index('ix_employees_id', 'employees', ['id'])
    op.create_index('ix_employees_emp_id', 'employees', ['emp_id'])
    op.create_index('ix_employees_email', 'employees', ['email'])
    op.create_index('ix_employees_username', 'employees', ['username'])
    op.create_index('ix_employees_role', 'employees', ['role'])
    op.create_index('ix_employees_team_id', 'employees', ['team_id'])
    
    # Create projects table
    op.create_table(
        'projects',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('required_skills', sa.JSON(), default=list),
        sa.Column('required_experience', sa.Float(), default=1.0),
        sa.Column('embedding_reference', sa.Integer(), nullable=True),
    )
    op.create_index('ix_projects_id', 'projects', ['id'])
    
    # Create applications table
    op.create_table(
        'applications',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('project_id', sa.Integer(), sa.ForeignKey('projects.id'), nullable=False),
        sa.Column('team_id', sa.Integer(), sa.ForeignKey('teams.team_id'), nullable=False),
        sa.Column('score', sa.Float(), default=0.0),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_applications_id', 'applications', ['id'])
    op.create_index('ix_applications_project_id', 'applications', ['project_id'])
    op.create_index('ix_applications_team_id', 'applications', ['team_id'])
    op.create_index('ix_applications_score', 'applications', ['score'])
    
    # Composite index for common queries
    op.create_index(
        'ix_applications_project_team',
        'applications',
        ['project_id', 'team_id'],
        unique=True,
    )
    
    # Add foreign key for team_lead_id after employees table exists
    op.create_foreign_key(
        'fk_teams_lead',
        'teams',
        'employees',
        ['team_lead_id'],
        ['id'],
    )


def downgrade() -> None:
    op.drop_constraint('fk_teams_lead', 'teams', type_='foreignkey')
    op.drop_table('applications')
    op.drop_table('projects')
    op.drop_table('employees')
    op.drop_table('teams')
