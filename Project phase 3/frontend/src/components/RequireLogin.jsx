import { Navigate } from "react-router-dom";

import useCurrentUser from "../hooks/useCurrentUser";

// Shows its children only to logged-in users; everyone else goes to login.
export default function RequireLogin({ children }) {
  const { user, loading } = useCurrentUser();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
