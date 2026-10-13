// frontend/src/components/Dashboard/LeftSidebar.jsx
// Updated by Sarah Kayembe

import React from "react";
import { useNavigate } from "react-router-dom";

import studyvilleIcon from "../../assets/Ville1.webp";
import inventoryIcon from "../../assets/Buddies.webp";
import challengesIcon from "../../assets/Inventory.webp";
import groupsIcon from "../../assets/Challenge1.webp";
import leaderboardIcon from "../../assets/Leaderboard.webp";

const MenuBtn = ({ label, icon, onClick, isActive }) => (
  <button 
    onClick={onClick}
    className={`sidebar-btn ${isActive ? "active" : ""}`}
  >
    <div className="sidebar-icon">
      <img src={icon} alt={label} className="sidebar-img" />
      {isActive && <span className="magic-ring"></span>}
    </div>
    <span className="sidebar-label">{label}</span>
  </button>
);

export default function LeftSidebar({
  activeWindow,
  onOpenStudyVille,
  onOpenRewards,
  onOpenGroups,
  onOpenLeaderboard
}) {

  const navigate = useNavigate();

  return (
    <>
      {/* STUDYVILLE */}
      <MenuBtn
        label="StudyVille"
        icon={studyvilleIcon}
        isActive={activeWindow === "studyville"}
        onClick={onOpenStudyVille}
      />

      {/* BUDDIES — Redirect to studyGroups.jsx */}
      <MenuBtn
        label="Buddies"
        icon={inventoryIcon}
        isActive={false}
        onClick={() => navigate("/groups")}
      />

      {/* REWARDS */}
      <MenuBtn
        label="Rewards"
        icon={challengesIcon}
        isActive={activeWindow === "rewards"}
        onClick={() => alert("Rewards Coming Soon")}
      />

      {/* CHALLENGES (your previous groups button) */}
      <MenuBtn
        label="Challenges"
        icon={groupsIcon}
        isActive={activeWindow === "groups"}
        onClick={onOpenGroups}
      />

      {/* LEADERBOARD */}
      <MenuBtn
        label="Rankings"
        icon={leaderboardIcon}
        isActive={activeWindow === "leaderboard"}
        onClick={onOpenLeaderboard}
      />
    </>
  );
}
