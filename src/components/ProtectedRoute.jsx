import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Loader from "../components/Loader";

/**
 * ProtectedRoute
 * - Waits until AuthProvider finishes rehydration (isAuthLoading === false)
 * - Redirects to /login if no auth
 * - Redirects to /unauthorized if allowedRoles provided and user lacks roles
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const navigate = useNavigate();
  const { auth, isAuthLoading } = useContext(AuthContext);

  useEffect(() => {
    if (!isAuthLoading) {
      if (!auth) {
        navigate("/login", { replace: true });
        window.location.reload();
      } else if (
        allowedRoles &&
        Array.isArray(auth.user.roles) &&
        !auth.user.roles.some((role) => allowedRoles.includes(role))
      ) {
        navigate("/unauthorized", { replace: true });
      }
    }
  }, [auth, isAuthLoading, allowedRoles, navigate]);

  if (isAuthLoading) {
    return <Loader text="Restoring session..." />;
  }

  // If not authenticated by now, redirect effect will handle navigation and we render nothing
  if (!auth) return null;

  return children;
};

export default ProtectedRoute;
