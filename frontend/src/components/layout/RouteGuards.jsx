import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/** Only for logged-in users; otherwise send them to /login and come back after. */
export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

/** Login / register pages: logged-in users go straight to their trips. */
export function GuestRoute() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/trips" replace />;
  return <Outlet />;
}
