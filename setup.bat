@echo off
echo ========================================
echo StudyBuddy - Complete Setup
echo ========================================
echo.

echo This script will:
echo 1. Create the StudyBuddy database
echo 2. Load all required schemas
echo 3. Install backend dependencies
echo 4. Install frontend dependencies
echo.

set /p mysql_pwd="Enter MySQL root password: "

echo.
echo [Step 1/6] Creating database...
mysql -u root -p%mysql_pwd% -e "CREATE DATABASE IF NOT EXISTS StudyBuddy;"
if %errorlevel% neq 0 (
    echo ERROR: Failed to create database
    pause
    exit /b 1
)

echo.
echo [Step 2/6] Loading User Management schema...
cd "Project phase 2\sql\schema"
mysql -u root -p%mysql_pwd% StudyBuddy < User_Management.sql
if %errorlevel% neq 0 (
    echo ERROR: Failed to load User Management schema
    cd ..\..\..\
    pause
    exit /b 1
)

echo.
echo [Step 3/6] Loading Quizzes and Flashcards schema...
mysql -u root -p%mysql_pwd% StudyBuddy < "Quizzes&Flashcards.sql"
if %errorlevel% neq 0 (
    echo ERROR: Failed to load Quizzes and Flashcards schema
    cd ..\..\..\
    pause
    exit /b 1
)

echo.
echo [Step 4/6] Loading Study Management schema...
mysql -u root -p%mysql_pwd% StudyBuddy < study_Management_script.sql
if %errorlevel% neq 0 (
    echo ERROR: Failed to load Study Management schema
    cd ..\..\..\
    pause
    exit /b 1
)

echo.
echo [Step 5/6] Installing backend dependencies...
cd ..\..\..
cd "Project phase 3\backend"
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    cd ..\..
    pause
    exit /b 1
)

if not exist .env (
    echo Copying .env.example to .env...
    copy .env.example .env
)

echo.
echo [Step 6/6] Installing frontend dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    cd ..\..
    pause
    exit /b 1
)

cd ..\..

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To run the application:
echo 1. Backend: cd "Project phase 3\backend" and run install_and_run.bat
echo 2. Frontend: cd "Project phase 3\frontend" and run install_and_run.bat
echo.
echo Default admin credentials: admin / admin
echo.
pause
