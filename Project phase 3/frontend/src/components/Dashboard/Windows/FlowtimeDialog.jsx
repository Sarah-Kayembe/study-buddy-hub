import React from "react";

export default function FlowtimeDialog({
  type,
  minutes,
  onStartBreak,
  onEndSession,
  onStartAnother,
}) {
  return (
    <div className="den-window-overlay flow-dialog-overlay">
      <div className="den-window flow-dialog">

        {/* Header */}
        <div className="window-header">
          <span className="window-title">
            {type === "limit" ? "Max Time Reached" : "Flowtime Stopped"}
          </span>
          <button className="close-btn" onClick={onEndSession}>✖</button>
        </div>

        {/* Content */}
        <div className="window-content" style={{ textAlign: "center" }}>
          <p className="dialog-message">
            You studied for <strong>{minutes} minutes</strong>.
          </p>

          <p className="dialog-message">
            What would you like to do next?
          </p>

          <div className="dialog-buttons">

            <button
              className="den-btn-primary"
              onClick={onStartBreak}
            >
              Start Break
            </button>

            <button
              className="den-btn-secondary"
              onClick={onEndSession}
            >
              End Session
            </button>

            <button
              className="den-btn-secondary"
              onClick={onStartAnother}
            >
              Start Another Flowtime
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}
