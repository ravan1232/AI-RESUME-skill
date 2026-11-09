# SkillBridge AI

**AI-Based Placement Readiness & Peer Skill Exchange Platform**

SkillBridge AI is an integrated enterprise platform designed to bridge the gap between academic preparation and industry placement readiness. It pairs an AI Placement Readiness Engine with an Autonomous Peer Skill Exchange Engine to create a closed-loop learning and career acceleration ecosystem.

---

## Architecture Highlights

```
+-----------------------------------------------------------------------------------+
|                            SkillBridge AI Frontend                                 |
|         React 18 + Vite + Tailwind CSS + Lucide Icons + Recharts + React Router   |
+-----------------------------------------------------------------------------------+
                                    |  (REST & WebSockets)
                                    v
+-----------------------------------------------------------------------------------+
|                            FastAPI Modular Backend                                |
|        - JWT Authentication & Role-Based Access Control (Student / Admin)        |
|        - PyPDF2 Resume Extraction Engine                                         |
|        - Deterministic ATS & Readiness Scoring Algorithms                         |
|        - Groq LLaMA 3.3/3.1 AI Intelligence Service                               |
|        - Autonomous Skill Gap to Peer Mentor Matcher                             |
+-----------------------------------------------------------------------------------+
                                    |  (Motor Async Client)
                                    v
+-----------------------------------------------------------------------------------+
|                            MongoDB Atlas Data Tier                                |
|   Users | Profiles | Resumes | Job Analyses | Skills | Exchanges | Sessions | Chat |
+-----------------------------------------------------------------------------------+
```

---

## Phase 1 Implementation Status: COMPLETED & VERIFIED

### Backend Core
- Modular FastAPI backend architecture with routers, schemas, dependencies, and database layers.
- Robust JWT authentication with bcrypt password hashing and 1440-minute session expiry.
- Role-based authorization (`student` vs `admin`) with strict permission checks.
- Dual-mode database layer supporting MongoDB Atlas via Motor, with high-performance asynchronous fallback datastore for offline development and testing.
- Endpoints implemented:
  * `GET /`: Platform status & database status
  * `GET /health`: Health check
  * `POST /api/v1/auth/register`: New user registration with automatic student profile initialization
  * `POST /api/v1/auth/login`: Credential validation & JWT token generation
  * `GET /api/v1/auth/me`: Protected token verification & user context
  * `GET /api/v1/students/profile`: Student profile with readiness scores & skill offerings
  * `PUT /api/v1/students/profile`: Update headline, bio, teaching skills, learning goals, and availability
  * `GET /api/v1/students/dashboard-stats`: Aggregate metrics for readiness, ATS score, and exchanges
- **Test Suite**: 11 out of 11 integration tests passed successfully.

### Frontend Client
- React 18 + Vite with clean white and navy-blue design theme.
- Responsive Navigation Bar with profile indicator, role badges, and logout flow.
- Collapsible sidebar with separate student and admin navigation trees.
- Interactive authentication forms (Login & Register) with demo auto-fill shortcuts for rapid evaluator testing.
- Real-time Toast notification system.
- Student Dashboard featuring:
  * Overall Placement Readiness progress score & radial visual
  * ATS Resume Score indicator
  * Skills Offered vs Skills Needed summary
  * 4-Step Critical Integration preview
- Student Profile manager supporting:
  * Academic info & headline editing
  * "Skills I Can Teach" manager with proficiency levels
  * "Skills I Want to Learn" manager with priority tags
  * Availability day toggle controls
- Admin Management console with KPI metrics and searchable student directory.

---

## Quickstart Guide

### 1. Backend Setup

```bash
cd backend

# (Optional) Setup Python virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Copy .env.example to .env and configure MongoDB Atlas / Groq keys if available
cp .env.example .env

# Run automated Phase 1 test suite
python tests/run_tests.py

# Run FastAPI server
python run.py
```
Backend will be live at `http://localhost:8000` with Swagger documentation at `http://localhost:8000/docs`.

### 2. Frontend Setup

```bash
cd frontend

# Install node packages
npm install

# Build production bundle
npm run build

# Run Vite development server
npm run dev
```
Frontend will be live at `http://localhost:5173`.

---

## Test Accounts

The following credentials can be used or tested via the "Demo Sign In" buttons on the login screen:
- **Student Account**: `sarah.connor@university.edu` / `SecurePassword123!`
- **Admin Account**: `admin@skillbridge.edu` / `AdminPassword2026!`

---

## Roadmap

- **Phase 1** (Done): Foundation, Core Architecture, JWT Auth, Role-Based Access, Base Dashboards, and Testing.
- **Phase 2**: Resume PDF Parsing (`PyPDF2`), Deterministic ATS Scoring, Job Description Gap Analyzer, and Personalized Roadmap Generator.
- **Phase 3**: Peer Skill Exchange Engine, Autonomous Matching between JD Missing Skills and Peer Mentors, Exchange Requests & Session Scheduler.
- **Phase 4**: Real-time WebSocket Peer Chat, AI Mock Interview with Groq LLaMA, and Skill Verification Assessment System.
- **Phase 5**: Admin Management Suite (Student moderation, skills catalog, question bank, platform analytics).
- **Phase 6**: Full End-to-End Testing, Comprehensive Documentation, and Production Deployment.

