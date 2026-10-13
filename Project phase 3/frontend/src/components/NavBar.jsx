import { NavLink, useLocation } from "react-router-dom";

export default function NavBar() {
  const { pathname } = useLocation();

  // The Focus Den dashboard is full screen with its own controls.
  if (pathname.startsWith("/focus-den")) return null;

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
          to="/focus-den"
          className={({ isActive }) =>
            "nav-link" + (isActive ? " nav-link-active" : "")
          }
        >
          Focus Den
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
