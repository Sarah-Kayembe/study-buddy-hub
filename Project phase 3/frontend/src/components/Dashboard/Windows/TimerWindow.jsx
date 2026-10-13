// frontend/src/components/Dashboard/Windows/TimerWindow.jsx
import React, { useState, useEffect, useRef } from "react";

export default function TimerWindow({
  timeLeft,
  isTimerRunning,
  flowSeconds,

  onStartSession,
  onCancelPreStart,
  onGiveUpRequest,
  onFlowtimeStop,
  onClose,
}) {
  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------
  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(
      2,
      "0"
    )}`;

  // ------------------------------------------------------------
  // Tabs
  // ------------------------------------------------------------
  const [tab, setTab] = useState("pomodoro");

  // Pomodoro settings
  const [pomoFocus, setPomoFocus] = useState(25);
  const [pomoShortBreak, setPomoShortBreak] = useState(5);
  const [pomoLongBreak, setPomoLongBreak] = useState(15);
  const [pomoRounds, setPomoRounds] = useState(4);

  // Custom settings
  const [customFocus, setCustomFocus] = useState(30);
  const [customBreak, setCustomBreak] = useState(5);

  const MAX_FLOW = 120;

  // ------------------------------------------------------------
  // Pre-start Countdown (NOW 5 seconds)
  // ------------------------------------------------------------
  const [isInPreStart, setIsInPreStart] = useState(false);
  const [preStartSeconds, setPreStartSeconds] = useState(0);
  const [canGiveUp, setCanGiveUp] = useState(false);

  const [sessionTotalSeconds, setSessionTotalSeconds] = useState(null);

  // ------------------------------------------------------------
  // Build Config
  // ------------------------------------------------------------
  const clamp = (v) => Math.max(1, Math.min(120, Number(v) || 1));

  const buildConfig = () => {
    if (tab === "pomodoro") {
      return {
        type: "pomodoro",
        focusMinutes: clamp(pomoFocus),
        shortBreakMinutes: clamp(pomoShortBreak),
        longBreakMinutes: clamp(pomoLongBreak),
        rounds: Math.max(1, Math.min(8, pomoRounds)),
      };
    }

    if (tab === "flowtime")
      return { type: "flowtime", maxMinutes: MAX_FLOW };

    return {
      type: "custom",
      focusMinutes: clamp(customFocus),
      breakMinutes: clamp(customBreak),
    };
  };


  useEffect(() => {
    if (!isInPreStart || preStartSeconds <= 0) return;

    const id = setInterval(() => {
      setPreStartSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setIsInPreStart(false);
          setCanGiveUp(true);

          const config = buildConfig();

          if (config.type !== "flowtime") {
            setSessionTotalSeconds((config.focusMinutes || 25) * 60);
          } else {
            setSessionTotalSeconds(null);
          }

          onStartSession(config);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [isInPreStart]);

  // ------------------------------------------------------------
  // Start / Give Up Button Logic
  // ------------------------------------------------------------
  const isGiveUp = isTimerRunning && canGiveUp && !isInPreStart;

  const handleStartClick = () => {
    // *** GIVE UP ***
    if (isGiveUp) {
      onGiveUpRequest?.();
      return;
    }

    // Cancel 5-sec pre-start
    if (isInPreStart) {
      setIsInPreStart(false);
      setPreStartSeconds(0);
      onCancelPreStart?.();
      return;
    }

    // Begin new countdown
    setCanGiveUp(false);
    setIsInPreStart(true);
    setPreStartSeconds(5); // <-- HERE YOU CONTROL THE COUNTDOWN
  };

  const getPrimaryLabel = () => {
    if (isInPreStart) return `Cancel (${preStartSeconds}s)`;
    if (isGiveUp) return "Give Up";
    if (tab === "flowtime") return "Start Flowtime";
    if (tab === "custom") return "Start Custom Timer";
    return "Start Pomodoro";
  };

  // ------------------------------------------------------------
  // Arc Progress
  // ------------------------------------------------------------
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  let progress = 0;

  if (tab === "flowtime") {
    progress = isTimerRunning ? 0.25 : 0;
  } else if (sessionTotalSeconds) {
    const used = sessionTotalSeconds - timeLeft;
    progress = Math.min(1, Math.max(0, used / sessionTotalSeconds));
  }

  const dashOffset = circumference - circumference * progress;

  // ------------------------------------------------------------
  // DRAGGABLE TIMER (INSIDE WINDOW)
  // ------------------------------------------------------------
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);
  const containerRef = useRef(null);

  const startDrag = (e) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: dragPos.x,
      origY: dragPos.y,
      bounds: rect,
    };

    window.addEventListener("mousemove", moveDrag);
    window.addEventListener("mouseup", endDrag);
  };

  const moveDrag = (e) => {
    if (!dragRef.current) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    setDragPos({
      x: dragRef.current.origX + dx,
      y: dragRef.current.origY + dy,
    });
  };

  const endDrag = () => {
    dragRef.current = null;
    window.removeEventListener("mousemove", moveDrag);
    window.removeEventListener("mouseup", endDrag);
  };

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  return (
    <div className="spirit-window" style={{ width: "460px" }}>
      {/* HEADER */}
      <div className="window-header">
        <span className="window-title">Study Timer</span>
        <button className="close-btn" onClick={onClose}>
          ✖
        </button>
      </div>

      {/* TABS */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {["pomodoro", "flowtime", "custom"].map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setIsInPreStart(false);
              setPreStartSeconds(0);
              setCanGiveUp(false);
              setSessionTotalSeconds(null);
            }}
            style={{
              flex: 1,
              padding: "10px 0",
              background:
                tab === t ? "rgba(124,124,255,0.18)" : "transparent",
              color: tab === t ? "white" : "#9ca3af",
              border: "none",
            }}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="window-content" style={{ textAlign: "center" }}>
        {/* DRAGGABLE TIMER */}
        <div
          ref={containerRef}
          style={{ position: "relative", height: 230 }}
        >
          <div
            onMouseDown={startDrag}
            style={{
              width: 200,
              height: 200,
              position: "absolute",
              zIndex: 200,
              top: "50%",
              left: "50%",
              transform: `translate(calc(-50% + ${dragPos.x}px), calc(-50% + ${dragPos.y}px))`,
              cursor: "grab",
              pointerEvents: "auto",
            }}
          >
            {/* Glow */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: isTimerRunning
                  ? "radial-gradient(circle at 30% 20%, rgba(168,85,247,0.45), transparent)"
                  : "radial-gradient(circle at 30% 20%, rgba(15,23,42,0.6), transparent)",
                filter: isTimerRunning ? "blur(12px)" : "blur(8px)",
                pointerEvents: "none",
              }}
            />

            {/* ARC */}
            <svg
              viewBox="0 0 120 120"
              style={{
                position: "absolute",
                inset: 0,
                transform: "rotate(-90deg)",
                pointerEvents: "none",
              }}
            >
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="rgba(31,41,55,0.9)"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="#a855f7"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{
                  transition: "stroke-dashoffset 0.3s linear",
                  filter: "drop-shadow(0 0 10px rgba(168,85,247,1))",
                }}
              />
            </svg>

            {/* TIME */}
            <div
              style={{
                position: "absolute",
                inset: 12,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle at 30% 20%, #111827, #020617)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <span
                style={{
                  fontSize: "3.2rem",
                  fontFamily: "monospace",
                  color: "white",
                }}
              >
                {tab === "flowtime"
                  ? formatTime(flowSeconds)
                  : formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        {/* SETTINGS */}
        {tab === "pomodoro" && (
          <>
            <FieldRow
              label="Focus (min)"
              value={pomoFocus}
              onChange={setPomoFocus}
            />
            <FieldRow
              label="Short Break"
              value={pomoShortBreak}
              onChange={setPomoShortBreak}
            />
            <FieldRow
              label="Long Break"
              value={pomoLongBreak}
              onChange={setPomoLongBreak}
            />
            <FieldRow
              label="Rounds"
              value={pomoRounds}
              onChange={setPomoRounds}
              min={1}
              max={8}
            />
          </>
        )}

        {tab === "custom" && (
          <>
            <FieldRow
              label="Focus (min)"
              value={customFocus}
              onChange={setCustomFocus}
            />
            <FieldRow
              label="Break (min)"
              value={customBreak}
              onChange={setCustomBreak}
            />
          </>
        )}

        {tab === "flowtime" && (
          <div style={{ padding: 12, opacity: 0.8 }}>
            Counts up until you press Stop (max {MAX_FLOW} min)
          </div>
        )}

        {/* BUTTONS */}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="spirit-btn-primary" onClick={handleStartClick}>
            {getPrimaryLabel()}
          </button>

          {/* Flow STOP button */}
          {tab === "flowtime" && isTimerRunning && !isInPreStart && (
            <button
              className="spirit-btn-secondary"
              onClick={onFlowtimeStop}
            >
              Stop Flow
            </button>
          )}

          {/* GiveUp for Pomodoro + Custom */}
          {tab !== "flowtime" &&
            isTimerRunning &&
            canGiveUp &&
            !isInPreStart && (
              <button
                className="spirit-btn-secondary"
                style={{
                  background: "rgba(239,68,68,0.15)",
                  color: "#fca5a5",
                }}
                onClick={onGiveUpRequest}
              >
                Give Up
              </button>
            )}
        </div>
      </div>
    </div>
  );
}

function FieldRow({ label, value, onChange, min = 1, max = 120 }) {
  return (
    <div
      style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}
    >
      <span style={{ color: "#e5e7eb" }}>{label}</span>
      <input
        type="number"
        className="spirit-input"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: 110, textAlign: "right" }}
      />
    </div>
  );
}
