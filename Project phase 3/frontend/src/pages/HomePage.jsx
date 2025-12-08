// src/pages/HomePage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import CardsIcon from "../assets/Cards.png";
import LevelUpIcon from "../assets/levelup.png";
import NetworkIcon from "../assets/Network.png";
import MatcherIcon from "../assets/matcher.png";

import useCurrentUser from "../hooks/useCurrentUser";
import { fetchMyGroups, fetchUpcomingSessions } from "../api/studygroups.js";

export default function HomePage() {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useCurrentUser();

  const userId = user?.user_id ?? null;

  const [activeGroups, setActiveGroups] = useState(0);
  const [nextSession, setNextSession] = useState(null);
  const [streakDays, setStreakDays] = useState(0);

  // ---- simple streak tracker (per user, stored in localStorage) ----
  useEffect(() => {
    if (!userId) {
      setStreakDays(0);
      return;
    }

    try {
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD
      const key = `sb_streak_${userId}`;
      const raw = window.localStorage.getItem(key);

      let newCount = 1;
      let payload = { lastDate: todayStr, count: 1 };

      if (raw) {
        const parsed = JSON.parse(raw);
        const lastDate = parsed.lastDate;
        const prevCount = parsed.count || 1;

        if (lastDate === todayStr) {
          // already counted today; keep existing streak
          newCount = prevCount;
        } else {
          const last = new Date(lastDate);
          const diffMs = today - last;
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            // consecutive day
            newCount = prevCount + 1;
          } else {
            // gap -> reset streak
            newCount = 1;
          }
        }

        payload = { lastDate: todayStr, count: newCount };
      }

      window.localStorage.setItem(key, JSON.stringify(payload));
      setStreakDays(newCount);
    } catch (err) {
      console.error("Failed to update streak", err);
    }
  }, [userId]);

  // ---- load active groups + next upcoming session ----
  useEffect(() => {
    if (!userId) {
      setActiveGroups(0);
      setNextSession(null);
      return;
    }

    async function loadDashboard() {
      try {
        const [myGroups, sessions] = await Promise.all([
          fetchMyGroups(userId),
          // limit = 1 so we just pick the next one
          fetchUpcomingSessions(userId, 1),
        ]);

        setActiveGroups(Array.isArray(myGroups) ? myGroups.length : 0);
        const s =
          Array.isArray(sessions) && sessions.length > 0 ? sessions[0] : null;
        setNextSession(s);
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      }
    }

    loadDashboard();
  }, [userId]);

  const streakLabel =
    streakDays > 0 ? `${streakDays} day${streakDays === 1 ? "" : "s"}` : "0 days";

  const activeGroupsLabel =
    userLoading || !userId ? "--" : String(activeGroups);

  const hasSession = !!nextSession;

  const sessionTitle = hasSession
    ? nextSession.group_name || "Study session"
    : "No upcoming study sessions";

  // Helper so we never show undefined and format like 12/9 · 7:58–8:58
  const formatSessionTime = (session) => {
    if (!session) {
      return "Use Study Groups to schedule your next session.";
    }

    const { session_date, start_time, end_time } = session;

    // Format date as MM/DD (or local format)
    let dateLabel = session_date;
    if (session_date) {
      const [y, m, d] = session_date.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      dateLabel = dt.toLocaleDateString(undefined, {
        month: "numeric",
        day: "numeric",
      });
    }

    const start = start_time?.slice(0, 5);
    const end = end_time?.slice(0, 5);

    let timePart = "";
    if (start && end) timePart = `${start}–${end}`;
    else if (start) timePart = start;

    return timePart ? `${dateLabel} · ${timePart}` : dateLabel;
  };

  const sessionTime = hasSession
    ? formatSessionTime(nextSession)
    : "Use Study Groups to schedule your next session.";

  const sessionLocation = hasSession
    ? nextSession.location || "Location TBD"
    : "Search for or create a study group!";

  return (
    <div className="app-shell home-page">
      {/* floating background spheres */}
      <div className="home-floating-shapes" aria-hidden="true">
        <span className="shape-orb shape-orb-1" />
        <span className="shape-orb shape-orb-2" />
        <span className="shape-orb shape-orb-3" />
        <span className="shape-orb shape-orb-4" />
        <span className="shape-orb shape-orb-5" />
      </div>

      {/* top section */}
      <section className="hero hero-gamified">
        <div className="hero-left">
          <h1 className="page-title">StudyBuddy Hub</h1>

          {/* description */}
          <p className="hero-subtitle">StudyBuddy Hub description</p>

          <p className="hero-body-text">placeholder description for studybuddy</p>

          <div className="hero-actions">
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => navigate("/resources")}
            >
              Go to Resources
            </button>

            <button
              className="btn btn-ghost btn-sm"
              type="button"
              onClick={() => {
                const el = document.getElementById("feature-grid");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
            >
              View features
            </button>
          </div>

          <div className="hero-badges">
            {/* Streak badge */}
            <div className="hero-badge">
              <span className="hero-badge-label">Streak</span>
              <span className="hero-badge-value">{streakLabel}</span>
            </div>

            {/* Active groups badge */}
            <div className="hero-badge">
              <span className="hero-badge-label">Active groups</span>
              <span className="hero-badge-value">{activeGroupsLabel}</span>
            </div>
          </div>
        </div>

        {/* status card */}
        <div className="hero-right">
          <div className="hero-orb">
            <div className="hero-orb-glow" />
            <div className="hero-orb-ring hero-orb-ring-outer" />
            <div className="hero-orb-ring hero-orb-ring-inner" />

            <div className="hero-status-card">
              <div className="hero-status-title">Next study session</div>

              <div className="hero-status-main">
                <div className="hero-status-course">{sessionTitle}</div>
                <div className="hero-status-time">{sessionTime}</div>
              </div>

              {/* Focus streak always shown, even if there is no session */}
              <div className="hero-progress-row">
                <span className="hero-progress-label">Focus streak</span>
                <span className="hero-progress-value">{streakLabel}</span>
              </div>
              <div className="hero-progress-bar">
                <span className="hero-progress-fill" />
              </div>

              <div className="hero-status-footer">
                <span>{sessionLocation}</span>
                <button
                  type="button"
                  className="btn btn-sm btn-primary hero-status-btn"
                  onClick={() => navigate("/groups")}
                >
                  View groups
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="feature-grid"
        style={{ marginTop: "2.5rem" }}
        aria-label="StudyBuddy Hub features"
      >
        <div className="feature-grid-header">
          <h2 className="feature-grid-title">Choose your path</h2>
          <p className="feature-grid-subtitle">
            Short placeholder description of the different areas of StudyBuddy
            Hub (quizzes, focus tools, groups, matches).
          </p>
        </div>

        <div className="feature-grid">
          {/* Quizzes & Flashcards */}
          <section
            className="card feature-card feature-card-gamified"
            style={{ minHeight: "260px" }}
          >
            <div className="feature-card-header">
              <div className="feature-card-title-row">
                <div className="feature-card-icon-placeholder">
                  <img src={CardsIcon} alt="Quizzes & Flashcards logo" />
                </div>
                <div className="card-title">Quizzes &amp; Flashcards</div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                marginTop: "1rem",
              }}
            >
              <button
                className="btn btn-primary feature-card-btn"
                type="button"
                onClick={() => navigate("/quizzes")}
              >
                Quizzes
              </button>
              <button
                className="btn btn-primary feature-card-btn"
                type="button"
                onClick={() => navigate("/flashcards")}
              >
                Flashcards
              </button>
            </div>
          </section>

          {/* Study Management & Focus */}
          <section
            className="card feature-card feature-card-gamified"
            style={{ minHeight: "260px" }}
          >
            <div className="feature-card-header">
              <div className="feature-card-title-row">
                <div className="feature-card-icon-placeholder">
                  <img src={LevelUpIcon} alt="Study Management logo" />
                </div>
                <div className="card-title">
                  Study Management &amp; Focus
                </div>
              </div>
            </div>

            {/* keep card size but no description/list */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                marginTop: "1rem",
              }}
            >
              <button
                className="btn btn-primary feature-card-btn"
                type="button"
                disabled
              >
                Coming soon
              </button>
            </div>
          </section>

          {/* Study Groups & Collaboration */}
          <section
            className="card feature-card feature-card-gamified"
            style={{ minHeight: "260px" }}
          >
            <div className="feature-card-header">
              <div className="feature-card-title-row">
                <div className="feature-card-icon-placeholder">
                  <img src={NetworkIcon} alt="Study Groups logo" />
                </div>
                <div className="card-title">
                  Study Groups &amp; Collaboration
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                marginTop: "1rem",
              }}
            >
              <button
                className="btn btn-primary feature-card-btn"
                type="button"
                onClick={() => navigate("/groups")}
              >
                Study Groups
              </button>
            </div>
          </section>

          {/* StudyBuddy Match */}
          <section
            className="card feature-card feature-card-gamified"
            style={{ minHeight: "260px" }}
          >
            <div className="feature-card-header">
              <div className="feature-card-title-row">
                <div className="feature-card-icon-placeholder">
                  <img src={MatcherIcon} alt="StudyBuddy Match logo" />
                </div>
                <div className="card-title">StudyBuddy Match</div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                marginTop: "1rem",
              }}
            >
              <button
                className="btn btn-primary feature-card-btn"
                type="button"
                onClick={() => navigate("/match")}
              >
                StudyBuddy Match
              </button>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
