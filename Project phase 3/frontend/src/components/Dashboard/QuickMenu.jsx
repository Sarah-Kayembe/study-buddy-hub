// frontend/src/components/Dashboard/QuickMenu.jsx
// Updated by Sarah Kayembe
//
// The dock along the bottom of the Focus Den: room mood, the quick tools
// (timer, tasks, calendar, stats), what's up next, and the mood check-in.

import React, { useEffect, useState } from "react";
import Icon from "./Icon";

import PomodoroIcon from "../../assets/Pomodoro1.webp";
import TasksIcon from "../../assets/Tasks.webp";
import CalendarIcon from "../../assets/Calendar1.webp";
import TimelineIcon from "../../assets/Statistics.webp";

const ROOM_MODES = [
  { id: "focus", label: "Focus" },
  { id: "break", label: "Break" },
  { id: "chill", label: "Chill" },
];

const ACTIVE_MESSAGES = [
  "Well done for studying. You're doing amazing!",
  "Stay focused. Your future self will thank you.",
  "Don't worry about this page, focus on your work.",
  "Small steps today create big results tomorrow.",
  "Keep going! Your rewards are getting closer.",
  "You got this. Deep breath and keep studying.",
  "Your dedication is inspiring. Keep it up!",
];

function timeNow() {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
}

// Sarah's clock: the current time, checked every few seconds.
function DockClock() {
  const [time, setTime] = useState(timeNow);
  useEffect(() => {
    const id = setInterval(() => setTime(timeNow()), 5000);
    return () => clearInterval(id);
  }, []);
  return (
    <time className="den-dock-clock" aria-label={`Current time ${time}`}>
      {time}
    </time>
  );
}

const QuickBtn = ({ icon, label, onClick, isActive }) => (
  <button
    type="button"
    onClick={onClick}
    className={`den-dock-tool ${isActive ? "is-active" : ""}`}
    aria-pressed={isActive}
  >
    <img src={icon} alt="" />
    <span>{label}</span>
  </button>
);

export default function QuickMenu({
  activeWindow,
  onToggleTimer,
  onToggleTasks,
  onToggleCalendar,
  onToggleStats,
  onOpenMood,
  roomMode,
  setRoomMode,
  nextTask,
  timerRunning,
  firstName,
}) {
  const [messageIndex, setMessageIndex] = useState(0);

  // Rotate encouragement messages only while a session is running.
  useEffect(() => {
    if (!timerRunning) return undefined;
    const id = setInterval(
      () => setMessageIndex((i) => (i + 1) % ACTIVE_MESSAGES.length),
      8000
    );
    return () => clearInterval(id);
  }, [timerRunning]);

  const message = timerRunning
    ? ACTIVE_MESSAGES[messageIndex]
    : `Welcome back${firstName ? `, ${firstName}` : ""}! Start a timer when you're ready.`;

  return (
    <nav className="den-dock" aria-label="Focus Den tools">
      <div className="den-room-modes" role="group" aria-label="Room lighting">
        {ROOM_MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            className={roomMode === mode.id ? "is-active" : ""}
            aria-pressed={roomMode === mode.id}
            onClick={() => setRoomMode(mode.id)}
          >
            <Icon name={mode.id} size={18} />
            <span>{mode.label}</span>
          </button>
        ))}
      </div>

      <div className="den-dock-tools">
        <QuickBtn icon={PomodoroIcon} label="Timer" isActive={activeWindow === "timer"} onClick={onToggleTimer} />
        <QuickBtn icon={TasksIcon} label="Tasks" isActive={activeWindow === "tasks"} onClick={onToggleTasks} />
        <QuickBtn icon={CalendarIcon} label="Calendar" isActive={activeWindow === "calendar"} onClick={onToggleCalendar} />
        <QuickBtn icon={TimelineIcon} label="Stats" isActive={activeWindow === "stats"} onClick={onToggleStats} />
      </div>

      <div className="den-dock-note">
        <span className="den-dock-next">{nextTask ? `Up next: ${nextTask}` : "No tasks yet"}</span>
        <span className="den-dock-message">{message}</span>
      </div>

      <DockClock />

      <button type="button" className="den-icon-btn den-mood-btn" onClick={onOpenMood} title="How are you feeling?">
        <Icon name="mood" size={22} title="Log your mood" />
      </button>
    </nav>
  );
}
