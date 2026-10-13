import { Navigate } from "react-router-dom";

import useCurrentUser from "../hooks/useCurrentUser";
import { LoginPage } from "../pages/Auth";

// The site's front door: logged-in users go straight to their home page,
// everyone else sees the login form.
export default function RootRoute() {
  const { user, loading } = useCurrentUser();

  if (loading) return null;
  if (user) return <Navigate to="/home" replace />;
  return <LoginPage />;
}
