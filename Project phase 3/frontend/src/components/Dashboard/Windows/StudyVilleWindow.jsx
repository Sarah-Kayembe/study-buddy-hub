// frontend/src/components/Dashboard/Windows/StudyVilleWindow.jsx
import React, { useState } from "react";
import StudyVilleGrid from "./StudyVille/StudyVilleGrid";

export default function StudyVilleWindow({
  selectedItemToPlace,
  onClearSelection,
  onClose
}) {
  const [objects, setObjects] = useState([]);

  const handleTileClick = (x, y) => {
    if (!selectedItemToPlace) return;

    // Add new object at grid coordinates
    setObjects(prev => [
      ...prev,
      {
        src: selectedItemToPlace.image,
        x,
        y,
        offsetY: selectedItemToPlace.offsetY || 0
      }
    ]);

    // Clear selected item after placing once
    onClearSelection();
  };

  return (
    <div className="den-window" style={{ width: "1090px" }}>
      <div className="window-header">
        <span className="window-title">StudyVille</span>
        <button className="close-btn" onClick={onClose}>✖</button>
      </div>

      <div className="window-content" style={{ overflow: "hidden" }}>
        <StudyVilleGrid
          gridSize={8}
          objects={objects}
          onTileClick={handleTileClick}
          tileWidth={128}
          tileHeight={64}
        />
      </div>
    </div>
  );
}
