@echo off
REM StudyBuddy - Master Install and Run Script
REM This single command installs all dependencies, sets up database, and starts both backend and frontend

echo ========================================
echo StudyBuddy - Complete Setup and Launch
echo ========================================
echo.

REM Set default MySQL credentials (can be overridden)
set MYSQL_USER=root
set MYSQL_PASSWORD=
set MYSQL_HOST=127.0.0.1

echo [1/6] MySQL Configuration
echo Enter your MySQL credentials (press Enter to skip and use defaults)
set /p MYSQL_USER="MySQL User (default: root): "
if "%MYSQL_USER%"=="" set MYSQL_USER=root

set /p MYSQL_PASSWORD="MySQL Password (default: empty): "
set /p MYSQL_HOST="MySQL Host (default: 127.0.0.1): "
if "%MYSQL_HOST%"=="" set MYSQL_HOST=127.0.0.1

echo.
echo Connecting to MySQL as %MYSQL_USER%@%MYSQL_HOST%...

REM Check if MySQL is running
mysql -h %MYSQL_HOST% -u %MYSQL_USER% -p"%MYSQL_PASSWORD%" -e "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Could not connect to MySQL. Please verify:
    echo   - MySQL is running
    echo   - User: %MYSQL_USER%
    echo   - Host: %MYSQL_HOST%
    echo   - Password is correct
    echo.
    pause
    exit /b 1
)
echo MySQL connection successful!

REM Create database if not exists
echo [2/6] Creating StudyBuddy database...
mysql -h %MYSQL_HOST% -u %MYSQL_USER% -p"%MYSQL_PASSWORD%" -e "CREATE DATABASE IF NOT EXISTS StudyBuddy;" >nul 2>&1

REM Load database schema from Phase 2
echo [3/6] Loading database schema...
for %%F in ("Project phase 2\sql\schema\*.sql") do (
    mysql -h %MYSQL_HOST% -u %MYSQL_USER% -p"%MYSQL_PASSWORD%" StudyBuddy < "%%F" >nul 2>&1
)

REM Navigate to backend and install dependencies
echo [4/6] Installing backend dependencies...
cd "Project phase 3\backend"
pip install -r requirements.txt >nul 2>&1

REM Create .env file with MySQL credentials from user input
echo Creating .env with MySQL credentials...
(
    echo MYSQL_HOST=%MYSQL_HOST%
    echo MYSQL_PORT=3306
    echo MYSQL_USER=%MYSQL_USER%
    echo MYSQL_PASSWORD=%MYSQL_PASSWORD%
    echo MYSQL_DB=StudyBuddy
    echo ADMIN_USERNAME=admin
    echo ADMIN_PASSWORD=admin
) > .env

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
