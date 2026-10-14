// What the student earned when a session finishes. A normal session gets a
// small note that fades on its own; reaching a new level gets a bigger moment.

import { useEffect } from "react";
import Icon from "./Icon";

export function SessionRewardToast({ reward, onDone }) {
  useEffect(() => {
    const id = setTimeout(onDone, 4500);
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <div className="den-toast" role="status">
      <span className="den-toast-title">Session complete</span>
      <span className="den-toast-gain">
        <strong>+{reward.xp}</strong> XP
      </span>
      <span className="den-toast-gain">
        <Icon name="coin" size={16} style={{ color: "#fcd34d" }} />
        <strong>+{reward.coins}</strong> coins
      </span>
    </div>
  );
}

export function LevelUpCelebration({ level, reward, onClose }) {
  return (
    <div className="den-window-overlay" onClick={onClose}>
      <div
        className="den-levelup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="den-levelup-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="den-levelup-burst" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} style={{ "--i": i }} />
          ))}
        </div>
        <div className="den-levelup-badge">{level}</div>
        <h2 id="den-levelup-title">You reached level {level}</h2>
        <p>
          This session earned {reward.xp} XP and {reward.coins} coins, plus a{" "}
          {reward.level_up_coins} coin level-up bonus.
        </p>
        <button type="button" className="den-btn-primary" onClick={onClose} autoFocus>
          Keep going
        </button>
      </div>
    </div>
  );
}
