// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import StudyGroups from "./pages/StudyGroups";
import NavBar from "./components/NavBar";

function App() {
  return (
    <BrowserRouter>
      {/* Shared navigation bar for all pages */}
      <NavBar />

      {/* Page content */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/groups" element={<StudyGroups />} />

        {/* Add below when ready */}
        {/* <Route path="/login" element={<LoginPage />} /> */}
        {/* <Route path="/profile" element={<ProfilePage />} /> */}
        {/* <Route path="/flashcards" element={<FlashcardsPage />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
