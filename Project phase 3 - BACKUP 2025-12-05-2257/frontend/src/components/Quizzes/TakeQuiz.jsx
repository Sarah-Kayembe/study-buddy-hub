import React, { useEffect, useState } from "react";
import { listQuizzes, getQuiz, submitQuiz } from "../../api/quizzes";

export default function TakeQuiz() {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  useEffect(() => {
    setLoading(true);
    listQuizzes()
      .then(setQuizzes)
      .catch((err) => {
        setError(typeof err === 'string' ? err : 'Failed to load quizzes');
        setQuizzes([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const openQuiz = async (quizId) => {
    try {
      setError(null);
      setSubmitted(false);
      setAnswers({});
      const quiz = await getQuiz(quizId);
      setSelectedQuiz(quiz);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to load quiz');
    }
  };

  const handleSelectAnswer = (questionId, answerId) => {
    setAnswers({
      ...answers,
      [questionId]: answerId,
    });
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      const result = await submitQuiz({
        user_id: 1,
        quiz_id: selectedQuiz.quiz_id,
        answers: answers,
      });
      setScore(result);
      setSubmitted(true);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to submit quiz');
    }
  };

  if (!selectedQuiz) {
    return (
      <div className="card" style={{ marginTop: "2rem" }}>
        <h3>Take a Quiz</h3>
        {loading && <div style={{ color: "#9ca3af" }}>Loading quizzes...</div>}
        {error && <div style={{ color: "#f97373", marginBottom: "1rem" }}>{error}</div>}
        {!loading && quizzes.length === 0 && (
          <div style={{ color: "#9ca3af" }}>No quizzes available</div>
        )}

        <div style={{ marginTop: "1rem" }}>
          {quizzes.map((q) => (
            <button
              key={q.id}
              onClick={() => openQuiz(q.id)}
              style={{
                display: "block",
                width: "100%",
                padding: "0.75rem 1rem",
                marginBottom: "0.5rem",
                borderRadius: "0.75rem",
                border: "1px solid rgba(148,163,184,0.3)",
                background: "rgba(14,165,233,0.1)",
                color: "#e5e7eb",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(14,165,233,0.2)";
                e.target.style.borderColor = "rgba(14,165,233,0.5)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(14,165,233,0.1)";
                e.target.style.borderColor = "rgba(148,163,184,0.3)";
              }}
            >
              <strong>{q.title}</strong>
              {q.description && (
                <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "0.25rem" }}>
                  {q.description}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const { questions = [] } = selectedQuiz;
  const totalQuestions = questions.length;
  const answeredQuestions = Object.keys(answers).length;

  if (submitted && score) {
    const percentage = score.max_score > 0 ? Math.round((score.score / score.max_score) * 100) : 0;
    return (
      <div className="card" style={{ marginTop: "2rem" }}>
        <h3>{selectedQuiz.title}</h3>
        <div style={{
          background: "rgba(34,197,94,0.1)",
          border: "1px solid rgba(34,197,94,0.3)",
          borderRadius: "0.75rem",
          padding: "2rem",
          textAlign: "center",
          marginBottom: "2rem",
        }}>
          <div style={{ fontSize: "3rem", color: "#22c55e", marginBottom: "1rem" }}>
            {percentage}%
          </div>
          <div style={{ fontSize: "1.5rem", color: "#e5e7eb", marginBottom: "0.5rem" }}>
            Score: {score.score} / {score.max_score}
          </div>
          <div style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
            {score.score === score.max_score ? "Perfect!" : "Good effort!"}
          </div>
        </div>

        <button
          onClick={() => setSelectedQuiz(null)}
          style={{
            display: "block",
            width: "100%",
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            border: "1px solid rgba(148,163,184,0.3)",
            background: "rgba(14,165,233,0.15)",
            color: "#e5e7eb",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Back to Quizzes
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginTop: "2rem" }}>
      <div style={{ marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid rgba(148,163,184,0.3)" }}>
        <h3 style={{ margin: 0, marginBottom: "0.5rem" }}>{selectedQuiz.title}</h3>
        {selectedQuiz.description && (
          <div style={{ fontSize: "0.9rem", color: "#9ca3af" }}>{selectedQuiz.description}</div>
        )}
        <div style={{ fontSize: "0.85rem", color: "#cbd5e1", marginTop: "0.5rem" }}>
          Progress: {answeredQuestions} of {totalQuestions} answered
        </div>
      </div>

      {error && <div style={{ color: "#f97373", marginBottom: "1rem" }}>{error}</div>}

      <div style={{ maxHeight: "600px", overflowY: "auto", marginBottom: "2rem" }}>
        {questions.map((question, idx) => (
          <div
            key={question.question_id}
            style={{
              marginBottom: "2rem",
              paddingBottom: "1.5rem",
              borderBottom: idx < questions.length - 1 ? "1px solid rgba(148,163,184,0.2)" : "none",
            }}
          >
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.9rem", color: "#cbd5e1", fontWeight: "600" }}>
                Question {idx + 1} of {totalQuestions}
              </div>
              <h4 style={{ margin: "0.5rem 0 1rem 0", color: "#e5e7eb", fontSize: "1rem" }}>
                {question.question_text}
              </h4>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {(question.answers || []).map((answer) => (
                <label
                  key={answer.answer_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.5rem",
                    border: "1px solid rgba(148,163,184,0.3)",
                    background:
                      answers[question.question_id] === answer.answer_id
                        ? "rgba(14,165,233,0.2)"
                        : "rgba(30,41,59,0.3)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (answers[question.question_id] !== answer.answer_id) {
                      e.currentTarget.style.background = "rgba(30,41,59,0.5)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (answers[question.question_id] !== answer.answer_id) {
                      e.currentTarget.style.background = "rgba(30,41,59,0.3)";
                    }
                  }}
                >
                  <input
                    type="radio"
                    name={`question-${question.question_id}`}
                    value={answer.answer_id}
                    checked={answers[question.question_id] === answer.answer_id}
                    onChange={() => handleSelectAnswer(question.question_id, answer.answer_id)}
                    style={{ marginRight: "0.75rem", cursor: "pointer" }}
                  />
                  <span style={{ color: "#e5e7eb" }}>{answer.answer_text}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
        <button
          onClick={() => setSelectedQuiz(null)}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "0.5rem",
            border: "1px solid rgba(148,163,184,0.3)",
            background: "rgba(128,128,128,0.2)",
            color: "#e5e7eb",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={answeredQuestions === 0}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "0.5rem",
            border: "1px solid rgba(34,197,94,0.5)",
            background: "rgba(34,197,94,0.2)",
            color: "#e5e7eb",
            cursor: answeredQuestions === 0 ? "default" : "pointer",
            fontSize: "0.9rem",
            opacity: answeredQuestions === 0 ? 0.5 : 1,
          }}
        >
          Submit Quiz
        </button>
      </div>
    </div>
  );
}
