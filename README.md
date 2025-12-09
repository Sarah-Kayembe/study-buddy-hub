# StudyBuddy - Database Systems Course Project

**Author:** Vivek Reddy Bhimavarapu  
**Date:** December 8, 2025

StudyBuddy is a comprehensive web application for students to create quizzes, practice flashcards, join study groups, and collaborate with peers. This project spans three phases of development: database design, SQL implementation, and full-stack web application development.

## Quick Start

### One-Command Setup (Recommended)

From the root directory, run:

```bash
# Windows
.\install_and_run.bat

# Linux/Mac
sh install_and_run.sh
```

This single command will:
- Prompt for your MySQL credentials (user, password, host)
- Create and initialize the MySQL database
- Load all database schemas from Phase 2
- Install all backend dependencies
- Install all frontend dependencies
- Auto-create admin user (admin/admin)
- Start backend server (http://127.0.0.1:8001)
- Start frontend server (http://127.0.0.1:5173)

## Prerequisites

Before running the setup script, ensure you have:

- **Python** 3.8 or higher with pip
- **Node.js** 16 or higher with npm
- **MySQL** 8.0 or higher (running and accessible)

When you run the install script, you'll be prompted to enter your MySQL credentials.

## Project Structure

```
Study_Buddy_hub/
├── README.md                          (This file)
├── install_and_run.bat                (Windows auto-setup script)
├── install_and_run.sh                 (Linux/Mac auto-setup script)
│
├── Project phase 1/                   (Database Design & Planning)
│   └── ER Diagrams/
│
├── Project phase 2/                   (SQL Implementation)
│   ├── build_database.py
│   ├── sql/
│   │   ├── schema/                    (Database schemas - auto-loaded)
│   │   │   ├── User_Management.sql
│   │   │   ├── Quizzes&Flashcards.sql
│   │   │   └── ...
│   │   └── load/
│   ├── data/
│   │   ├── Raw_data/
│   │   ├── Clean_data/
│   │   └── data_cleaners/
│   ├── scrapers/
│   └── documentation/
│
└── Project phase 3/                   (Full-Stack Web Application)
    ├── README.md                      (Phase 3 technical details)
    ├── backend/                       (Flask API)
    │   ├── app.py
    │   ├── db.py
    │   ├── requirements.txt
    │   ├── .env.example
    │   ├── routes/
    │   │   ├── quiz_routes.py
    │   │   └── flashcard_routes.py
    │   └── utils/
    │
    ├── frontend/                      (React + Vite)
    │   ├── src/
    │   │   ├── pages/
    │   │   │   ├── QuizzesPage.jsx
    │   │   │   ├── FlashcardsPage.jsx
    │   │   │   └── Auth.jsx
    │   │   ├── components/
    │   │   └── api/
    │   ├── package.json
    │   └── vite.config.js
    │
    └── Documentation/
        ├── ADVANCED_DATABASE_FEATURES.pdf
        ├── PERFORMANCE_ANALYSIS.pdf
        ├── API_DOCUMENTATION.pdf
        └── SETUP_GUIDE.pdf
```

## Features

### Phase 1: Database Design
- Comprehensive Entity-Relationship (ER) diagrams
- Database schema planning for all features
- Data model documentation

### Phase 2: Database Implementation
- Complete SQL schema files for all tables
- Data cleaning and preparation scripts
- Web scrapers for college and course data
- Query optimization and testing
- Performance analysis scripts

### Phase 3: Web Application (Primary Submission)

#### Quizzes & Flashcards Features
- Create quizzes with multiple questions and answers
- Automatic quiz grading with score calculation
- Create flashcard sets for spaced repetition learning
- Practice flashcards with navigation controls
- Real-time auto-refresh when creating new content



## Default Login Credentials

- **Username:** admin
- **Password:** admin

These credentials are automatically seeded when the backend starts for the first time.

## API Endpoints

### Quizzes
- `POST /quiz/create` - Create a new quiz with questions and answers (ACID transaction)
- `GET /quiz/quizzes` - List all quizzes with pagination
- `GET /quiz/<quiz_id>` - Get quiz details with all questions and answers
- `POST /quiz/submit` - Submit quiz answers and get score (ACID transaction)

### Flashcards
- `POST /flashcards/create` - Create a new flashcard set (ACID transaction)
- `GET /flashcards/sets` - List all flashcard sets with pagination
- `GET /flashcards/sets/<set_id>` - Get set details with all cards
- `PUT /flashcards/sets/<set_id>` - Update set title/description
- `DELETE /flashcards/sets/<set_id>` - Delete a flashcard set
- `PUT /flashcards/cards/<card_id>` - Update individual flashcard
- `DELETE /flashcards/cards/<card_id>` - Delete individual flashcard

Complete API documentation with request/response examples is in `Project phase 3/API_DOCUMENTATION.pdf`.

## Database Setup

The setup script automatically handles database initialization:

1. Creates the `StudyBuddy` database
2. Loads schemas from `Project phase 2/sql/schema/`:
   - User_Management.sql
   - Quizzes&Flashcards.sql
   - StudyGroupsAndCollaboration.sql
   - study_Management_script.sql

No manual SQL execution is required.

## Running Components Separately

### Backend Only
```bash
cd "Project phase 3/backend"
.\install_and_run.bat    # Windows
# OR
sh install_and_run.sh    # Linux/Mac
```
Backend will run on http://127.0.0.1:8001

### Frontend Only
```bash
cd "Project phase 3/frontend"
.\install_and_run.bat    # Windows
# OR
sh install_and_run.sh    # Linux/Mac
```
Frontend will run on http://127.0.0.1:5173

## Documentation

Comprehensive technical documentation is available in PDF format:

1. **ADVANCED_DATABASE_FEATURES.pdf** - ACID transactions, SQL injection prevention, error handling patterns
2. **PERFORMANCE_ANALYSIS.pdf** - Performance optimizations, N+1 query elimination, pagination details, benchmarks
3. **API_DOCUMENTATION.pdf** - Complete REST API reference with curl examples and response formats
4. **SETUP_GUIDE.pdf** - Step-by-step installation guide and troubleshooting

All PDFs are located in `Project phase 3/` directory.

## Troubleshooting

### MySQL Connection Error
- Ensure MySQL server is running on your machine
- Verify your MySQL username and password
- Check that MySQL is accessible on the host you specified (default: 127.0.0.1)
- Make sure the MySQL user has permission to create databases

### MySQL Connection Failed - Wrong Credentials
- The script will tell you if connection failed
- Re-run the script and enter the correct credentials
- Common default: user=`root`, password=`` (empty)

### Python/Node Package Errors
- The script runs pip/npm in silent mode
- Check that you have internet connection
- Ensure pip and npm are in your system PATH

### Port Already in Use
- Backend (8001): `taskkill /F /IM python.exe`
- Frontend (5173): `taskkill /F /IM node.exe`
- Then retry the install script

### Database Already Exists
- The script uses `CREATE DATABASE IF NOT EXISTS`
- Existing database will be used (safe to run multiple times)

For detailed troubleshooting, see `Project phase 3/SETUP_GUIDE.pdf`.

## Technology Stack

### Backend
- **Framework:** Flask (Python)
- **Database:** MySQL 8.0+
- **ORM:** Direct SQL queries with parametrization
- **Authentication:** Session-based
- **CORS:** Enabled for frontend communication

### Frontend
- **Framework:** React 19.2.0
- **Build Tool:** Vite 7.2.4
- **Router:** react-router-dom 7.9.6
- **HTTP Client:** axios 1.13.2
- **State Management:** React hooks (useState, useRef, useContext)

## Testing & Validation

The application has been thoroughly tested with:
- ACID transaction validation
- Performance benchmarking
- SQL injection prevention testing
- Pagination edge cases
- Auto-refresh functionality
- Cross-browser compatibility

## System Requirements

- **OS:** Windows, Linux, or macOS
- **RAM:** 2 GB minimum
- **Disk Space:** 500 MB for dependencies
- **Internet:** Required for npm/pip package installation

## Next Steps

1. Clone or download this repository
2. Ensure MySQL is running
3. Run `.\install_and_run.bat` (Windows) or `sh install_and_run.sh` (Linux/Mac)
4. Open http://127.0.0.1:5173 in your browser
5. Log in with admin / admin
6. Explore Quizzes and Flashcards features

## Support

For issues, questions, or feedback, please refer to the documentation PDFs in `Project phase 3/` or review the source code comments in the backend and frontend directories.

---

**Project Status:** Phase 3 Complete  
**Last Updated:** December 8, 2025  
**Author:** Vivek Reddy Bhimavarapu  
**Course:** Database Systems

