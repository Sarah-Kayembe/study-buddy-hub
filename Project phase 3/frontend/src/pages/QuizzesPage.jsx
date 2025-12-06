import React, { useState } from "react";
import CreateQuiz from "../components/Quizzes/CreateQuiz";
import TakeQuiz from "../components/Quizzes/TakeQuiz";

export default function QuizzesPage() {
  const [tab, setTab] = useState("take");

  return (
    <div style={{ padding: 20 }}>
      <h1>Quizzes</h1>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", borderBottom: "1px solid rgba(148,163,184,0.3)" }}>
        <button
          onClick={() => setTab("take")}
          style={{
            padding: "0.75rem 1.5rem",
            border: "none",
            background: tab === "take" ? "rgba(14,165,233,0.2)" : "transparent",
            color: tab === "take" ? "#0ea5e9" : "#9ca3af",
            cursor: "pointer",
            borderBottom: tab === "take" ? "2px solid #0ea5e9" : "none",
            fontSize: "1rem",
            fontWeight: tab === "take" ? "600" : "400",
          }}
        >
          Take Quiz
        </button>
        <button
          onClick={() => setTab("create")}
          style={{
            padding: "0.75rem 1.5rem",
            border: "none",
            background: tab === "create" ? "rgba(14,165,233,0.2)" : "transparent",
            color: tab === "create" ? "#0ea5e9" : "#9ca3af",
            cursor: "pointer",
            borderBottom: tab === "create" ? "2px solid #0ea5e9" : "none",
            fontSize: "1rem",
            fontWeight: tab === "create" ? "600" : "400",
          }}
        >
          Create Quiz
        </button>
      </div>

      <div style={{ maxWidth: 900 }}>
        {tab === "take" && <TakeQuiz />}
        {tab === "create" && <CreateQuiz />}
      </div>
    </div>
  );
}
