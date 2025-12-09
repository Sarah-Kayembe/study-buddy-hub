#!/bin/bash
# StudyBuddy - Master Install and Run Script
# This single command installs all dependencies, sets up database, and starts both backend and frontend

echo "========================================"
echo "StudyBuddy - Complete Setup and Launch"
echo "========================================"
echo ""

# Set default MySQL credentials
MYSQL_USER="root"
MYSQL_PASSWORD=""
MYSQL_HOST="127.0.0.1"

echo "[1/6] MySQL Configuration"
echo "Enter your MySQL credentials (press Enter to use defaults)"
read -p "MySQL User (default: root): " input_user
MYSQL_USER="${input_user:-root}"

read -sp "MySQL Password (default: empty): " input_pass
MYSQL_PASSWORD="${input_pass}"
echo ""

read -p "MySQL Host (default: 127.0.0.1): " input_host
MYSQL_HOST="${input_host:-127.0.0.1}"

echo ""
echo "Connecting to MySQL as $MYSQL_USER@$MYSQL_HOST..."

# Check if MySQL is running
mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SELECT 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Could not connect to MySQL. Please verify:"
    echo "  - MySQL is running"
    echo "  - User: $MYSQL_USER"
    echo "  - Host: $MYSQL_HOST"
    echo "  - Password is correct"
    echo ""
    exit 1
fi
echo "MySQL connection successful!"

# Create database if not exists
echo "[2/6] Creating StudyBuddy database..."
mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS StudyBuddy;" > /dev/null 2>&1

# Load database schema from Phase 2
echo "[3/6] Loading database schema..."
for schema_file in "Project phase 2"/sql/schema/*.sql; do
    if [ -f "$schema_file" ]; then
        mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" StudyBuddy < "$schema_file" > /dev/null 2>&1
    fi
done

# Navigate to backend and install dependencies
echo "[4/6] Installing backend dependencies..."
cd "Project phase 3/backend"
pip install -r requirements.txt > /dev/null 2>&1

# Create .env file with MySQL credentials from user input
echo "Creating .env with MySQL credentials..."
cat > .env << EOF
MYSQL_HOST=$MYSQL_HOST
MYSQL_PORT=3306
MYSQL_USER=$MYSQL_USER
MYSQL_PASSWORD=$MYSQL_PASSWORD
MYSQL_DB=StudyBuddy
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
EOF

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
