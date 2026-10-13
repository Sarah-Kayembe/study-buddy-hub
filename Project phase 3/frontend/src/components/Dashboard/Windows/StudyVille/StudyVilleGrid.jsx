// frontend/src/components/Dashboard/Windows/StudyVille/StudyVilleGrid.jsx
import React from "react";
import "./studyville.css";

// --- Isometric projection helper ---
const isoProject = (x, y, tileW, tileH) => {
  return {
    isoX: (x - y) * (tileW / 2),
    isoY: (x + y) * (tileH / 2)
  };
};

export default function StudyVilleGrid({
  gridSize = 8,
  objects = [],
  onTileClick,
  tileWidth = 128,     // width of your tile image
  tileHeight = 64      // height of your tile image
}) {
  const tiles = [];

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const { isoX, isoY } = isoProject(x, y, tileWidth, tileHeight);

      tiles.push(
        <div
          key={`tile-${x}-${y}`}
          className="iso-tile"
          onClick={() => onTileClick(x, y)}
          style={{
            transform: `translate(${isoX}px, ${isoY}px)`
          }}
        />
      );
    }
  }

  return (
    <div className="iso-grid">
      {/* ground tiles rendered first */}
      {tiles}

      {/* Render placed objects ABOVE tiles */}
      {objects.map((obj, i) => {
        const { isoX, isoY } = isoProject(obj.x, obj.y, tileWidth, tileHeight);

        return (
          <img
            key={`obj-${i}`}
            src={obj.src}
            alt=""
            className="iso-object"
            draggable={false}
            style={{
              transform: `translate(${isoX}px, ${isoY - (obj.offsetY || 0)}px)`
            }}
          />
        );
      })}
    </div>
  );
}
