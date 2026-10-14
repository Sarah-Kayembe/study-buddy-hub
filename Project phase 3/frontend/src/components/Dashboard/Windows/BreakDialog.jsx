import React from "react";

export default function BreakDialog({ message, onStartNext, onSkip }) {
  return (
    <div className="den-window-overlay break-dialog-overlay">
      <div className="den-window break-dialog">
        
        {/* Header */}
        <div className="window-header">
          <span className="window-title">Break Finished</span>
          <button className="close-btn" onClick={onSkip}>✖</button>
        </div>

        {/* Content */}
        <div className="window-content" style={{ textAlign: "center" }}>
          <p className="dialog-message">{message}</p>

          <div className="dialog-buttons">
            <button className="den-btn-primary" onClick={onStartNext}>
              Start Next Session
            </button>

            <button className="den-btn-secondary" onClick={onSkip}>
              Skip / End Session
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
