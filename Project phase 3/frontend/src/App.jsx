// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import StudyGroups from "./pages/StudyGroups";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/groups" element={<StudyGroups />} />
        <Route
          path="/"
          element={<div style={{ padding: "1.5rem" }}>Home page placeholder</div>}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
