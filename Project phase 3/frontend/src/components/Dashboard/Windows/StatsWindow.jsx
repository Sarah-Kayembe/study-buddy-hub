// StatsWindow.jsx
// Updated by Sarah Kayembe

import React, { useEffect, useState } from "react";
import { API_BASE } from "../../../api/base";

export default function StatsWindow({ onClose }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/focus/stats`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => {});
  }, []);

  // LOADING STATE
  if (!stats) {
    return (
      <div className="spirit-window-overlay">
        <div className="spirit-window" style={{ width: "520px" }}>
          <div className="window-header">
            <span className="window-title">Statistics</span>
            <button className="close-btn" onClick={onClose}>✖</button>
          </div>

          <div className="window-content">
            <p style={{ color: "#e5e7eb" }}>Loading statistics...</p>
          </div>
        </div>
      </div>
    );
  }

  // SAFE EXTRACTION WITH DEFAULTS
  const totalMinutes = stats.total_focus_time_min ?? 0;
  const totalSessions = stats.total_sessions ?? 0;
  const avgDuration = stats.avg_duration_min ?? 0;
  const longestStreak = stats.longest_streak_days ?? 0;
  const currentStreak = stats.current_streak_days ?? 0;

  return (
    <div className="spirit-window-overlay">
      <div
        className="spirit-window"
        style={{
          width: "600px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div className="window-header">
          <span className="window-title">Focus Statistics</span>
          <button className="close-btn" onClick={onClose}>✖</button>
        </div>

        <div className="window-content">

          {/* TOTALS */}
          <section style={{ marginBottom: "22px" }}>
            <h3 style={{ color: "white", marginBottom: 10 }}>Overall</h3>

            <p style={{ color: "#7dd3fc" }}>
              Total Focus Time: {totalMinutes} minutes
            </p>

            <p style={{ color: "#7dd3fc" }}>
              Total Sessions: {totalSessions}
            </p>

            <p style={{ color: "#7dd3fc" }}>
              Average Duration: {avgDuration} minutes
            </p>
          </section>

          {/* STREAKS */}
          <section style={{ marginBottom: "22px" }}>
            <h3 style={{ color: "white", marginBottom: 10 }}>Streaks</h3>

            <p style={{ color: "#7dd3fc" }}>
              Current Streak: {currentStreak} days
            </p>

            <p style={{ color: "#7dd3fc" }}>
              Longest Streak: {longestStreak} days
            </p>
          </section>

          {/* LAST ACTIVE */}
          <section style={{ marginBottom: "22px" }}>
            <h3 style={{ color: "white", marginBottom: 10 }}>Last Activity</h3>

            <p style={{ color: "#7dd3fc" }}>
              Last Session: {stats.last_session_at || "No sessions yet"}
            </p>
          </section>

          {/* FAVORITES */}
          <section style={{ marginBottom: "22px" }}>
            <h3 style={{ color: "white", marginBottom: 10 }}>Favorites</h3>

            <p style={{ color: "#7dd3fc" }}>
              Favorite Item Type: {stats.favorite_item_type || "None"}
            </p>

            <p style={{ color: "#7dd3fc" }}>
              Favorite Item Name: {stats.favorite_item_name || "None"}
            </p>

            <p style={{ color: "#7dd3fc" }}>
              Most Frequent Topic: {stats.most_frequent_topic || "None"}
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
