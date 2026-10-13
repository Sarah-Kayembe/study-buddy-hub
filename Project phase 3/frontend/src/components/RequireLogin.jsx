import { Navigate } from "react-router-dom";

import useCurrentUser from "../hooks/useCurrentUser";

// Sends logged-out visitors to the login page.
//
// The page renders right away while the login check runs in the
// background, instead of showing a blank screen until it finishes. The
// backend still refuses every request from someone who isn't logged in,
// so nothing private is shown in the meantime.
export default function RequireLogin({ children }) {
  const { user, loading } = useCurrentUser();

  if (!loading && !user) return <Navigate to="/login" replace />;
  return children;
}
