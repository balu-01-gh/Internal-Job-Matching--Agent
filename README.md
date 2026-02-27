# KLH — AI Internal Team-Project Matching Platform

An AI-powered full-stack platform that matches **internal teams** to **new projects** using hybrid scoring:

| Weight | Component |
|--------|-----------|
| 40% | Embedding similarity (sentence-transformers + FAISS) |
| 30% | Skill coverage |
| 20% | Experience match |
| 10% | Team balance |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Backend | FastAPI, SQLAlchemy ORM, JWT Auth |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Vector DB | FAISS (IndexFlatIP — cosine via L2-normalised inner product) |
| Embeddings | sentence-transformers `all-MiniLM-L6-v2` (384-dim) |
| Resume Parsing | pdfplumber + spaCy |

---

## Project Structure

```
KLH/
├── backend/
│   ├── app/
│   │   ├── main.py            ← FastAPI app, CORS, router registration
│   │   ├── database.py        ← SQLAlchemy engine + session + Base
│   │   ├── models.py          ← ORM models: Team, Employee, Project, Application
│   │   ├── schemas.py         ← Pydantic v2 request/response schemas
│   │   ├── auth.py            ← JWT creation, password hashing, role guards
│   │   ├── routes/
│   │   │   ├── employee.py    ← Signup, login, resume upload, top projects
│   │   │   ├── team.py        ← Team CRUD, heatmap, skill-gap
│   │   │   ├── project.py     ← Project CRUD + embedding trigger
│   │   │   └── hr.py          ← Team ranking, evaluation, details
│   │   └── services/
│   │       ├── embedding_service.py  ← FAISS + sentence-transformers
│   │       ├── matching_service.py   ← Hybrid scoring engine
│   │       └── team_service.py       ← Team utilities, heatmap data
│   ├── seed.py                ← Realistic dummy data (3 teams, 12 employees, 6 projects)
│   ├── .env                   ← Environment config
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── App.jsx             ← Router with role-based guards
    │   ├── services/api.js     ← Axios client + all API calls
    │   ├── components/
    │   │   ├── Layout.jsx      ← Navbar + sidebar shell
    │   │   ├── ScoreBar.jsx    ← Animated progress bar
    │   │   └── SkillBadge.jsx  ← Coloured skill pill
    │   └── pages/
    │       ├── LoginPage.jsx
    │       ├── SignupPage.jsx
    │       ├── employee/
    │       │   ├── Dashboard.jsx     ← Top 5 projects + radar chart
    │       │   └── SkillGapPage.jsx  ← Gap analysis per project
    │       ├── teamlead/
    │       │   ├── TeamOverviewPage.jsx  ← Member cards
    │       │   └── SkillHeatmapPage.jsx  ← Grid heatmap
    │       └── hr/
    │           ├── AddProjectPage.jsx    ← Create project form + project list
    │           ├── RankTeamsPage.jsx     ← Top 5 teams + bar chart
    │           └── TeamDetailsPage.jsx   ← Team deep-dive + pie chart
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

---

## Quick Start

### 1. Backend setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Download spaCy English model
python -m spacy download en_core_web_sm

# Seed database with realistic dummy data
python seed.py

# Start API server
uvicorn app.main:app --reload
```

API available at: http://localhost:8000  
Interactive docs: http://localhost:8000/docs

### 2. Frontend setup

```bash
cd frontend

# Install Node dependencies
npm install

# Start development server
npm run dev
```

Frontend available at: http://localhost:3000

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| HR | hr@klh.com | hr123 |
| Team Lead (Alpha Squad) | arjun@klh.com | pass123 |
| Team Lead (Beta Brains) | sameer@klh.com | pass123 |
| Team Lead (Gamma Force) | vikram@klh.com | pass123 |
| Employee | meera@klh.com | pass123 |
| Employee | kavya@klh.com | pass123 |

---

## User Flows

### Employee
1. Login → auto-redirected to Dashboard
2. See **Top 5 matching projects** with match % and skill gap
3. Upload a PDF resume → auto-parsed and embedding regenerated
4. Visit **Skill Gap page** for detailed per-project analysis

### Team Lead
1. Login → Team Overview: see all members, their skills and experience
2. Skill Heatmap: grid view showing which team members have which skills
3. Coverage percentage per skill across the team

### HR
1. Login → Add Project form
2. Create project → embedding generated automatically via FAISS
3. Click **Evaluate Teams** → Top 5 teams ranked with:
   - Composite match score breakdown bar chart
   - Per-team score bars (embedding, skill, experience, balance)
4. Click **View Details** → Team deep-dive with pie chart

---

## Matching Formula

```
final_score = 0.4 × embedding_similarity
            + 0.3 × skill_coverage
            + 0.2 × experience_match
            + 0.1 × team_balance
```

- **Embedding similarity**: cosine similarity between team weighted-average embedding and project embedding (team lead weight = 1.5×)
- **Skill coverage**: `|required ∩ team_skills| / |required|`
- **Experience match**: `min(avg_team_experience / required_experience, 1.0)`
- **Team balance**: `unique_skills / total_skills` across team

---

## PostgreSQL (Production)

Update `.env`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/klh_db
```

Then run: `alembic upgrade head` (after adding Alembic migrations).

---

## API Endpoints Summary

| Method | Path | Role |
|--------|------|------|
| POST | /api/employee/signup | Public |
| POST | /api/employee/login | Public |
| GET | /api/employee/me | Any |
| GET | /api/employee/top-projects | Any |
| POST | /api/employee/upload-resume | Any |
| GET | /api/team/{id}/heatmap | Team Lead / HR |
| GET | /api/project/ | Public |
| POST | /api/project/ | HR |
| GET | /api/hr/top-teams/{project_id} | HR |
| POST | /api/hr/evaluate/{project_id} | HR |
| GET | /api/hr/team-details/{team_id} | HR |
