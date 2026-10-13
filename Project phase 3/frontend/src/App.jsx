// src/App.jsx
import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import StudyGroups from "./pages/StudyGroups";
import FlashcardsPage from "./pages/FlashcardsPage";
import QuizzesPage from "./pages/QuizzesPage";
import ResourcesPage from "./pages/ResourcesPage";


import { RegisterPage, LoginPage } from "./pages/Auth"; 
import { AccountPage, EditAccountPage } from "./pages/User"; 

import NavBar from "./components/NavBar";
import RootRoute from "./components/RootRoute";
import RequireLogin from "./components/RequireLogin";
import StudyBuddyMatch from "./pages/StuddyBuddyMatch";

// The Study Tools dashboard is large (images, sounds), so it only loads
// when someone opens it instead of slowing down every page.
const loadTimerDashboard = () => import("./pages/TimerDashboard");
const TimerDashboard = lazy(loadTimerDashboard);

function App() {
  // Download the dashboard in the background once the first page is up,
  // so opening Study Tools later is instant instead of waiting for it.
  useEffect(() => {
    const timer = setTimeout(loadTimerDashboard, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <BrowserRouter>
      <NavBar />

      {/* Page content */}
            <Routes>
        {/* Logged-in users land on /home; everyone else sees login */}
        <Route path="/" element={<RootRoute />} />
        <Route path="/groups" element={<StudyGroups />} />
        <Route path="/match" element={<StudyBuddyMatch />} />

        {/* Keep Home accessible at an explicit route if needed */}
        <Route path="/home" element={<HomePage />} />

        <Route path="/flashcards" element={<FlashcardsPage />} />
        <Route path="/quizzes" element={<QuizzesPage />} />

        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/user/account" element={<AccountPage />} />
        <Route path="/user/account/edit" element={<EditAccountPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route
          path="/study-tools"
          element={
            <RequireLogin>
              <div className="study-tools">
                <Suspense fallback={<div className="study-tools-backdrop" />}>
                  <TimerDashboard />
                </Suspense>
              </div>
            </RequireLogin>
          }
        />

        {/* <Route
          path="/"
          element={<div style={{ padding: "1.5rem" }}>Home page placeholder</div>}
        /> */}
        {/* Add routes below */}
      </Routes>

    </BrowserRouter>
  );
}

export default App;
