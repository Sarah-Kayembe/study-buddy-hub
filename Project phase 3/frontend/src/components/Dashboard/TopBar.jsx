// Author: Sarah Kayembe
// frontend/src/components/Dashboard/TopBar.jsx

import React, { useEffect, useRef } from "react";
import { API_BASE } from "../../api/base";
import { useNavigate } from "react-router-dom";
import Icon from "./Icon";

export default function TopBar({
  exp,
  level,
  money,
  streakDays,

  profileImage,

  firstName,
  lastName,
  email,
  userName,

  soundMuted,
  soundTheme,
  onOpenSoundSettings,

  onToggleUI,

  onProfileClick,
  showProfileMenu,
  setShowProfileMenu,

  onViewProfile,
  onLogout,
}) {
  const navigate = useNavigate();

  const menuRef = useRef(null);

  const displayName =
    firstName || userName || "User";

  useEffect(() => {
    function handleClickOutside(e) {
      if (!showProfileMenu) return;
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        if (typeof setShowProfileMenu === "function") {
          setShowProfileMenu(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileMenu, setShowProfileMenu]);

  const handleProfileToggle = () => {
    if (typeof setShowProfileMenu === "function") {
      setShowProfileMenu(!showProfileMenu);
      return;
    }
    if (typeof onProfileClick === "function") onProfileClick();
  };

  return (
    <>
      <div className="hud-top-left">
        <div
          style={{
            fontSize: "0.9rem",
            fontWeight: "bold",
            color: "#fcd34d",
          }}
        >
          Streak: {streakDays || 0}
        </div>

        <div
          style={{
            marginTop: 6,
            fontSize: "0.85rem",
            fontWeight: "bold",
            color: "#fcd34d",
          }}
        >
          EXP: {exp || 0}
        </div>

        <div
          style={{
            marginTop: 6,
            fontSize: "0.85rem",
            fontWeight: "bold",
            color: "#fcd34d",
          }}
        >
          Level: {level || 1} | Coins: {money || 0}
        </div>
      </div>

      <div className="hud-top-right" style={{ display: "flex", gap: "10px" }}>
        <button
          className="circle-btn"
          title={soundMuted ? "Unmute sound" : `Sound: ${soundTheme}`}
          onClick={onOpenSoundSettings}
          style={{
            width: "40px",
            height: "40px",
            opacity: soundMuted ? 0.4 : 1,
          }}
        >
          <Icon name="sound" title="sound" />
        </button>

        <button
          onClick={onToggleUI}
          className="circle-btn"
          title="Toggle UI"
          style={{ width: "40px", height: "40px" }}
        >
          <Icon name="eye" title="toggle interface" />
        </button>

        <button
          className="circle-btn"
          title="Settings"
          style={{ width: "40px", height: "40px" }}
        >
          <Icon name="settings" title="settings" />
        </button>

        <div style={{ position: "relative" }} ref={menuRef}>
          <div
            onClick={handleProfileToggle}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
              color: "white",
              userSelect: "none",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid white",
                boxShadow: "0 0 10px rgba(79, 70, 229, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(15,23,42,0.9)",
              }}
            >
              {profileImage ? (
                <img
                  src={`${API_BASE}/${profileImage}`}
                  alt="profile"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <Icon name="user" title="profile" />
              )}

            </div>

            <span style={{ marginTop: "4px", fontSize: "0.75rem" }}>
              {displayName}
            </span>
          </div>

          {showProfileMenu && (
            <div
              style={{
                position: "absolute",
                top: "55px",
                right: "0",
                background: "rgba(15,23,42,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                width: "190px",
                padding: "10px",
                zIndex: 200,
              }}
            >
              <div style={{ color: "white", fontWeight: "bold" }}>
                {(firstName || userName || "User")} {lastName || ""}
              </div>

              {email && (
                <div
                  style={{
                    color: "#7dd3fc",
                    fontSize: "0.8rem",
                    marginBottom: "10px",
                    wordBreak: "break-word",
                  }}
                >
                  {email}
                </div>
              )}

              <button
                onClick={onViewProfile}
                style={{
                  width: "100%",
                  padding: "6px 0",
                  background: "#0369a1",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  marginBottom: "6px",
                  cursor: "pointer",
                }}
              >
                View Profile
              </button>

              <button
                onClick={() => navigate("/home")}
                style={{
                  width: "100%",
                  padding: "6px 0",
                  background: "#334155",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  marginBottom: "6px",
                  cursor: "pointer",
                }}
              >
                Back to StudyBuddy
              </button>

              <button
                onClick={onLogout}
                style={{
                  width: "100%",
                  padding: "6px 0",
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
