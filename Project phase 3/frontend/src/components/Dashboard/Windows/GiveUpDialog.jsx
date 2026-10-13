import React from "react";

export default function GiveUpDialog({ onCancel, onConfirm }) {
  return (
    <div className="spirit-window-overlay giveup-dialog-overlay">
      <div className="spirit-window giveup-dialog">

        {/* Header */}
        <div className="window-header">
          <span className="window-title">Give Up?</span>
          <button className="close-btn" onClick={onCancel}>✖</button>
        </div>

        {/* Content */}
        <div className="window-content" style={{ textAlign: "center" }}>
          <p className="dialog-message">
            Are you sure you want to give up?
          </p>

          <p className="dialog-submessage">
            If you give up now, a <strong>ruined item</strong> will appear in your StudyVille.
          </p>

          <div className="dialog-buttons" style={{ marginTop: "18px" }}>
            <button 
              className="spirit-btn-secondary"
              onClick={onCancel}
              style={{ padding: "10px" }}
            >
              No, continue
            </button>

            <button 
              onClick={onConfirm}
              style={{
                padding: "10px",
                borderRadius: "10px",
                background: "rgba(239, 68, 68, 0.25)",
                border: "1px solid rgba(239, 68, 68, 0.5)",
                color: "#fecaca",
                fontWeight: "700",
                cursor: "pointer",
                transition: "0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.25)";
              }}
            >
              GIVE UP
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
