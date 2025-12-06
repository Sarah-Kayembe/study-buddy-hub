// src/components/NavBar.jsx
import { NavLink } from "react-router-dom";

export default function NavBar() {
  return (
    <header className="navbar">
      <div className="nav-left">
        <span className="nav-logo-dot" />
        <span className="nav-title">StudyBuddy Hub</span>
      </div>

      <nav className="nav-right">
        <NavLink
          to="/"
          className={({ isActive }) =>
            "nav-link" + (isActive ? " nav-link-active" : "")
          }
          end
        >
          Home
        </NavLink>

        <NavLink
          to="/groups"
          className={({ isActive }) =>
            "nav-link" + (isActive ? " nav-link-active" : "")
          }
        >
          Study Groups
        </NavLink>

        <NavLink
          to="/quizzes"
          className={({ isActive }) =>
            "nav-link" + (isActive ? " nav-link-active" : "")
          }
        >
          Quizzes
        </NavLink>

        <NavLink
          to="/flashcards"
          className={({ isActive }) =>
            "nav-link" + (isActive ? " nav-link-active" : "")
          }
        >
          Flashcards
        </NavLink>

        <button
          type="button"
          className="nav-link nav-link-disabled"
          disabled
        >
          Study Tools (soon)
        </button>

        <button
          type="button"
          className="nav-link nav-link-disabled"
          disabled
        >
          Account (soon)
        </button>
        {/* I left this placeholder because I didn't know if you still needed it -Rise */}
        <NavLink
          to="/user/account"
          className={({ isActive }) =>
            "nav-link" + (isActive ? " nav-link-active" : "")
          }
          end
        >
          Account
        </NavLink>
      </nav>
    </header>
  );
}
