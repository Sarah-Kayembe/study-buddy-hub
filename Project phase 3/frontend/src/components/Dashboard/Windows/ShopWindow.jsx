// The Rewards window: spend coins in the shop, and see what you own.
// Owned items can be sent to StudyVille to place on the map.

import React, { useCallback, useEffect, useState } from "react";
import { buyItem, getInventory, getShop } from "../../../api/focus";
import { artFor } from "../studyvilleArt";
import Icon from "../Icon";

function ItemArt({ art, name }) {
  const drawing = artFor(art);
  return (
    <div className="den-item-art">
      {drawing ? <img src={drawing.src} alt="" /> : <span aria-hidden="true">?</span>}
      <span className="sr-only">{name}</span>
    </div>
  );
}

export default function ShopWindow({ onClose, onCoinsChange, onPlaceItem }) {
  const [tab, setTab] = useState("shop");
  const [shop, setShop] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [buying, setBuying] = useState(null);
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    try {
      const [shopData, inventoryData] = await Promise.all([getShop(), getInventory()]);
      setShop(shopData);
      setInventory(inventoryData);
    } catch (error) {
      setMessage({ kind: "error", text: `Couldn't load the shop. ${error.message}` });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleBuy = async (item) => {
    setBuying(item.item_id);
    setMessage(null);
    try {
      const result = await buyItem(item.item_id);
      setShop((prev) => ({ ...prev, coins: result.coins }));
      onCoinsChange?.(result.coins);
      setInventory(await getInventory());
      setMessage({ kind: "success", text: `Bought ${item.item_name}. Place it from My items.` });
    } catch (error) {
      setMessage({ kind: "error", text: error.message });
    } finally {
      setBuying(null);
    }
  };

  const coins = shop?.coins ?? 0;

  return (
    <div className="den-window den-shop" role="dialog" aria-labelledby="den-shop-title">
      <div className="window-header">
        <span className="window-title" id="den-shop-title">Rewards</span>
        <span className="den-shop-balance">
          <Icon name="coin" size={18} style={{ color: "#fcd34d" }} />
          {coins} coins
        </span>
        <button type="button" onClick={onClose} className="close-btn" aria-label="Close">
          ✖
        </button>
      </div>

      <div className="den-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "shop"} onClick={() => setTab("shop")}>
          Shop
        </button>
        <button type="button" role="tab" aria-selected={tab === "mine"} onClick={() => setTab("mine")}>
          My items{inventory?.length ? ` (${inventory.reduce((n, i) => n + i.quantity, 0)})` : ""}
        </button>
      </div>

      {message && <p className={`den-shop-message is-${message.kind}`}>{message.text}</p>}

      <div className="window-content">
        {!shop && !message && <p className="den-muted">Loading the shop…</p>}

        {shop && tab === "shop" && (
          <ul className="den-item-grid">
            {shop.items.map((item) => {
              const short = item.price - coins;
              return (
                <li key={item.item_id} className={`den-item-card rarity-${item.rarity_level}`}>
                  <ItemArt art={item.art} name={item.item_name} />
                  <span className="den-item-name">{item.item_name}</span>
                  <span className="den-item-rarity">{item.rarity_level}</span>
                  <button
                    type="button"
                    className="den-item-buy"
                    disabled={short > 0 || buying !== null}
                    onClick={() => handleBuy(item)}
                    title={item.description}
                  >
                    {buying === item.item_id
                      ? "Buying…"
                      : short > 0
                      ? `${short} more coins`
                      : `Buy for ${item.price}`}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {inventory && tab === "mine" && (
          inventory.length === 0 ? (
            <div className="den-empty">
              <p>You don't own anything yet.</p>
              <p className="den-muted">Every focused minute earns a coin. Spend them in the shop.</p>
              <button type="button" className="den-item-buy" onClick={() => setTab("shop")}>
                Go to the shop
              </button>
            </div>
          ) : (
            <ul className="den-item-grid">
              {inventory.map((item) => (
                <li key={item.item_id} className={`den-item-card rarity-${item.rarity_level}`}>
                  <ItemArt art={item.art} name={item.item_name} />
                  <span className="den-item-name">{item.item_name}</span>
                  <span className="den-item-count">
                    {item.placed} of {item.quantity} placed
                  </span>
                  <button
                    type="button"
                    className="den-item-buy"
                    disabled={item.available === 0}
                    onClick={() => onPlaceItem(item)}
                  >
                    {item.available === 0 ? "All placed" : "Place in StudyVille"}
                  </button>
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  );
}
