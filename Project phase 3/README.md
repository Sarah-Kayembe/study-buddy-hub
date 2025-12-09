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

------------------------------------------------------------
Phase 3 – Quizzes & Flashcards (advanced features)
------------------------------------------------------------

Frontend entry points
- Quizzes: `frontend/src/pages/QuizzesPage.jsx` (routes wired in `src/App.jsx` at `/quizzes`).
- Flashcards: `frontend/src/pages/FlashcardsPage.jsx` (routes wired in `src/App.jsx` at `/flashcards`).
- Flashcards auto-refresh: after creating a set, the list reloads without a manual browser refresh (`CreateFlashcardSet` -> `PracticeFlashcards` via ref callback).

Backend APIs (Flask)
- Base URL: `http://<backend-host>:8001` (frontend defaults to same host:8001 unless `VITE_API_BASE` is set).

Quizzes (routes/quiz_routes.py)
- POST `/quiz/create` (requires session user): creates quiz + questions + answers in one ACID transaction (`create_full_quiz_transaction`).
	Payload shape (flexible keys):
	```json
	{
		"title": "Quiz title", "description": "...", "course_id": 1,
		"questions": [
			{"question_text": "Q?", "question_type": "multiple_choice", "points": 1,
			 "answers": [ {"answer_text": "A", "is_correct": true}, {"answer_text": "B", "is_correct": false} ]}
		]
	}
	```
- GET `/quiz/quizzes`: list recent quizzes (id, title, description, creator_id, created_at).
- GET `/quiz/<quiz_id>`: quiz with questions and answers.
- POST `/quiz/submit` (requires session user): grade and record attempt. Payload: `{ "quiz_id": 1, "answers": { "<question_id>": "<answer_id>", ... } }`. Returns `{attempt_id, score, max_score}` and persists attempt via transaction.

Flashcards (routes/flashcard_routes.py)
- POST `/flashcards/create` (requires session user): creates set + cards in one transaction (`create_flashcard_set_transaction`).
	Payload accepts `flashcards` (front/back) or `cards` (front_text/back_text). Example:
	```json
	{
		"title": "Set title", "description": "...", "course_id": 1,
		"flashcards": [ {"front": "Term", "back": "Definition"} ]
	}
	```
- GET `/flashcards/sets`: list sets (id, title, description).
- GET `/flashcards/sets/<set_id>`: set with `cards` array.
- PUT `/flashcards/sets/<set_id>`: update title/description.
- DELETE `/flashcards/sets/<set_id>`: delete set and its cards.
- PUT `/flashcards/cards/<card_id>`: update a single card (`front_text`/`back_text` accepted).
- DELETE `/flashcards/cards/<card_id>`: delete a single card.

Auth/session expectations
- Both quiz and flashcard create/submit endpoints require a logged-in session (`session['user']`). Use the app’s login flow first.

Quick test flow
1) Login, then:
2) Create flashcard set at `/flashcards`; confirm it appears immediately in the right-hand list.
3) Create quiz via `/quizzes` page; submit answers to see scored result.


## Advanced Database Features

### ACID Transactions
- **Quiz Creation**: `create_full_quiz_transaction` inserts quiz + questions + answers atomically. If any part fails, all changes roll back.
- **Flashcard Set Creation**: `create_flashcard_set_transaction` inserts set + cards atomically.
- **Quiz Submission**: `submit_quiz_transaction` calculates score and records attempt in one transaction.
- **Benefit**: Data consistency and integrity; no orphaned rows; scores always paired with attempts.
- **Where**: `backend/utils/transactions.py` and `backend/routes/quiz_routes.py`, `backend/routes/flashcard_routes.py`.


## Performance Analysis & Optimization

### 1. Quiz Detail Query Optimization (N+1 Removal)
**Problem**: Loading a quiz with 10 questions ran 11 DB queries (1 for quiz, 10 for answers).
**Solution**: Batched all answers in one query using `WHERE question_id IN (...)` and mapped in Python.
**Result**: 11 queries → 2 queries. Approximately 50% faster detail load on typical quizzes.

### 2. Paginated List Endpoints
**Problem**: List endpoints fetched up to 50 items; unbounded payload sizes; slow on large datasets.
**Solution**: Added `?page` and `?limit` query parameters:
  - Quiz list: `GET /quiz/quizzes?page=1&limit=20` (max limit 100)
  - Flashcard sets: `GET /flashcards/sets?page=1&limit=20` (max limit 100)
**Result**: Predictable, bounded responses; faster rendering; lower memory usage on client and server.


Phase 3 – Quizzes & Flashcards (concise checklist)
--------------------------------------------------
- Frontend entry: Quizzes at `/quizzes`, Flashcards at `/flashcards`, app starts at login `/`, home at `/home`.
- Backend base: `http://<host>:8001` (override with `VITE_API_BASE`).
- Auth: creating quizzes/flashcards and submitting quizzes requires a logged-in session.

Advanced database features
- ACID transactions: quiz create (`create_full_quiz_transaction`), flashcard set create (`create_flashcard_set_transaction`), quiz submit (`submit_quiz_transaction`).

Performance optimizations
- Quiz detail uses a single batched answers query (removes N+1).
- Pagination on lists (bounded payloads):
	- Quizzes: `GET /quiz/quizzes?page=1&limit=20` (max limit 100)
	- Flashcard sets: `GET /flashcards/sets?page=1&limit=20` (max limit 100)

How to use (quick)
- Flashcards: create a set on `/flashcards`; it appears instantly (auto-refresh). Edit/delete cards. For many sets, request another page with `?page=2&limit=20`.
- Quizzes: create a quiz with questions/answers on `/quizzes`; list quizzes (paginated), open quiz to see questions/answers, submit answers to get a score.

What to show in the demo
- Login -> `/home` redirect.
- Flashcards: create set -> appears instantly; edit/delete; mention pagination query params.
- Quizzes: create -> list -> open -> submit; call out ACID create and batched answers query; mention pagination.

