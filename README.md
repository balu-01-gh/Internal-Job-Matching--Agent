# KLH Match -- AI-Powered Internal Job Matching Agent

> A production-grade full-stack platform that intelligently matches **internal employee teams** to **projects** using hybrid AI scoring -- combining sentence embeddings, skill analysis, and team balance metrics.

## Tech Stack

### Frontend
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&style=flat-square)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white&style=flat-square)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square)
![Recharts](https://img.shields.io/badge/Recharts-2-22B5BF?style=flat-square)
![Axios](https://img.shields.io/badge/Axios-1-5A29E4?logo=axios&logoColor=white&style=flat-square)

### Backend
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi&logoColor=white&style=flat-square)
![Python](https://img.shields.io/badge/Python-3.10-3776AB?logo=python&logoColor=white&style=flat-square)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00?style=flat-square)
![Pydantic](https://img.shields.io/badge/Pydantic-v2-E92063?logo=pydantic&logoColor=white&style=flat-square)

### AI / ML
![FAISS](https://img.shields.io/badge/FAISS-IndexFlatIP-0467DF?style=flat-square)
![sentence-transformers](https://img.shields.io/badge/sentence--transformers-all--MiniLM--L6--v2_(384d)-FF6F00?style=flat-square)
![spaCy](https://img.shields.io/badge/spaCy-NLP_resume_parsing-09A3D5?logo=spacy&logoColor=white&style=flat-square)

### Auth & Security
![JWT](https://img.shields.io/badge/JWT-python--jose-000000?logo=jsonwebtokens&logoColor=white&style=flat-square)
![bcrypt](https://img.shields.io/badge/bcrypt-password_hashing-4A90D9?style=flat-square)
![Google OAuth](https://img.shields.io/badge/Google_OAuth-2.0-4285F4?logo=google&logoColor=white&style=flat-square)

### Database & Storage
![SQLite](https://img.shields.io/badge/SQLite-multi--tenant-003B57?logo=sqlite&logoColor=white&style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-production-4169E1?logo=postgresql&logoColor=white&style=flat-square)

### DevOps & Testing
![Docker](https://img.shields.io/badge/Docker-compose-2496ED?logo=docker&logoColor=white&style=flat-square)
![pytest](https://img.shields.io/badge/pytest-46_tests-0A9EDC?logo=pytest&logoColor=white&style=flat-square)
![Vitest](https://img.shields.io/badge/Vitest-frontend_tests-6E9F18?logo=vitest&logoColor=white&style=flat-square)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-CI%2FCD-2088FF?logo=githubactions&logoColor=white&style=flat-square)

---

## What This Project Demonstrates

This project was built end-to-end as a showcase of full-stack engineering and applied AI -- covering system design, REST API development, ML integration, multi-tenant architecture, security, testing, and deployment.

| Area | What Was Built |
|---|---|
| **AI / NLP** | FAISS vector search with sentence-transformer embeddings (384-dim); PDF resume parsing with spaCy NER |
| **System Design** | Multi-tenant SQLite isolation per HR organisation; thread-safe engine cache with double-checked locking |
| **Backend** | FastAPI with 30+ endpoints; Pydantic v2 validation; SQLAlchemy 2.0 ORM; Alembic migrations |
| **Security** | JWT RBAC (3 roles); Google OAuth 2.0; bcrypt hashing; token-bucket rate limiting; CSP/HSTS headers |
| **Frontend** | React 18 SPA; role-based routing; dark/light mode; responsive design; accessibility (WCAG) |
| **Testing** | 46 pytest tests (backend); Vitest + React Testing Library (frontend); CI via GitHub Actions |
| **DevOps** | Multi-stage Dockerfiles; docker-compose with health-check dependency; `.env`-driven config |

---

## How the AI Matching Works

Each team and project is represented as a **384-dimensional vector** using `sentence-transformers/all-MiniLM-L6-v2`. Matching uses a weighted hybrid score:

```
final_score = 0.4 x embedding_similarity
            + 0.3 x skill_coverage
            + 0.2 x experience_match
            + 0.1 x team_balance
```

| Component | Method |
|---|---|
| **Embedding similarity** | Cosine similarity via FAISS IndexFlatIP on L2-normalised vectors; team lead weighted 1.5x |
| **Skill coverage** | `\|required ∩ team_skills\| / \|required\|` |
| **Experience match** | `min(avg_team_exp / required_exp, 1.0)` |
| **Team balance** | `unique_skills / total_skills` across all members |

Resume PDFs are parsed with `pdfplumber` + spaCy to extract skills, then the employee's embedding is recomputed and stored in the FAISS index automatically.

---

## Key Engineering Decisions

- **Multi-tenant isolation** -- Each HR organisation gets a dedicated SQLite file (`hr_{hr_id}.db`). The JWT carries the `hr_id` claim so every request routes to the correct database with zero cross-tenant data leakage.
- **Thread-safe engine cache** -- `get_hr_db()` uses double-checked locking with `threading.Lock()` and `NullPool` to prevent stale connection reuse while caching the `sessionmaker` per tenant.
- **Async-safe TTL cache** -- In-memory result caching with async locking prevents cache stampede under concurrent requests.
- **Security middleware stack** -- Token-bucket rate limiter -> request logger -> security headers (CSP, HSTS, X-Frame-Options) applied globally across all routes.
- **Role-based access control** -- Three roles (`hr`, `team_lead`, `employee`) enforced at the FastAPI dependency level via JWT claims, not just in business logic.

---

## Features

### Core
- AI-powered team-to-project matching with explainable composite scoring
- PDF resume upload -> NLP skill extraction -> automatic FAISS embedding update
- Multi-role system: HR Admin, Team Lead, Employee -- each with a dedicated dashboard
- Multi-tenant HR database isolation per organisation
- Google OAuth 2.0 sign-in and account linking

### HR Dashboard
- Create and manage projects with auto-generated FAISS embeddings
- Rank all teams for a project with score breakdown (bar chart)
- Team deep-dive: members, skills, experience, pie chart visualisation
- Run evaluations and manage project applications

### Team Lead Dashboard
- Team overview with member skill cards and experience levels
- Interactive skill heatmap showing coverage across all team members
- Per-employee skill gap analysis relative to specific projects

### Employee Dashboard
- Top 5 AI-matched projects with match percentage and skill overlap breakdown
- Per-project skill gap page with actionable recommendations
- PDF resume upload with instant skill extraction and embedding refresh

### UI/UX
- Fully responsive (mobile, tablet, desktop)
- Dark/light mode with OS preference detection
- Skeleton loaders, toast notifications, advanced fuzzy search with filters
- Accessibility: skip links, ARIA labels, full keyboard navigation (WCAG-compliant)

### Data & Exports
- CSV export: employees, projects, skill matrix, team performance reports
- PDF/Excel report generation
- Assignment history tracking and audit logs
- Real-time notification centre

---

## Quick Start

### Prerequisites
- Python 3.10+ and Node.js 18+

### 1. Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS / Linux

# Install dependencies
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Seed demo data (creates klh.db + hr_HR001.db with 13 accounts)
python seed.py

# Start API server
uvicorn app.main:app --reload --port 8000
```

- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

- App: http://localhost:5175

### 3. Docker (full stack)

```bash
docker-compose up --build
```

### 4. Environment Variables

**`backend/.env`**
```env
DATABASE_URL=sqlite:///./klh.db
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=60
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5175/auth/google/callback
```

**`frontend/.env`**
```env
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

---

## Demo Accounts

Use **HR ID `HR001`** for all demo logins.

| Role | Email | Password |
|---|---|---|
| HR Admin | hr@klh.com | hr123 |
| Team Lead -- Alpha Squad | arjun@klh.com | pass123 |
| Team Lead -- Beta Brains | sameer@klh.com | pass123 |
| Team Lead -- Gamma Force | vikram@klh.com | pass123 |
| Employee | meera@klh.com | pass123 |
| Employee | kavya@klh.com | pass123 |

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/employee/login` | Public | JWT login (email/username + HR ID) |
| GET | `/api/employee/me` | Bearer | Get current user profile |
| PUT | `/api/employee/me` | Bearer | Update profile |
| POST | `/api/employee/upload-resume` | Bearer | Upload PDF, extract skills, update embedding |
| GET | `/api/employee/top-projects` | Bearer | Top 5 AI-matched projects |
| POST | `/api/employee/update-embedding` | Bearer | Manually regenerate FAISS embedding |
| GET | `/api/team/` | Bearer | List all teams |
| POST | `/api/team/` | Bearer | Create a team |
| GET | `/api/team/{id}/heatmap` | Bearer | Skill heatmap data |
| GET | `/api/team/{id}/skill-gap/{emp_id}` | Bearer | Per-employee skill gap |
| GET | `/api/project/` | Bearer | List all projects |
| POST | `/api/project/` | HR | Create project + trigger embedding |
| GET | `/api/hr/rank-teams/{project_id}` | HR | Rank all teams by AI score |
| GET | `/api/hr/top-teams/{project_id}` | HR | Top 5 matched teams |
| POST | `/api/hr/evaluate/{project_id}` | HR | Run full team evaluation |
| GET | `/api/hr/team-details/{team_id}` | HR | Team deep-dive |
| POST | `/api/register/employee` | Public | Register new employee |
| POST | `/api/register/teamlead` | Public | Register team lead |
| POST | `/api/register/hr` | Public | Register HR admin |
| GET | `/api/auth/google/login-url` | Public | Google OAuth redirect URL |
| POST | `/api/auth/google/callback` | Public | Google OAuth callback |
| POST | `/api/auth/google/link` | Bearer | Link Google to existing account |
| GET | `/health` | Public | Health check |
| GET | `/ready` | Public | Readiness probe (DB + cache) |

---

## Testing

```bash
# Backend -- 46 tests
cd backend
pytest tests/ -v --tb=short

# Frontend
cd frontend
npm run test
```

Test coverage: JWT authentication, all API endpoints, cache behaviour, error handling, React UI components.

---

## Project Structure

```
KLH/
  backend/
    app/
      main.py              -- FastAPI app entry point
      config.py            -- Pydantic settings (env-driven)
      database.py          -- Multi-tenant engine cache, session routing
      models.py            -- SQLAlchemy ORM models
      schemas.py           -- Pydantic v2 request/response schemas
      auth.py              -- JWT, bcrypt, role guards
      google_auth.py       -- Google OAuth 2.0
      cache.py             -- Async TTL cache
      middleware/
        rate_limiter.py    -- Token-bucket rate limiting
        request_logger.py
        security_headers.py
      routes/
        employee.py        -- Login, profile, resume, top-projects
        register.py        -- Signup flows
        team.py            -- CRUD, heatmap, skill-gap
        project.py         -- CRUD + embedding trigger
        hr.py              -- Ranking, evaluation, details
      services/
        embedding_service.py  -- FAISS + sentence-transformers
        matching_service.py   -- Hybrid scoring engine
        team_service.py       -- Heatmap, skill aggregation
    alembic/               -- Database migrations
    tests/                 -- 46 pytest tests
    seed.py                -- Demo data seeder
    requirements.txt

  frontend/
    src/
      pages/
        employee/          -- Dashboard, Resume Upload, Skill Gap
        teamlead/          -- Team Overview, Skill Heatmap
        hr/                -- Add Project, Rank Teams, Team Details
      components/          -- 20+ reusable UI components
      hooks/               -- useDebounce, useRealtime, useA11y
      context/             -- Theme + Toast context providers
      services/            -- Axios API client, Supabase client

  docker-compose.yml
  .github/workflows/ci.yml -- GitHub Actions CI/CD pipeline
```
---

