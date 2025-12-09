#!/bin/bash
# StudyBuddy Backend - Install Dependencies and Run
# No arguments required - installs all dependencies then starts server

pip install -r requirements.txt > /dev/null 2>&1

if [ ! -f .env ]; then
    cp .env.example .env > /dev/null 2>&1
fi

python app.py
