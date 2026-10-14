// frontend/src/components/Dashboard/Windows/StudyVilleWindow.jsx
// Your town. Pick an item you own from the tray, then click an open tile
// to place it. Click something already placed to put it back in the tray.
// Everything is saved to your account.
import React, { useCallback, useEffect, useState } from "react";
import StudyVilleGrid from "./StudyVille/StudyVilleGrid";
import { getCity, getInventory, placeItem, removeFromCity } from "../../../api/focus";
import { artFor } from "../studyvilleArt";

export default function StudyVilleWindow({ initialItemId = null, onOpenShop, onClose }) {
  const [city, setCity] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(initialItemId);
  const [selectedPlacement, setSelectedPlacement] = useState(null);
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [cityData, inventoryData] = await Promise.all([getCity(), getInventory()]);
      setCity(cityData);
      setInventory(inventoryData);
    } catch (error) {
      setMessage(`Couldn't load StudyVille. ${error.message}`);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selectedItem = inventory.find((i) => i.item_id === selectedItemId && i.available > 0);
  const placeable = inventory.filter((i) => i.available > 0);

  const handleTileClick = async (x, y) => {
    setSelectedPlacement(null);
    if (!selectedItem || saving) return;
    if (city.some((c) => c.position_x === x && c.position_y === y)) {
      setMessage("Something is already on that spot.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await placeItem(selectedItem.item_id, x, y);
      await load();
      // Keep the same item selected if there are more copies to place.
      if (selectedItem.available <= 1) setSelectedItemId(null);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePutAway = async () => {
    if (!selectedPlacement || saving) return;
    setSaving(true);
    setMessage(null);
    try {
      await removeFromCity(selectedPlacement.layout_id);
      setSelectedPlacement(null);
      await load();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  let hint = "Pick something from your items, then click an open tile.";
  if (selectedItem) hint = `Click an open tile to place your ${selectedItem.item_name}.`;
  if (selectedPlacement) hint = `${selectedPlacement.item_name} selected.`;

  return (
    <div className="den-window den-studyville" role="dialog" aria-labelledby="den-studyville-title">
      <div className="window-header">
        <span className="window-title" id="den-studyville-title">StudyVille</span>
        <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
          ✖
        </button>
      </div>

      <div className="den-studyville-bar">
        <span className="den-muted">{hint}</span>
        {selectedPlacement && (
          <button type="button" className="den-item-buy" onClick={handlePutAway} disabled={saving}>
            Put back in my items
          </button>
        )}
        {selectedItem && (
          <button type="button" className="den-link-btn" onClick={() => setSelectedItemId(null)}>
            Cancel
          </button>
        )}
      </div>
      {message && <p className="den-shop-message is-error">{message}</p>}

      <div className="iso-scroll">
        <StudyVilleGrid
          objects={city}
          onTileClick={handleTileClick}
          onObjectClick={(obj) => {
            setSelectedItemId(null);
            setSelectedPlacement((prev) => (prev?.layout_id === obj.layout_id ? null : obj));
          }}
          selectedLayoutId={selectedPlacement?.layout_id}
          placing={Boolean(selectedItem)}
        />
      </div>

      <div className="den-tray" aria-label="Items you can place">
        {loaded && placeable.length === 0 && (
          <p className="den-muted">
            Nothing left to place.{" "}
            <button type="button" className="den-link-btn" onClick={onOpenShop}>
              Visit the shop
            </button>
          </p>
        )}
        {placeable.map((item) => {
          const art = artFor(item.art);
          return (
            <button
              type="button"
              key={item.item_id}
              className={`den-tray-item ${selectedItemId === item.item_id ? "is-active" : ""}`}
              aria-pressed={selectedItemId === item.item_id}
              onClick={() => {
                setSelectedPlacement(null);
                setSelectedItemId((prev) => (prev === item.item_id ? null : item.item_id));
              }}
            >
              {art && <img src={art.src} alt="" />}
              <span>{item.item_name}</span>
              <span className="den-tray-count">×{item.available}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
