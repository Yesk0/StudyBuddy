# StudyBuddy

StudyBuddy is a web platform for university students to find people to study with.

In universities like KBTU, students can have the same courses but may not know each other. StudyBuddy helps students find study partners based on their courses and available time.

## Main Features

* Registration and login
* Student profile
* Add courses and available study time
* Find students with the same courses
* Send and accept study requests
* Chat with matched students
* Create study sessions

## How it works

1. Create an account.
2. Add your courses and available time.
3. Find students with similar courses and schedules.
4. Send a study request.
5. Start chatting and prepare for exams together.

## Getting Started

### Option 1: everything in Docker

Requires Docker Desktop.

```bash
docker compose up --build
```

Open http://localhost:8080. The API docs are at http://localhost:8000/docs.
Database migrations run automatically when the backend container starts.

### Option 2: local development

PostgreSQL runs in Docker; the backend and frontend run on your machine with hot reload.

```bash
# 1. Database (exposed on port 5433 so it does not clash with a local PostgreSQL)
docker compose up -d db

# 2. Backend
cd backend
python -m venv venv
venv\Scripts\activate            # macOS/Linux: source venv/bin/activate
pip install -r requirements-dev.txt
alembic upgrade head
uvicorn app.main:app --reload

# 3. Frontend (in a second terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` (including the WebSocket) to the backend.

Copy `backend/.env.example` to `backend/.env` to change settings. In particular, set
`SECRET_KEY` outside development, and set `ALLOWED_EMAIL_DOMAINS=kbtu.kz` to accept only
university emails.

### Checks

```bash
cd backend && pytest          # API tests (use SQLite, no database needed)
cd frontend && npm run lint && npm run build
```

## Architecture

**Frontend:** React + TypeScript + Vite, organised with Feature-Sliced Design.

| Layer | Contents |
| --- | --- |
| `app` | providers, routing and guards, WebSocket event handling, global styles |
| `pages` | auth, onboarding / edit profile, matches, requests, chats, sessions, profile |
| `widgets` | header, profile wizard, match list, request list, chat list and window, session list, reminder banner |
| `features` | sign in / sign up, log out, profile wizard steps, send / answer a request, send a message, propose / answer a session |
| `entities` | viewer, profile, course, match, study request, connection (chat), study session |
| `shared` | HTTP and WebSocket clients, UI kit, date helpers, routes |

Server data is cached with TanStack Query; WebSocket events invalidate or update that cache.

**Backend:** FastAPI with one module per domain in `backend/app/modules`
(`auth`, `users`, `profiles`, `matching`, `study_requests`, `chat`, `study_sessions`, `realtime`).
Each module has its own `models`, `schemas`, `service` and `router`. PostgreSQL is accessed with
async SQLAlchemy; the schema is managed with Alembic.

**Matching** is rule-based and scores candidates out of 100: 60 points for shared courses,
30 for common study days and 10 for a compatible study format (in person / online / either).
Only students who share at least one course are suggested.

**Realtime:** each signed-in browser keeps one WebSocket open to `/api/ws`. The server pushes
`request.created`, `request.updated`, `message.created` and `session.updated` events. Connections are
tracked in process memory, so the backend runs as a single worker.

## Project Goal

Our goal is to make it easier for students to find study partners and prepare for midterms, finals, and other university tasks together.

## Team 13

* Abdizhalel Arkazhan
* Yerdaly Yeskendir
* Nurlan Yersultan
* Narikbay Azamat
