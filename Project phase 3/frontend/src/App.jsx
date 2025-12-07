// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import StudyGroups from "./pages/StudyGroups";
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
