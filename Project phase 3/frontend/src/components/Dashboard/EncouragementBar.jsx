import React, { useState, useEffect } from "react";
import Icon from "./Icon";

const ACTIVE_MESSAGES = [
  "Well done for studying — you're doing amazing!",
  "Stay focused — your future self will thank you.",
  "Do not worry about this page — focus on your work.",
  "Small steps today create big results tomorrow.",
  "Keep going! Your rewards are getting closer.",
  "You got this — deep breath and keep studying.",
  "Your dedication is inspiring. Keep it up!",
];

export default function EncouragementBar({
  mode = "focus",
  setMode = () => {},
  onOpenMood,
  isTimerRunning,
  username = "Student",
}) {
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  // Rotate encouragement messages ONLY when timer is running
  useEffect(() => {
    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % ACTIVE_MESSAGES.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const currentMessage = isTimerRunning
    ? ACTIVE_MESSAGES[messageIndex]
    : `Welcome back, ${username}!`;

  const safeMode = mode || "focus";

  return (
    <>
      {/* MODE BUTTON + POPUP */}
      <div style={{ position: "relative" }}>
        {/* POPUP WINDOW (purple glass style) */}
        {showModeMenu && (
          <div
            className="mode-popup"
            style={{
              position: "absolute",
              bottom: "70px",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            {["focus", "break", "chill"].map((m) => (
              <button
                key={m}
                className={safeMode === m ? "active-mode" : ""}
                onClick={() => {
                  setMode(m);
                  setShowModeMenu(false);
                }}
              >
                <Icon name={m} size={20} />
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {/* MAIN MODE BUTTON */}
        <button
          onClick={() => setShowModeMenu((p) => !p)}
          className="circle-btn"
          title="Switch Mode"
        >
          <Icon name={safeMode} size={26} title={safeMode} />
        </button>
      </div>

      {/* ENCOURAGEMENT BOX */}
      <div className="encouragement-box">
        <div className="mode-title">
          {safeMode.charAt(0).toUpperCase() + safeMode.slice(1)} Mode
        </div>
        <div className="quote-text">{currentMessage}</div>
      </div>

      {/* MOOD BUTTON */}
      <button
        onClick={onOpenMood}
        className="circle-btn"
        title="Log Mood"
        type="button"
      >
        <Icon name="mood" size={26} title="mood" />
      </button>
    </>
  );
}
