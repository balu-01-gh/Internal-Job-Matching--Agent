# KLH Match — AI-Powered Team-Project Matching Platform

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

A full-stack platform that matches **internal teams** to **new projects** using hybrid AI scoring with sentence embeddings, skill analysis, and team balance metrics.

| Weight | Component |
|--------|-----------|
| 40% | Embedding similarity (sentence-transformers + FAISS) |
| 30% | Skill coverage |
| 20% | Experience match |
| 10% | Team balance |

---

## Project Structure

```
KLH/
├── backend/
│   ├── app/
│   │   ├── main.py              ← FastAPI app, CORS, router registration
│   │   ├── config.py            ← Pydantic settings (env-driven)
│   │   ├── database.py          ← SQLAlchemy engine, multi-tenant HR sessions
│   │   ├── models.py            ← ORM: Team, Employee, Project, Application
│   │   ├── schemas.py           ← Pydantic v2 request/response schemas
│   │   ├── auth.py              ← JWT, password hashing, role guards
│   │   ├── google_auth.py       ← Google OAuth 2.0 flow
│   │   ├── cache.py             ← TTL cache with async locking
│   │   ├── exceptions.py        ← Custom exception handlers
│   │   ├── security_log.py      ← Security audit logging
│   │   ├── admin_tools.py       ← Admin utilities
│   │   ├── supabase_client.py   ← Supabase integration
│   │   ├── middleware/
│   │   │   ├── rate_limiter.py  ← Token-bucket rate limiting
│   │   │   ├── request_logger.py← Request logging middleware
│   │   │   └── security_headers.py ← Security response headers
│   │   ├── routes/
│   │   │   ├── employee.py      ← Login, profile, resume upload, top projects
│   │   │   ├── register.py      ← Signup for employee, team lead, HR
│   │   │   ├── team.py          ← Team CRUD, heatmap, skill-gap
│   │   │   ├── project.py       ← Project CRUD, embedding trigger
│   │   │   └── hr.py            ← Team ranking, evaluation, details
│   │   └── services/
│   │       ├── embedding_service.py  ← FAISS + sentence-transformers
│   │       ├── matching_service.py   ← Hybrid scoring engine
│   │       └── team_service.py       ← Team utilities, heatmap data
│   ├── alembic/                 ← Database migrations
│   ├── tests/                   ← pytest test suite (46 tests)
│   ├── seed.py                  ← Demo data seeder
│   ├── requirements.txt
│   └── .env                     ← Environment config
│
└── frontend/
    ├── src/
    │   ├── App.jsx              ← Router with role-based guards
    │   ├── services/
    │   │   ├── api.js           ← Axios client + all API modules
    │   │   └── supabase.js      ← Supabase client
    │   ├── context/
    │   │   ├── ThemeContext.jsx  ← Dark/light mode
    │   │   └── ToastContext.jsx  ← Global notifications
    │   ├── components/
    │   │   ├── Layout.jsx               ← Navbar + sidebar shell
    │   │   ├── GoogleSignIn.jsx         ← Google OAuth button + callback
    │   │   ├── AdvancedSearch.jsx       ← Search with filters & suggestions
    │   │   ├── AssignmentHistory.jsx    ← Assignment tracking
    │   │   ├── MatchExplanation.jsx     ← Why teams match projects
    │   │   ├── NotificationCenter.jsx   ← Real-time notifications
    │   │   ├── Pagination.jsx           ← Dynamic pagination
    │   │   ├── ProjectFeedback.jsx      ← Rating & review system
    │   │   ├── ReportExport.jsx         ← PDF/Excel/CSV exports
    │   │   ├── ScoreBar.jsx             ← Animated progress bar
    │   │   ├── SearchBar.jsx            ← Simple search input
    │   │   ├── SkeletonLoader.jsx       ← 10+ loading skeletons
    │   │   ├── SkillBadge.jsx           ← Skill pill component
    │   │   ├── SkillHeatmap.jsx         ← Team skill grid
    │   │   ├── SkipLink.jsx             ← Accessibility skip nav
    │   │   ├── TeamAssignmentWorkflow.jsx ← 4-step assignment wizard
    │   │   ├── TeamFilter.jsx           ← Multi-criteria team filter
    │   │   ├── TeamScenarioSimulator.jsx ← What-if analysis
    │   │   ├── Toast.jsx                ← Notification toast
    │   │   └── ToastContainer.jsx       ← Toast stack manager
    │   ├── hooks/
    │   │   ├── useA11y.js       ← Accessibility helpers
    │   │   ├── useDebounce.js   ← Debounce hook
    │   │   ├── useLocalStorage.js ← Persistent state
    │   │   └── useRealtime.js   ← Real-time subscriptions
    │   ├── utils/
    │   │   ├── csvExport.js     ← CSV export utilities
    │   │   ├── exportUtils.js   ← PDF/Excel helpers
    │   │   ├── jwt.js           ← Token decode utility
    │   │   ├── usePagination.js ← Pagination hooks
    │   │   └── useSearch.js     ← Search/fuzzy-match hooks
    │   └── pages/
    │       ├── LoginPage.jsx
    │       ├── SignupPage.jsx
    │       ├── employee/
    │       │   ├── Dashboard.jsx        ← Top 5 projects + radar chart
    │       │   ├── ResumeUploadPage.jsx ← PDF resume upload + parsing
    │       │   └── SkillGapPage.jsx     ← Per-project gap analysis
    │       ├── teamlead/
    │       │   ├── TeamOverviewPage.jsx ← Member cards
    │       │   └── SkillHeatmapPage.jsx ← Skill grid heatmap
    │       └── hr/
    │           ├── AddProjectPage.jsx   ← Create project + project list
    │           ├── RankTeamsPage.jsx    ← Top 5 teams + bar chart
    │           └── TeamDetailsPage.jsx  ← Team deep-dive + pie chart
    ├── .env                     ← Frontend env (VITE_GOOGLE_CLIENT_ID)
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

---

## Quick Start

### 1. Backend

```bash
cd backend

# Create virtual environment (optional)
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Seed database with demo data
python seed.py

# Start API server
python -m uvicorn app.main:app --reload --port 8000
```

API: http://localhost:8000  
Docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5175

### 3. Environment Variables

**backend/.env**
```env
DATABASE_URL=sqlite:///./klh.db
SECRET_KEY=<your-secret-key>
ACCESS_TOKEN_EXPIRE_MINUTES=60
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_REDIRECT_URI=http://localhost:5175/auth/google/callback
```

**frontend/.env**
```env
VITE_GOOGLE_CLIENT_ID=<your-google-client-id>
VITE_API_URL=http://localhost:8000
```

---

## Demo Accounts

| Role | Email | Password | HR ID |
|------|-------|----------|-------|
| HR | hr@klh.com | hr123 | HR001 |
| Team Lead (Alpha Squad) | arjun@klh.com | pass123 | HR001 |
| Team Lead (Beta Brains) | sameer@klh.com | pass123 | HR001 |
| Team Lead (Gamma Force) | vikram@klh.com | pass123 | HR001 |
| Employee | meera@klh.com | pass123 | HR001 |
| Employee | kavya@klh.com | pass123 | HR001 |

---

## User Flows

### Employee
1. Login → auto-redirected to Resume Upload (if first time) → Dashboard
2. See **Top 5 matching projects** with match % and skill breakdown
3. Upload PDF resume → auto-parsed, skills extracted, embedding regenerated
4. Visit **Skill Gap** page for per-project gap analysis

### Team Lead
1. Login → Team Overview: member cards with skills and experience
2. Skill Heatmap: grid showing skill distribution across team members
3. Coverage percentage per skill

### HR
1. Login → Add Project form + existing project list
2. Create project → embedding generated automatically via FAISS
3. Click **Evaluate Teams** → Top 5 teams ranked with composite score breakdown
4. Click **View Details** → Team deep-dive with pie chart

### Google OAuth
1. Click "Continue with Google" on login page
2. Select Google account → verified server-side
3. Auto-creates account if new, links if existing email matches
4. Redirects based on role

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/employee/login` | Public | JWT login |
| GET | `/api/employee/me` | Bearer | Get current user profile |
| PUT | `/api/employee/me` | Bearer | Update profile |
| POST | `/api/employee/upload-resume` | Bearer | Upload PDF resume |
| GET | `/api/employee/top-projects` | Bearer | Top 5 matching projects |
| POST | `/api/employee/update-embedding` | Bearer | Regenerate embedding |
| GET | `/api/team/` | Bearer | List teams |
| POST | `/api/team/` | Bearer | Create team |
| GET | `/api/team/{id}` | Bearer | Team details |
| GET | `/api/team/{id}/members` | Bearer | Team members |
| GET | `/api/team/{id}/heatmap` | Bearer | Skill heatmap data |
| GET | `/api/team/{id}/skill-gap/{emp_id}` | Bearer | Employee skill gap |
| GET | `/api/project/` | Bearer | List projects |
| GET | `/api/project/{id}` | Bearer | Project details |
| POST | `/api/project/` | HR | Create project |
| PUT | `/api/project/{id}` | HR | Update project |
| DELETE | `/api/project/{id}` | HR | Delete project |
| POST | `/api/project/{id}/embed` | HR | Generate project embedding |
| GET | `/api/hr/rank-teams/{project_id}` | HR | Rank teams for project |
| GET | `/api/hr/top-teams/{project_id}` | HR | Top 5 teams |
| GET | `/api/hr/team-details/{team_id}` | HR | Team deep-dive |
| GET | `/api/hr/teams` | HR | All teams list |
| GET | `/api/hr/applications/{project_id}` | HR | Project applications |
| POST | `/api/hr/evaluate/{project_id}` | HR | Run team evaluation |
| POST | `/api/register/employee` | Public | Register employee |
| POST | `/api/register/teamlead` | Public | Register team lead |
| POST | `/api/register/hr` | Public | Register HR |
| GET | `/api/register/team-lookup/{code}` | Public | Lookup team by code |
| GET | `/api/auth/google/login-url` | Public | Get Google OAuth URL |
| POST | `/api/auth/google/callback` | Public | Google OAuth callback |
| POST | `/api/auth/google/link` | Bearer | Link Google account |

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

## Architecture

### Multi-Tenant Database
Each HR user gets an isolated SQLite database (`hr_{hr_id}.db`) containing their teams, employees, and projects. JWT tokens carry the `hr_id` claim for routing to the correct database.

### Authentication
- **JWT Bearer tokens** with role-based access control (`hr`, `team_lead`, `employee`)
- **Google OAuth 2.0** with authorization code flow
- **Rate limiting**: 10 login attempts/min, 100 general requests/min
- Password hashing via bcrypt

### Middleware Stack
- Rate limiter (token bucket)
- Request logger
- Security headers (CSP, HSTS, X-Frame-Options)
- CORS configuration

---

## Testing

```bash
cd backend
python -m pytest tests/ -q --tb=short
```

46 tests covering: authentication, API endpoints, caching, error handling.

---

## Features

### Core
- AI-powered team-project matching with hybrid scoring
- Multi-role auth (HR, Team Lead, Employee) + Google OAuth
- PDF resume upload with auto skill extraction
- Multi-tenant HR database isolation

### Analytics & Visualization
- Interactive skill heatmaps
- Radar charts for project match breakdown
- Team scenario simulator (what-if analysis)
- Match explanations with recommendations

### UI/UX
- Responsive design (mobile, tablet, desktop)
- Dark/light mode with system preference detection
- Toast notifications (success, error, info, warning)
- Skeleton loaders for all data views
- Advanced search with fuzzy matching and filters
- Dynamic pagination with configurable page sizes
- Accessibility (skip links, ARIA, keyboard nav)

### Data Export
- CSV export (employees, projects, skill matrix, team performance)
- PDF/Excel report generation
- Assignment tracking and history

### Admin & Ops
- Team assignment workflow (4-step wizard)
- Project feedback and rating system
- Security audit logging
- Real-time notification center
