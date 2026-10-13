// frontend/src/components/Dashboard/QuickMenu.jsx
// Updated by Sarah Kayembe

import React from "react";
import { useNavigate } from "react-router-dom";

// Import icons
import PomodoroIcon from "../../assets/Pomodoro1.webp";
import TasksIcon from "../../assets/Tasks.webp";
import CalendarIcon from "../../assets/Calendar1.webp";
import TimelineIcon from "../../assets/Statistics.webp";

const QuickBtn = ({ icon, label, onClick, isActive }) => (
  <div className="quick-btn-wrapper">
    <button 
      onClick={onClick} 
      className={`quick-btn ${isActive ? "active" : ""}`}
    >
      <img src={icon} alt={label} className="quick-btn-img" />
      {isActive && <span className="magic-ring"></span>}
    </button>

    <span className="quick-tooltip">{label}</span>
  </div>
);

export default function QuickMenu({
  activeQuick,
  setActiveQuick,
  onToggleTimer,
  onToggleTasks,
  onToggleStats,
  nextTask,
  timerRunning,
  remainingTime,
  currentTime
}) {

  const navigate = useNavigate();

  return (
    <div className="quick-menu-container">
      
      {/* Icons Row */}
      <div className="quick-icons-row">

        {/* Pomodoro */}
        <QuickBtn 
          icon={PomodoroIcon} 
          label="Pomodoro" 
          isActive={activeQuick === "timer"}
          onClick={() => { setActiveQuick("timer"); onToggleTimer(); }}
        />

        {/* Tasks */}
        <QuickBtn 
          icon={TasksIcon}
          label="Tasks"
          isActive={activeQuick === "tasks"}
          onClick={() => { setActiveQuick("tasks"); onToggleTasks(); }}
        />

        {/* Calendar — Redirect to /groups */}
        <QuickBtn 
          icon={CalendarIcon}
          label="Calendar"
          isActive={activeQuick === "calendar"}
          onClick={() => navigate("/groups")}
        />

        {/* Timeline */}
        <QuickBtn 
          icon={TimelineIcon}
          label="Timeline"
          isActive={activeQuick === "timeline"}
          onClick={() => { setActiveQuick("timeline"); onToggleStats(); }}
        />

      </div>

      {/* Info Panel */}
      <div className="quick-info-panel">
        
        <div className="quick-panel-left">
          <div className="quick-panel-task">
            {nextTask ? nextTask : "No tasks"}
          </div>

          <div className="quick-panel-status">
            {timerRunning ? `Time left: ${remainingTime}` : "No active timer"}
          </div>
        </div>

        <div className="quick-panel-clock">
          {currentTime}
        </div>

      </div>
    </div>
  );
}
