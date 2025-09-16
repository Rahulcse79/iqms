import { useNavigate } from "react-router-dom";
import { useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const navigate = useNavigate();
  const { auth, isAuthLoading } = useContext(AuthContext);

  // Wait until auth is loaded from cookies
  useEffect(() => {
    if (!isAuthLoading) {
      if (!auth) {
        navigate("/login", { replace: true });
        window.location.reload();
      } else if (
        allowedRoles &&
        !auth.user.roles.some((role) => allowedRoles.includes(role))
      ) {
        navigate("/unauthorized", { replace: true });
      }
    }
  }, [auth, isAuthLoading, allowedRoles, navigate]);

  // Render nothing until auth is loaded or redirect happens
  if (!auth || isAuthLoading) return null;

  return children;
};

export default ProtectedRoute;
