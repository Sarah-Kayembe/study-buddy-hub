#!/bin/bash
# StudyBuddy - Master Install and Run Script
# This single command installs all dependencies and starts both backend and frontend

echo "========================================"
echo "StudyBuddy - Complete Setup and Launch"
echo "========================================"
echo ""

# Navigate to backend and install dependencies
echo "[1/4] Installing backend dependencies..."
cd "Project phase 3/backend"
pip install -r requirements.txt > /dev/null 2>&1
if [ ! -f .env ]; then
    cp .env.example .env > /dev/null 2>&1
fi
cd ../..

# Navigate to frontend and install dependencies
echo "[2/4] Installing frontend dependencies..."
cd "Project phase 3/frontend"
npm install > /dev/null 2>&1
cd ../..

# Start backend in background
echo "[3/4] Starting backend server..."
cd "Project phase 3/backend"
python app.py > /dev/null 2>&1 &
BACKEND_PID=$!
cd ../..
sleep 3

# Start frontend
echo "[4/4] Starting frontend dev server..."
echo ""
echo "========================================"
echo "Backend: http://127.0.0.1:8001"
echo "Frontend: http://127.0.0.1:5173"
echo "Admin Login: admin / admin"
echo "========================================"
echo ""
cd "Project phase 3/frontend"
npm run dev

# Cleanup on exit
kill $BACKEND_PID 2>/dev/null
