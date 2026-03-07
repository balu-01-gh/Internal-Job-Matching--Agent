"""
seed.py - Populates the database with realistic dummy data for testing.
Run with:  python seed.py   (from the backend/ directory)
"""

import sys
import os

# Ensure app module is importable from backend/
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app import models
from app.auth import hash_password
from app.services.embedding_service import update_employee_vector, update_project_vector

# Reset all tables
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

db = SessionLocal()

print("🌱 Seeding database...")

# ─────────────────────────────────────────────────────────────
# HR User
# ─────────────────────────────────────────────────────────────
hr_user = models.Employee(
    emp_id="HR001",
    username="hr_admin",
    name="Priya Sharma",
    email="hr@klh.com",
    password_hash=hash_password("hr123"),
    skills=["Recruitment", "Project Management", "HR Analytics"],
    experience=8.0,
    projects=["HR Transformation", "Talent Portal"],
    certifications=["SHRM-CP", "PMP"],
    role="hr",
    resume_uploaded=True,
)
db.add(hr_user)
db.commit()
db.refresh(hr_user)
print(f"  ✓ HR user: {hr_user.email}")

# ─────────────────────────────────────────────────────────────
# Teams
# ─────────────────────────────────────────────────────────────
teams_data = [
    {"name": "Alpha Squad",  "code": "ALPHA01"},
    {"name": "Beta Brains",   "code": "BETA02"},
    {"name": "Gamma Force",  "code": "GAMMA03"},
]
teams = []
for t in teams_data:
    team = models.Team(team_name=t["name"], team_code=t["code"])
    db.add(team)
    db.commit()
    db.refresh(team)
    teams.append(team)
print(f"  ✓ {len(teams)} teams created")

# ─────────────────────────────────────────────────────────────
# Employees per team
# ─────────────────────────────────────────────────────────────
employees_data = [
    # ── Alpha Squad ─────────────────────────────────────────────
    {
        "emp_id": "LEAD001", "username": "arjun_lead",
        "name": "Arjun Patel", "email": "arjun@klh.com", "password": "pass123",
        "skills": ["Python", "FastAPI", "Machine Learning", "PostgreSQL", "Docker"],
        "experience": 5.0,
        "projects": ["Recommendation Engine", "Data Pipeline"],
        "certifications": ["AWS Certified Developer", "TensorFlow Developer"],
        "role": "team_lead",
        "team_idx": 0,
    },
    {
        "emp_id": "EMP001", "username": "meera_dev",
        "name": "Meera Krishnan", "email": "meera@klh.com", "password": "pass123",
        "skills": ["React", "TypeScript", "Tailwind CSS", "Next.js", "GraphQL"],
        "experience": 3.5,
        "projects": ["E-commerce UI", "Admin Dashboard"],
        "certifications": ["Meta Frontend Developer"],
        "role": "employee",
        "team_idx": 0,
    },
    {
        "emp_id": "EMP002", "username": "rohit_analyst",
        "name": "Rohit Singh", "email": "rohit@klh.com", "password": "pass123",
        "skills": ["Python", "Data Analysis", "Pandas", "NumPy", "Tableau"],
        "experience": 4.0,
        "projects": ["Sales Analytics", "Financial Reporting"],
        "certifications": ["Google Data Analytics"],
        "role": "employee",
        "team_idx": 0,
    },
    {
        "emp_id": "EMP003", "username": "kavya_nlp",
        "name": "Kavya Reddy", "email": "kavya@klh.com", "password": "pass123",
        "password": "pass123",
        "skills": ["NLP", "spaCy", "BERT", "Python", "scikit-learn"],
        "experience": 2.5,
        "projects": ["Chatbot", "Sentiment Analysis Tool"],
        "certifications": ["Hugging Face NLP"],
        "role": "employee",
        "team_idx": 0,
    },
    # ── Beta Brains ──────────────────────────────────────────────
    {
        "emp_id": "LEAD002", "username": "sameer_lead",
        "name": "Sameer Nair", "email": "sameer@klh.com", "password": "pass123",
        "skills": ["Java", "Spring Boot", "Microservices", "Kubernetes", "Kafka"],
        "experience": 6.0,
        "projects": ["Payment Gateway", "Order Management System"],
        "certifications": ["Java SE 11", "CKA"],
        "role": "team_lead",
        "team_idx": 1,
    },
    {
        "emp_id": "EMP004", "username": "divya_banking",
        "name": "Divya Iyer", "email": "divya@klh.com", "password": "pass123",
        "skills": ["Angular", "Java", "SQL", "REST APIs", "Azure"],
        "experience": 4.0,
        "projects": ["Banking Portal", "Loan Management"],
        "certifications": ["AZ-204"],
        "role": "employee",
        "team_idx": 1,
    },
    {
        "emp_id": "EMP005", "username": "kiran_devops",
        "name": "Kiran Mehta", "email": "kiran@klh.com", "password": "pass123",
        "skills": ["DevOps", "Terraform", "AWS", "CI/CD", "Docker", "Kubernetes"],
        "experience": 5.5,
        "projects": ["Cloud Migration", "Infrastructure Automation"],
        "certifications": ["AWS Solutions Architect", "Terraform Associate"],
        "role": "employee",
        "team_idx": 1,
    },
    {
        "emp_id": "EMP006", "username": "anjali_qa",
        "name": "Anjali Verma", "email": "anjali@klh.com", "password": "pass123",
        "skills": ["QA", "Selenium", "Pytest", "Postman", "JIRA"],
        "experience": 3.0,
        "projects": ["Regression Suite", "API Testing Framework"],
        "certifications": ["ISTQB Foundation"],
        "role": "employee",
        "team_idx": 1,
    },
    # ── Gamma Force ──────────────────────────────────────────────
    {
        "emp_id": "LEAD003", "username": "vikram_lead",
        "name": "Vikram Das", "email": "vikram@klh.com", "password": "pass123",
        "skills": ["React", "Node.js", "MongoDB", "Express", "Redis"],
        "experience": 4.5,
        "projects": ["Social Media App", "Real-time Dashboard"],
        "certifications": ["MongoDB Developer"],
        "role": "team_lead",
        "team_idx": 2,
    },
    {
        "emp_id": "EMP007", "username": "sneha_reports",
        "name": "Sneha Pillai", "email": "sneha@klh.com", "password": "pass123",
        "skills": ["Python", "Flask", "SQL", "Power BI", "Excel"],
        "experience": 2.0,
        "projects": ["Reporting Tool", "KPI Dashboard"],
        "certifications": ["Power BI Analyst"],
        "role": "employee",
        "team_idx": 2,
    },
    {
        "emp_id": "EMP008", "username": "rahul_fullstack",
        "name": "Rahul Gupta", "email": "rahul@klh.com", "password": "pass123",
        "skills": ["React", "Python", "FastAPI", "Docker", "Git"],
        "experience": 3.0,
        "projects": ["Student Portal", "Task Manager"],
        "certifications": ["Docker Certified Associate"],
        "role": "employee",
        "team_idx": 2,
    },
    {
        "emp_id": "EMP009", "username": "pooja_ux",
        "name": "Pooja Nambiar", "email": "pooja@klh.com", "password": "pass123",
        "skills": ["UI/UX", "Figma", "React", "CSS", "Accessibility"],
        "experience": 2.5,
        "projects": ["Design System", "Mobile Redesign"],
        "certifications": ["Google UX Design"],
        "role": "employee",
        "team_idx": 2,
    },
]

created_employees = []
for emp_data in employees_data:
    team_idx = emp_data.pop("team_idx")
    password = emp_data.pop("password")
    emp = models.Employee(
        emp_id=emp_data.get("emp_id"),
        username=emp_data.get("username"),
        name=emp_data["name"],
        email=emp_data["email"],
        password_hash=hash_password(password),
        skills=emp_data["skills"],
        experience=emp_data["experience"],
        projects=emp_data["projects"],
        certifications=emp_data["certifications"],
        role=emp_data["role"],
        team_id=teams[team_idx].team_id,
        resume_uploaded=True,  # seed data has skills already
    )
    db.add(emp)
    db.commit()
    db.refresh(emp)
    created_employees.append((emp, team_idx))

print(f"  ✓ {len(created_employees)} employees created")

# Assign team leads
for emp, team_idx in created_employees:
    if emp.role == "team_lead":
        teams[team_idx].team_lead_id = emp.id

db.commit()
print("  ✓ Team leads assigned")

# ─────────────────────────────────────────────────────────────
# Projects
# ─────────────────────────────────────────────────────────────
projects_data = [
    {
        "title": "AI Customer Support Chatbot",
        "description": (
            "Build an NLP-powered chatbot to automate customer support tickets. "
            "Requires integration with existing CRM using REST APIs."
        ),
        "required_skills": ["Python", "NLP", "FastAPI", "React", "spaCy"],
        "required_experience": 3.0,
    },
    {
        "title": "Cloud-Native Microservices Migration",
        "description": (
            "Migrate monolithic Java application to cloud-native microservices on Kubernetes. "
            "Includes CI/CD pipeline setup on Azure DevOps."
        ),
        "required_skills": ["Java", "Spring Boot", "Kubernetes", "Docker", "Azure", "Kafka"],
        "required_experience": 5.0,
    },
    {
        "title": "Real-Time Analytics Dashboard",
        "description": (
            "Develop a real-time business intelligence dashboard with live data streaming, "
            "interactive charts, and role-based access control."
        ),
        "required_skills": ["React", "Node.js", "Python", "Redis", "PostgreSQL", "Recharts"],
        "required_experience": 3.5,
    },
    {
        "title": "Automated Testing Framework",
        "description": (
            "Design and implement a comprehensive automated testing framework "
            "covering unit, integration, and E2E tests for web applications."
        ),
        "required_skills": ["Selenium", "Pytest", "Python", "CI/CD", "JIRA"],
        "required_experience": 2.5,
    },
    {
        "title": "Machine Learning Recommendation Engine",
        "description": (
            "Build a personalized product recommendation system using collaborative filtering "
            "and deep learning, served via FastAPI with PostgreSQL backend."
        ),
        "required_skills": ["Python", "Machine Learning", "FastAPI", "PostgreSQL", "Pandas", "scikit-learn"],
        "required_experience": 4.0,
    },
    {
        "title": "Internal HR Portal Redesign",
        "description": (
            "Redesign the internal HR portal with modern UI/UX, improved accessibility, "
            "and mobile responsiveness using React and Tailwind CSS."
        ),
        "required_skills": ["React", "Tailwind CSS", "Figma", "UI/UX", "TypeScript"],
        "required_experience": 2.0,
    },
]

created_projects = []
for proj_data in projects_data:
    project = models.Project(**proj_data)
    db.add(project)
    db.commit()
    db.refresh(project)
    created_projects.append(project)

print(f"  ✓ {len(created_projects)} projects created")

# ─────────────────────────────────────────────────────────────
# Generate embeddings for all employees and projects
# ─────────────────────────────────────────────────────────────
print("  ⏳ Generating embeddings (this may take a minute on first run)...")

for emp, _ in created_employees:
    try:
        update_employee_vector(emp.id, db)
    except Exception as e:
        print(f"    ⚠ Embedding failed for {emp.name}: {e}")

for emp in [hr_user]:
    try:
        update_employee_vector(emp.id, db)
    except Exception as e:
        print(f"    ⚠ Embedding failed for {emp.name}: {e}")

for project in created_projects:
    try:
        update_project_vector(project.id, db)
    except Exception as e:
        print(f"    ⚠ Embedding failed for {project.title}: {e}")

print("  ✓ Embeddings generated")

db.close()

import shutil
master_db = os.path.join(os.path.dirname(__file__), "klh.db")
demo_hr_db = os.path.join(os.path.dirname(__file__), "hr_HR001.db")
shutil.copy2(master_db, demo_hr_db)
print(f"  ✓ Copied klh.db to {os.path.basename(demo_hr_db)} for demo purposes")

print("\n✅ Seeding complete!")
print("\n📋 Login credentials:")
print("  HR:         hr@klh.com          / hr123       (username: hr_admin | HR ID: HR001)")
print("  Team Lead:  arjun@klh.com       / pass123     (username: arjun_lead | Team Code: ALPHA01 | Employee ID: LEAD001)")
print("  Team Lead:  sameer@klh.com      / pass123     (username: sameer_lead | Team Code: BETA02 | Employee ID: LEAD002)")
print("  Team Lead:  vikram@klh.com      / pass123     (username: vikram_lead | Team Code: GAMMA03 | Employee ID: LEAD003)")
print("  Employee:   meera@klh.com       / pass123     (username: meera_dev | Employee ID: EMP001)")
print("  Employee:   kavya@klh.com       / pass123     (username: kavya_nlp | Employee ID: EMP003)")
print("\n🚀 Run server: uvicorn app.main:app --reload")
