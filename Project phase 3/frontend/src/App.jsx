// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import StudyGroups from "./pages/StudyGroups";
import FlashcardsPage from "./pages/FlashcardsPage";
import QuizzesPage from "./pages/QuizzesPage";
import ResourcesPage from "./pages/ResourcesPage";


import { RegisterPage, LoginPage } from "./pages/Auth"; 
import { AccountPage, EditAccountPage } from "./pages/User"; 

import NavBar from "./components/NavBar";
import StudyBuddyMatch from "./pages/StuddyBuddyMatch";

function App() {
  return (
    <BrowserRouter>
      <NavBar />

      {/* Page content */}
            <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/groups" element={<StudyGroups />} />
        <Route path="/match" element={<StudyBuddyMatch />} />

        <Route path="/flashcards" element={<FlashcardsPage />} />
        <Route path="/quizzes" element={<QuizzesPage />} />

        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/user/account" element={<AccountPage />} />
        <Route path="/user/account/edit" element={<EditAccountPage />} />
        <Route path="/resources" element={<ResourcesPage />} />

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
