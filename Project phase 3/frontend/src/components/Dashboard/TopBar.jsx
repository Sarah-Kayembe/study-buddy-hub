// Author: Sarah Kayembe
// frontend/src/components/Dashboard/TopBar.jsx
//
// The Focus Den header. It mirrors the main site's navigation bar so the
// den feels like part of StudyBuddy, and shows the student's real level,
// XP, streak and coins from the backend.

import React, { useEffect, useRef } from "react";
import { API_BASE } from "../../api/base";
import Icon from "./Icon";

function plural(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export default function TopBar({
  progress,

  profileImage,
  firstName,
  lastName,
  email,

  soundMuted,
  soundTheme,
  onOpenSoundSettings,
  onToggleUI,

  showProfileMenu,
  setShowProfileMenu,
  onViewProfile,
  onLeave,
  onLogout,
}) {
  const menuRef = useRef(null);
  const displayName = firstName || "Student";

  const level = progress?.level ?? 1;
  const xpInto = progress?.xp_into_level ?? 0;
  const xpNeeded = progress?.xp_for_next_level ?? 0;
  const percent = progress?.percent_to_next_level ?? 0;
  const streak = progress?.streak_days ?? 0;
  const coins = progress?.coins ?? 0;

  useEffect(() => {
    function handleClickOutside(e) {
      if (!showProfileMenu) return;
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileMenu, setShowProfileMenu]);

  return (
    <header className="den-header">
      <div className="den-header-brand">
        <button
          type="button"
          className="den-back-link"
          onClick={() => onLeave("/home")}
          title="Back to StudyBuddy Hub"
        >
          <Icon name="back" size={18} />
          <span>StudyBuddy</span>
        </button>
        <span className="den-header-title">Focus Den</span>
      </div>

      <div className="den-progress" aria-label="Your progress">
        <div className="den-level" title={`${xpInto} of ${xpNeeded} XP to level ${level + 1}`}>
          <span className="den-level-badge">{level}</span>
          <div className="den-level-text">
            <span className="den-level-label">Level {level}</span>
            <div
              className="den-xp-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              aria-label="XP toward next level"
            >
              <div className="den-xp-fill" style={{ width: `${percent}%` }} />
            </div>
            <span className="den-xp-numbers">
              {xpInto} / {xpNeeded} XP
            </span>
          </div>
        </div>

        <div
          className={`den-stat ${streak > 0 ? "is-lit" : ""}`}
          title={streak > 0 ? `${plural(streak, "day")} in a row` : "Finish a session to start a streak"}
        >
          <Icon name="flame" size={20} style={{ color: streak > 0 ? "#fb923c" : "#64748b" }} />
          <span>{plural(streak, "day")}</span>
        </div>

        <div className="den-stat" title="Coins to spend in the shop">
          <Icon name="coin" size={20} style={{ color: "#fcd34d" }} />
          <span>{coins}</span>
        </div>
      </div>

      <div className="den-header-actions">
        <button
          type="button"
          className={`den-icon-btn ${soundMuted ? "is-muted" : ""}`}
          title={soundMuted ? "Sound is off" : `Sound: ${soundTheme}`}
          onClick={onOpenSoundSettings}
        >
          <Icon name="sound" title="Sound settings" />
        </button>

        <button type="button" className="den-icon-btn" title="Hide the interface" onClick={onToggleUI}>
          <Icon name="eye" title="Hide the interface" />
        </button>

        <div className="den-profile" ref={menuRef}>
          <button
            type="button"
            className="den-avatar"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            aria-expanded={showProfileMenu}
            title={displayName}
          >
            {profileImage ? (
              <img src={`${API_BASE}/${profileImage}`} alt="" />
            ) : (
              <Icon name="user" title="Profile" />
            )}
          </button>

          {showProfileMenu && (
            <div className="den-profile-menu">
              <div className="den-profile-name">
                {displayName} {lastName || ""}
              </div>
              {email && <div className="den-profile-email">{email}</div>}

              <button type="button" onClick={onViewProfile}>
                View profile
              </button>
              <button type="button" onClick={() => onLeave("/home")}>
                StudyBuddy home
              </button>
              <button type="button" onClick={() => onLeave("/quizzes")}>
                Quizzes
              </button>
              <button type="button" onClick={() => onLeave("/groups")}>
                Study groups
              </button>
              <button type="button" className="is-danger" onClick={onLogout}>
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
