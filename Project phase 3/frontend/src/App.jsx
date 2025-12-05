// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import StudyGroups from "./pages/StudyGroups";
// import Auth from "./pages/Auth";

import { RegisterPage, LoginPage } from "./pages/Auth"; // named imports


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/groups" element={<StudyGroups />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={<div style={{ padding: "1.5rem" }}>Home page placeholder</div>}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

