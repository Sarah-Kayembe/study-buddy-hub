@echo off
REM StudyBuddy - Master Install and Run Script
REM This single command installs all dependencies, sets up database, and starts both backend and frontend

echo ========================================
echo StudyBuddy - Complete Setup and Launch
echo ========================================
echo.

REM Check if MySQL is running
echo [1/6] Checking MySQL connection...
mysql -u root -p"REMOVED" -e "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo ERROR: MySQL is not running or incorrect credentials. Please start MySQL and ensure password is REMOVED
    pause
    exit /b 1
)

REM Create database if not exists
echo [2/6] Creating StudyBuddy database...
mysql -u root -p"REMOVED" -e "CREATE DATABASE IF NOT EXISTS StudyBuddy;" >nul 2>&1

REM Load database schema from Phase 2
echo [3/6] Loading database schema...
for %%F in ("Project phase 2\sql\schema\*.sql") do (
    mysql -u root -p"REMOVED" StudyBuddy < "%%F" >nul 2>&1
)

REM Navigate to backend and install dependencies
echo [4/6] Installing backend dependencies...
cd "Project phase 3\backend"
pip install -r requirements.txt >nul 2>&1
if not exist .env (
    copy .env.example .env >nul 2>&1
)
cd ..\..

REM Navigate to frontend and install dependencies
echo [5/6] Installing frontend dependencies...
cd "Project phase 3\frontend"
call npm install >nul 2>&1
cd ..\..

REM Start backend in background
echo [6/6] Starting backend and frontend servers...
start /B cmd /c "cd Project phase 3\backend && python app.py"
timeout /t 3 /nobreak >nul

REM Start frontend
echo.
echo ========================================
echo Backend: http://127.0.0.1:8001
echo Frontend: http://127.0.0.1:5173
echo Admin Login: admin / admin
echo Database: StudyBuddy (MySQL)
echo ========================================
echo.
cd "Project phase 3\frontend"
call npm run dev
