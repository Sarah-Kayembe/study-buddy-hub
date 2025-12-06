import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import FlashcardsPage from "./pages/FlashcardsPage";
import QuizzesPage from "./pages/QuizzesPage";

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ padding: 12, fontFamily: 'Arial, sans-serif' }}>
        <header style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <h1 style={{ margin: 0 }}>Study Buddy</h1>
          <nav style={{ marginLeft: 20 }}>
            <Link to="/flashcards" style={{ marginRight: 12 }}>Flashcards</Link>
            <Link to="/quizzes">Quizzes</Link>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<FlashcardsPage />} />
          <Route path="/flashcards" element={<FlashcardsPage />} />
          <Route path="/quizzes" element={<QuizzesPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
