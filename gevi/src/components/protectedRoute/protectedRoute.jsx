// src/auth/RequireAuth.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth, hasAnyRole } from "../useAuth";

export default function RequireAuth({ children, roles = [] }) {
  const { isAuth, roles: userRoles } = useAuth();

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  if (roles.length && !hasAnyRole(userRoles, roles)) {
    return <Navigate to="/403" replace />; // página de No Autorizado
  }
  return children;
}
