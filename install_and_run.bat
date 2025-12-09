@echo off
REM StudyBuddy - Master Install and Run Script
REM This single command installs all dependencies and starts both backend and frontend

echo ========================================
echo StudyBuddy - Complete Setup and Launch
echo ========================================
echo.

REM Navigate to backend and install dependencies
echo [1/4] Installing backend dependencies...
cd "Project phase 3\backend"
pip install -r requirements.txt >nul 2>&1
if not exist .env (
    copy .env.example .env >nul 2>&1
)
cd ..\..

REM Navigate to frontend and install dependencies
echo [2/4] Installing frontend dependencies...
cd "Project phase 3\frontend"
call npm install >nul 2>&1
cd ..\..

REM Start backend in background
echo [3/4] Starting backend server...
start /B cmd /c "cd Project phase 3\backend && python app.py"
timeout /t 3 /nobreak >nul

REM Start frontend
echo [4/4] Starting frontend dev server...
echo.
echo ========================================
echo Backend: http://127.0.0.1:8001
echo Frontend: http://127.0.0.1:5173
echo Admin Login: admin / admin
echo ========================================
echo.
cd "Project phase 3\frontend"
call npm run dev
