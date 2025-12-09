#!/bin/bash
# StudyBuddy - Master Install and Run Script
# This single command installs all dependencies, sets up database, and starts both backend and frontend

echo "========================================"
echo "StudyBuddy - Complete Setup and Launch"
echo "========================================"
echo ""

# Check if MySQL is running
echo "[1/6] Checking MySQL connection..."
mysql -u root -p"REMOVED" -e "SELECT 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "ERROR: MySQL is not running or incorrect credentials."
    echo "Please start MySQL and ensure password is REMOVED"
    exit 1
fi

# Create database if not exists
echo "[2/6] Creating StudyBuddy database..."
mysql -u root -p"REMOVED" -e "CREATE DATABASE IF NOT EXISTS StudyBuddy;" > /dev/null 2>&1

# Load database schema from Phase 2
echo "[3/6] Loading database schema..."
for schema_file in "Project phase 2"/sql/schema/*.sql; do
    if [ -f "$schema_file" ]; then
        mysql -u root -p"REMOVED" StudyBuddy < "$schema_file" > /dev/null 2>&1
    fi
done

# Navigate to backend and install dependencies
echo "[4/6] Installing backend dependencies..."
cd "Project phase 3/backend"
pip install -r requirements.txt > /dev/null 2>&1
if [ ! -f .env ]; then
    cp .env.example .env > /dev/null 2>&1
fi
cd ../..

# Navigate to frontend and install dependencies
echo "[5/6] Installing frontend dependencies..."
cd "Project phase 3/frontend"
npm install > /dev/null 2>&1
cd ../..

# Start backend in background
echo "[6/6] Starting backend and frontend servers..."
cd "Project phase 3/backend"
python app.py > /dev/null 2>&1 &
BACKEND_PID=$!
cd ../..
sleep 3

# Start frontend
echo ""
echo "========================================"
echo "Backend: http://127.0.0.1:8001"
echo "Frontend: http://127.0.0.1:5173"
echo "Admin Login: admin / admin"
echo "Database: StudyBuddy (MySQL)"
echo "========================================"
echo ""
cd "Project phase 3/frontend"
npm run dev

# Cleanup on exit
kill $BACKEND_PID 2>/dev/null
