// frontend/src/components/Dashboard/LeftSidebar.jsx
// Updated by Sarah Kayembe

import React from "react";

import studyvilleIcon from "../../assets/Ville1.webp";
import inventoryIcon from "../../assets/Buddies.webp";
import challengesIcon from "../../assets/Inventory.webp";
import groupsIcon from "../../assets/Challenge1.webp";
import leaderboardIcon from "../../assets/Leaderboard.webp";

const MenuBtn = ({ label, icon, onClick, isActive }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={isActive}
    className={`sidebar-btn ${isActive ? "active" : ""}`}
  >
    <div className="sidebar-icon">
      <img src={icon} alt="" className="sidebar-img" />
    </div>
    <span className="sidebar-label">{label}</span>
  </button>
);

export default function LeftSidebar({
  activeWindow,
  onOpenStudyVille,
  onOpenBuddies,
  onOpenRewards,
  onOpenChallenges,
  onOpenLeaderboard
}) {

  return (
    <>
      {/* STUDYVILLE */}
      <MenuBtn
        label="StudyVille"
        icon={studyvilleIcon}
        isActive={activeWindow === "studyville"}
        onClick={onOpenStudyVille}
      />

      {/* BUDDIES: opens Study Groups */}
      <MenuBtn
        label="Buddies"
        icon={inventoryIcon}
        isActive={false}
        onClick={onOpenBuddies}
      />

      {/* REWARDS */}
      <MenuBtn
        label="Rewards"
        icon={challengesIcon}
        isActive={activeWindow === "shop"}
        onClick={onOpenRewards}
      />

      {/* CHALLENGES: today's goals */}
      <MenuBtn
        label="Challenges"
        icon={groupsIcon}
        isActive={activeWindow === "challenges"}
        onClick={onOpenChallenges}
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
