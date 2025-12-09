import React, { useState } from "react";
import { createFlashcardSet } from "../../api/flashcards";

export default function CreateFlashcardSet({ onSetCreated }) {
  const [title, setTitle] = useState("");
  const [creatorId, setCreatorId] = useState(1); // default for testing
  const [cards, setCards] = useState([{ front: "", back: "" }]);
  const [status, setStatus] = useState(null);

  const updateCard = (idx, key, value) => {
    const next = [...cards];
    next[idx][key] = value;
    setCards(next);
  };

  const addCard = () => setCards((c) => [...c, { front: "", back: "" }]);

  const submit = async () => {
    setStatus({ type: "info", text: "Saving..." });
    try {
      const payload = { title, creator_id: creatorId, flashcards: cards.map(c => ({ front: c.front, back: c.back })) };
      const res = await createFlashcardSet(payload);
      setStatus({ type: "success", text: `Saved (set id ${res.set_id || res.setId || 'unknown'})` });
      setTitle("");
      setCards([{ front: "", back: "" }]);
      // Notify parent to reload the flashcard list
      if (onSetCreated) {
        onSetCreated();
      }
    } catch (e) {
      // e may be a string or an object from axios interceptor
      const text = typeof e === 'string' ? e : (e?.error || e?.message || JSON.stringify(e));
      setStatus({ type: "error", text });
    }
  };

  return (
    <div className="card" style={{ maxWidth: 700 }}>
      <h3>Create Flashcard Set</h3>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input style={{ flex: 1 }} placeholder="Set title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input style={{ width: 110 }} type="number" value={creatorId} onChange={(e) => setCreatorId(parseInt(e.target.value || '0'))} />
      </div>

      {cards.map((c, i) => (
        <div key={i} style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <input placeholder="Front" value={c.front} onChange={(e) => updateCard(i, "front", e.target.value)} style={{ flex: 1 }} />
          <input placeholder="Back" value={c.back} onChange={(e) => updateCard(i, "back", e.target.value)} style={{ flex: 1 }} />
        </div>
      ))}

      <div style={{ marginTop: 12 }}>
        <button onClick={addCard}>Add Card</button>
        <button onClick={submit} style={{ marginLeft: 8 }}>Save Set</button>
      </div>

      {status && (
        <div style={{ marginTop: 8 }}>
          <strong>{status.type === 'error' ? 'Error: ' : ''}</strong>{status.text}
        </div>
      )}
    </div>
  );
}
