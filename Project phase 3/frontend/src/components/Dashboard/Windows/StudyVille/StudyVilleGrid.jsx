// frontend/src/components/Dashboard/Windows/StudyVille/StudyVilleGrid.jsx
// Isometric StudyVille map. Tiles are buttons, and placed items are drawn
// back to front so nearer items overlap the ones behind them.
import React from "react";
import { artFor } from "../../studyvilleArt";
import "./studyville.css";

const ART_WIDTH = 128; // the drawings are made for a 128 x 64 tile
const TALLEST_ART = 110; // tallest drawing above its tile, at full size

export default function StudyVilleGrid({
  gridSize = 8,
  objects = [],
  onTileClick,
  onObjectClick,
  selectedLayoutId,
  placing = false,
  tileWidth = 96,
}) {
  const tileHeight = tileWidth / 2;
  const scale = tileWidth / ART_WIDTH;
  const top = Math.ceil(TALLEST_ART * scale);
  const width = gridSize * tileWidth;
  const height = gridSize * tileHeight + top;

  const position = (x, y) => ({
    left: (x - y) * (tileWidth / 2) + ((gridSize - 1) * tileWidth) / 2,
    top: (x + y) * (tileHeight / 2) + top,
  });

  const occupied = new Set(objects.map((o) => `${o.position_x},${o.position_y}`));

  const tiles = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const { left, top: tileTop } = position(x, y);
      const taken = occupied.has(`${x},${y}`);
      tiles.push(
        <button
          type="button"
          key={`tile-${x}-${y}`}
          className={`iso-tile ${placing && !taken ? "is-open" : ""}`}
          style={{ left, top: tileTop, width: tileWidth, height: tileHeight }}
          onClick={() => onTileClick(x, y)}
          aria-label={`Tile ${x + 1}, ${y + 1}${taken ? " (taken)" : ""}`}
        />
      );
    }
  }

  const sorted = [...objects].sort(
    (a, b) => a.position_x + a.position_y - (b.position_x + b.position_y)
  );

  return (
    <div className={`iso-grid ${placing ? "is-placing" : ""}`} style={{ width, height }}>
      {tiles}

      {sorted.map((obj) => {
        const art = artFor(obj.art);
        if (!art) return null;
        const { left, top: tileTop } = position(obj.position_x, obj.position_y);
        const lift = art.offsetY * scale;
        return (
          <button
            type="button"
            key={obj.layout_id}
            className={`iso-object ${selectedLayoutId === obj.layout_id ? "is-selected" : ""}`}
            style={{
              left,
              top: tileTop - lift,
              width: tileWidth,
              zIndex: 10 + obj.position_x + obj.position_y,
            }}
            onClick={() => onObjectClick?.(obj)}
            aria-label={obj.item_name}
          >
            <img src={art.src} alt="" draggable={false} />
          </button>
        );
      })}
    </div>
  );
}
