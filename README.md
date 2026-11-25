# StudyBuddy

StudyBuddy is a web platform for university students to find people to study with.

In universities like KBTU, students can have the same courses but may not know each other. StudyBuddy helps students find study partners based on their courses and available time.

## Main Features

* Registration with a university email confirmed by a 6-digit code
* Student profile: courses, study days and preferred format
* Find students with the same courses, ranked by courses, days and format
* Send and accept study requests
* Real-time chat with matched students, with full message history
* Study sessions planned in the chat, with email reminders 24 hours before and calendar (.ics) export
* Study groups of 3–4 students per course: join requests, group chat and group sessions
* Forum for posts like "Looking for someone to prepare for the Database midterm", with comments
* Light and dark theme

## How it works

1. Create an account and confirm your university email.
2. Add your courses and the days you can study.
3. Find students with similar courses and schedules, join a study group, or post on the forum.
4. Send a study request.
5. Chat, plan study sessions and prepare for exams together.

## Getting Started

### Option 1: everything in Docker

Requires Docker Desktop.

```bash
docker compose up --build
```

Open http://localhost:8080. The API docs are at http://localhost:8000/docs.
Database migrations run automatically when the backend container starts.

All emails (verification codes, session reminders) go to **Mailpit**, a local inbox at
http://localhost:8025. To send real emails, set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`,
`SMTP_PASSWORD` and `SMTP_STARTTLS=true` before `docker compose up`.

### Option 2: local development

PostgreSQL runs in Docker; the backend and frontend run on your machine with hot reload.

```bash
# 1. Database (exposed on port 5433 so it does not clash with a local PostgreSQL) and Mailpit
docker compose up -d db mailpit

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

Copy `backend/.env.example` to `backend/.env`; it points email at Mailpit
(http://localhost:8025). Without `SMTP_HOST` the verification codes are printed to the backend log
instead. Set `SECRET_KEY` outside development, and `ALLOWED_EMAIL_DOMAINS=kbtu.kz` to accept only
university emails.

### Checks

```bash
# Backend: tests (SQLite, no database needed), lint, formatting, strict type check
cd backend
pytest
ruff check . && ruff format --check .
mypy app

# Frontend: unit and component tests (Vitest + Testing Library), lint, type check and build
cd frontend
npm test
npm run lint && npm run build
```

## Architecture

**Frontend:** React + TypeScript + Vite, organised with Feature-Sliced Design.

| Layer | Contents |
| --- | --- |
| `app` | providers, routing and guards, WebSocket event handling, global styles and themes |
| `pages` | auth, email verification, onboarding / edit profile, matches, requests, chats, groups, forum, sessions, profile |
| `widgets` | header, profile wizard, match list, request list, chat list and window, group list and page, forum feed and post, session list, reminder banner |
| `features` | sign in / sign up, verify email, log out, theme toggle, profile wizard steps, send / answer a request, send a message, propose / answer a session, add to calendar, create / join / manage a group, write / comment / delete forum posts |
| `entities` | viewer, profile, course, match, study request, connection (chat messages), study session, group, forum post |
| `shared` | HTTP and WebSocket clients, UI kit, date and theme helpers, routes |

Server data is cached with TanStack Query; WebSocket events invalidate or update that cache.

**Backend:** FastAPI with one module per domain in `backend/app/modules`
(`auth`, `users`, `profiles`, `matching`, `study_requests`, `chat`, `study_sessions`, `groups`,
`forum`, `realtime`).
Each module follows the same layers:

| File | Responsibility |
| --- | --- |
| `router.py` | HTTP only: parse the request, call the service, return the schema |
| `service.py` | business rules; raises domain errors from `app/common/exceptions.py` |
| `repository.py` | all database queries of the module |
| `schemas.py` / `models.py` | Pydantic validation / SQLAlchemy tables |

Services never import FastAPI; a single handler in `app/main.py` turns domain errors into
`{"detail": ...}` responses. Modules talk to each other through services, never through another
module's repository. PostgreSQL is accessed with async SQLAlchemy; the schema is managed with Alembic.

On the frontend, API calls live in `entities/*/api`, and mutations with their cache updates live in
`features/*/model` hooks, so components only render and handle input.

**Matching** is rule-based and scores candidates out of 100: 60 points for shared courses,
30 for common study days and 10 for a compatible study format (in person / online / either).
Only students who share at least one course are suggested.

**Group matching:** the Groups page lists groups for your courses that still have free spots,
with the days on which you and every member can study; groups with more common days come first.

**Email:** a 6-digit code (valid 15 minutes, 5 attempts, a new one at most once a minute)
confirms the university email; the app is locked until then. A background task checks every minute
and emails each participant once when a confirmed session starts within 24 hours.

**Realtime:** each signed-in browser keeps one WebSocket open to `/api/ws`. The server pushes
`request.*`, `message.created`, `session.updated`, `group.updated` and `forum.updated` events.
Connections and the reminder task live in the backend process, so it runs as a single worker.

## Project Goal

Our goal is to make it easier for students to find study partners and prepare for midterms, finals, and other university tasks together.

## Team 13

* Abdizhalel Arkazhan
* Yerdaly Yeskendir
* Nurlan Yersultan
* Narikbay Azamat
