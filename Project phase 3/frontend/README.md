# Study Buddy Frontend (Phase 3)

This is a minimal React (Vite) frontend that provides simple UIs for Flashcards and Quizzes.

Quick start (PowerShell):

```powershell
cd "c:\Users\user\Desktop\COS457\Study_Buddy_hub-main\Project phase 3\frontend"
npm install
npm run dev
```

The frontend expects the backend to run on `http://localhost:5000`.
Note: I added `react-router-dom` for page routing. Run `npm install` again if you updated the repo after this change so the new dependency is installed. The app provides two top-level pages:
- `/flashcards` — create and practice flashcards
- `/quizzes` — create quizzes (quiz-taking UI can be added)

Open `http://localhost:5173` in your browser and use the top navigation to switch pages.
