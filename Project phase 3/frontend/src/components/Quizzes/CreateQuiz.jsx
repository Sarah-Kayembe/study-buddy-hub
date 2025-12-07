import React, { useState } from "react";
import { createQuiz } from "../../api/quizzes";

export default function CreateQuiz() {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([{ text: "", answers: [{ text: "", is_correct: false }] }]);
  const [status, setStatus] = useState(null);

  const updateQuestion = (qi, key, val) => {
    const next = [...questions];
    next[qi][key] = val;
    setQuestions(next);
  };

  const addAnswer = (qi) => {
    const next = [...questions];
    next[qi].answers.push({ text: "", is_correct: false });
    setQuestions(next);
  };

  const submit = async () => {
    setStatus("Saving...");
    try {
      const payload = { title, questions };
      await createQuiz(payload);
      setStatus("Saved");
    } catch (e) {
      setStatus("Error: " + JSON.stringify(e));
    }
  };

  return (
    <div className="card">
      <h3>Create Quiz</h3>
      <input placeholder="Quiz title" value={title} onChange={(e) => setTitle(e.target.value)} />
      {questions.map((q, qi) => (
        <div key={qi} style={{ marginTop: 8 }}>
          <input placeholder={`Question ${qi + 1}`} value={q.text} onChange={(e) => updateQuestion(qi, "text", e.target.value)} />
          <div style={{ marginLeft: 8 }}>
            {q.answers.map((a, ai) => (
              <div key={ai}>
                <input placeholder={`Answer ${ai + 1}`} value={a.text} onChange={(e) => {
                  const next = [...questions];
                  next[qi].answers[ai].text = e.target.value;
                  setQuestions(next);
                }} />
                <label>
                  <input type="checkbox" checked={a.is_correct} onChange={(e) => {
                    const next = [...questions];
                    next[qi].answers[ai].is_correct = e.target.checked;
                    setQuestions(next);
                  }} /> Correct
                </label>
              </div>
            ))}
            <button onClick={() => addAnswer(qi)}>Add Answer</button>
          </div>
        </div>
      ))}
      <div style={{ marginTop: 8 }}>
        <button onClick={submit}>Save Quiz</button>
      </div>
      {status && <div style={{ marginTop: 8 }}>{status}</div>}
    </div>
  );
}
