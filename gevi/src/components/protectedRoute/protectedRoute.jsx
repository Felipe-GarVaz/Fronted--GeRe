import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  // Si no hay token en el localStorage, redirige a /login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si hay token, deja pasar al componente hijo
  return children;
};

export default ProtectedRoute;