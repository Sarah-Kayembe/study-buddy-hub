// src/pages/HomePage.jsx
import { useNavigate } from "react-router-dom";
import CardsIcon from "../assets/Cards.png";
import LevelUpIcon from "../assets/levelup.png";
import NetworkIcon from "../assets/Network.png";
import MatcherIcon from "../assets/matcher.png";

export default function HomePage() {
  const navigate = useNavigate();

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

          <p className="hero-body-text">
            placeholder description for studybuddy
          </p>

          <div className="hero-actions">
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => navigate("/groups")}
            >
              Go to My Groups
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
            <div className="hero-badge">
              <span className="hero-badge-label">Today&apos;s XP</span>
              <span className="hero-badge-value">+120</span>
            </div>
            <div className="hero-badge">
              <span className="hero-badge-label">Streak</span>
              <span className="hero-badge-value">3 days</span>
            </div>
            <div className="hero-badge">
              <span className="hero-badge-label">Active groups</span>
              <span className="hero-badge-value">4</span>
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
                <div className="hero-status-course">COS 420 • DB Systems</div>
                <div className="hero-status-time">
                  Tonight · 7:00 – 8:00 PM
                </div>
              </div>

              <div className="hero-progress-row">
                <span className="hero-progress-label">Focus streak</span>
                <span className="hero-progress-value">Lvl 4</span>
              </div>
              <div className="hero-progress-bar">
                <span className="hero-progress-fill" />
              </div>

              <div className="hero-status-footer">
                <span>Study party: 3 members</span>
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
            <section className="card feature-card feature-card-gamified">
          <div className="feature-card-header">
            <div className="feature-card-title-row">
              <div className="feature-card-icon-placeholder">
            <img src={CardsIcon} alt="Quizzes & Flashcards logo" />
              </div>
              <div className="card-title">Quizzes &amp; Flashcards</div>
            </div>
          </div>

          {/* <p className="feature-card-body">
            Quizzes &amp; Flashcards description (placeholder text).
          </p> */}

          {/* <ul className="clean-list feature-card-list">
            <li>• Feature 1</li>
            <li>• Feature 2</li>
            <li>• Feature 3</li>
          </ul> */}

    

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
            <button
              className="btn btn-primary feature-card-btn"
              type="button"
              onClick={() => navigate("/quizzes")}
            >
              Open Quizzes
            </button>
            <button
              className="btn btn-primary feature-card-btn"
              type="button"
              onClick={() => navigate("/flashcards")}
            >
              Open Flashcards
            </button>
          </div>
            </section>

            {/* Study Management & Focus */}
          <section className="card feature-card feature-card-gamified">
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

            <p className="feature-card-body">
              Study Management &amp; Focus description (placeholder text).
            </p>

            <ul className="clean-list feature-card-list">
              <li>• Feature 1</li>
              <li>• Feature 2</li>
              <li>• Feature 3</li>
            </ul>

            <button
              className="btn btn-ghost btn-sm feature-card-btn"
              type="button"
              disabled
            >
              Coming soon
            </button>
          </section>

          {/* Study Groups & Collaboration */}
          <section className="card feature-card feature-card-gamified">
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

            <p className="feature-card-body">
              Study Groups &amp; Collaboration description (placeholder text).
            </p>

            <ul className="clean-list feature-card-list">
              <li>• Feature 1</li>
              <li>• Feature 2</li>
              <li>• Feature 3</li>
            </ul>

            <button
              className="btn btn-primary feature-card-btn"
              type="button"
              onClick={() => navigate("/groups")}
            >
              Open Study Groups
            </button>
          </section>

          {/* StudyBuddy Match */}
          <section className="card feature-card feature-card-gamified">
            <div className="feature-card-header">
              <div className="feature-card-title-row">
                <div className="feature-card-icon-placeholder">
                  <img src={MatcherIcon} alt="StudyBuddy Match logo" />
                </div>
                <div className="card-title">StudyBuddy Match</div>
              </div>
            </div>

            <p className="feature-card-body">
              StudyBuddy Match description (placeholder text).
            </p>

            <ul className="clean-list feature-card-list">
              <li>• Feature 1</li>
              <li>• Feature 2</li>
              <li>• Feature 3</li>
            </ul>

            <button
              className="btn btn-ghost btn-sm feature-card-btn"
              type="button"
              disabled
            >
              Coming soon
            </button>
          </section>
        </div>
      </section>
    </div>
  );
}
