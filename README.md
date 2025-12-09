# StudyBuddy Web Application – Phase 3

## Setup

### Prerequisites
- Python 3.8+ with pip
- Node.js 16+ with npm
- MySQL 8.0+

### Installation & Run (Single Command - No Arguments)

**Quick Start (Recommended):**
From the root directory of the project, run:
```bash
.\install_and_run.bat        # Windows
# OR
sh install_and_run.sh        # Linux/Mac
```

This single command will:
- Install all backend dependencies (Python packages)
- Install all frontend dependencies (Node packages)
- Copy `.env.example` to `.env` if needed
- Start backend server on http://127.0.0.1:8001
- Start frontend dev server on http://127.0.0.1:5173
- Auto-create admin user (`admin/admin`) on first run

**Individual Component Run:**
If you prefer to run backend and frontend separately:

Backend:
```bash
cd "Project phase 3/backend"
.\install_and_run.bat        # Windows
# OR
sh install_and_run.sh        # Linux/Mac
```

Frontend:
```bash
cd "Project phase 3/frontend"
.\install_and_run.bat        # Windows
# OR
sh install_and_run.sh        # Linux/Mac
```

**Prerequisites:**
- MySQL 8.0+ running with `StudyBuddy` database created
- Python 3.8+ and Node.js 16+ installed
- Database schema loaded from `Project phase 2/sql/schema/`

### Default Admin Credentials
- Username: `admin`
- Password: `admin`
- (Configured in `backend/.env`, auto-seeded on first backend startup)


Quick test flow
1) Login, then:
2) Create flashcard set at `/flashcards`; confirm it appears immediately in the right-hand list.
3) Create quiz via `/quizzes` page; submit answers to see scored result.

How to use (quick)
- Flashcards: create a set on `/flashcards`; it appears instantly (auto-refresh). Edit/delete cards. For many sets, request another page with `?page=2&limit=20`.
- Quizzes: create a quiz with questions/answers on `/quizzes`; list quizzes (paginated), open quiz to see questions/answers, submit answers to get a score.

What to show in the demo
- Login -> `/home` redirect.
- Flashcards: create set -> appears instantly; edit/delete; mention pagination query params.
- Quizzes: create -> list -> open -> submit; call out ACID create and batched answers query; mention pagination.

