@echo off
REM StudyBuddy Backend - Install Dependencies and Run
REM No arguments required - installs all dependencies then starts server

pip install -r requirements.txt >nul 2>&1

if not exist .env (
    copy .env.example .env >nul 2>&1
)

python app.py
