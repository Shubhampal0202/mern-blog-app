import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

function ProtectedRoute() {
  const user = useSelector((state) => state.auth.userAuth);
  const { token = null } = user || {};
  return !token ? <Navigate to={"/signin"} /> : <Outlet />;
}

export default ProtectedRoute;
