@echo off
REM StudyBuddy Frontend - Install Dependencies and Run
REM No arguments required - installs all dependencies then starts dev server

call npm install >nul 2>&1

call npm run dev
