// Today's challenges. Each one fills up from what you actually did today,
// and pays its coins once when you claim it.
import React, { useCallback, useEffect, useState } from "react";
import { claimChallenge, getChallenges } from "../../../api/focus";
import Icon from "../Icon";

// Challenges follow UTC days, so tell people when that is on their clock.
function resetTime() {
  const midnightUtc = new Date();
  midnightUtc.setUTCHours(24, 0, 0, 0);
  return midnightUtc.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function ChallengesWindow({ onClose, onCoinsChange }) {
  const [list, setList] = useState(null);
  const [message, setMessage] = useState(null);
  const [claiming, setClaiming] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await getChallenges();
      setList(data.challenges);
    } catch (error) {
      setMessage({ kind: "error", text: `Couldn't load challenges. ${error.message}` });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleClaim = async (challenge) => {
    setClaiming(challenge.key);
    setMessage(null);
    try {
      const result = await claimChallenge(challenge.key);
      onCoinsChange?.(result.coins);
      setMessage({ kind: "success", text: `+${result.reward_coins} coins for "${challenge.title}"` });
      await load();
    } catch (error) {
      setMessage({ kind: "error", text: error.message });
    } finally {
      setClaiming(null);
    }
  };

  const done = list ? list.filter((c) => c.claimed).length : 0;

  return (
    <div className="den-window den-challenges" role="dialog" aria-labelledby="den-challenges-title">
      <div className="window-header">
        <span className="window-title" id="den-challenges-title">Today's challenges</span>
        <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
          ✖
        </button>
      </div>

      <p className="den-challenges-sub den-muted">
        {list ? `${done} of ${list.length} claimed. ` : ""}New challenges at {resetTime()}.
      </p>
      {message && <p className={`den-shop-message is-${message.kind}`}>{message.text}</p>}

      <div className="window-content">
        {!list && !message && <p className="den-muted">Loading…</p>}
        <ul className="den-challenge-list">
          {(list || []).map((c) => (
            <li key={c.key} className={`den-challenge ${c.claimed ? "is-claimed" : ""}`}>
              <div className="den-challenge-text">
                <span className="den-challenge-title">{c.title}</span>
                <div
                  className="den-challenge-track"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={c.target}
                  aria-valuenow={c.progress}
                  aria-label={`${c.title} progress`}
                >
                  <div className="den-challenge-fill" style={{ width: `${(c.progress / c.target) * 100}%` }} />
                </div>
                <span className="den-muted">
                  {c.progress} of {c.target}
                  {c.key === "focus-30" ? " min" : ""}
                </span>
              </div>

              {c.claimed ? (
                <span className="den-challenge-done">Claimed</span>
              ) : (
                <button
                  type="button"
                  className="den-item-buy"
                  disabled={!c.completed || claiming !== null}
                  onClick={() => handleClaim(c)}
                >
                  <Icon name="coin" size={14} style={{ color: "#fcd34d", verticalAlign: "-2px", marginRight: 4 }} />
                  {claiming === c.key ? "Claiming…" : c.completed ? `Claim ${c.reward_coins}` : `${c.reward_coins} coins`}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
