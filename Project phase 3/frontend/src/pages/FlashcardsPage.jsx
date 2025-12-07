import React from "react";
import CreateFlashcardSet from "../components/Flashcards/CreateFlashcardSet";
import PracticeFlashcards from "../components/Flashcards/PracticeFlashcards";

export default function FlashcardsPage() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Flashcards</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <CreateFlashcardSet />
        </div>
        <div>
          <PracticeFlashcards />
        </div>
      </div>
    </div>
  );
}
