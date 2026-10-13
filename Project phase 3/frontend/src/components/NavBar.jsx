import { NavLink, useLocation } from "react-router-dom";

export default function NavBar() {
  const { pathname } = useLocation();

  // The Study Tools dashboard is full screen with its own controls.
  if (pathname.startsWith("/study-tools")) return null;

  return (
    <header className="navbar">
      <div className="nav-left">
        <span className="nav-logo-dot" />
        <span className="nav-title">StudyBuddy Hub</span>
      </div>

      <nav className="nav-right">
        <NavLink
          to="/home"
          className={({ isActive }) =>
            "nav-link" + (isActive ? " nav-link-active" : "")
          }
          end
        >
          Home
        </NavLink>

        {/* NEW: Study Groups tab */}
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
          to="/match"
          className={({ isActive }) =>
            "nav-link" + (isActive ? " nav-link-active" : "")
          }
        >
          StudyBuddy Match
        </NavLink>

        <NavLink
          to="/flashcards"
          className={({ isActive }) =>
            "nav-link" + (isActive ? " nav-link-active" : "")
          }
        >
          Flashcards
        </NavLink>

        <NavLink
          to="/study-tools"
          className={({ isActive }) =>
            "nav-link" + (isActive ? " nav-link-active" : "")
          }
        >
          Study Tools
        </NavLink>

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
