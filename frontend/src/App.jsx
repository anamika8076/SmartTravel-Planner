import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { GuestRoute, ProtectedRoute } from './components/layout/RouteGuards';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Trips from './pages/Trips';
import NewTrip from './pages/NewTrip';
import TripDetail from './pages/TripDetail';
import EditTrip from './pages/EditTrip';
import Destinations from './pages/Destinations';
import DestinationDetail from './pages/DestinationDetail';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/trips" replace />} />

            {/* Public */}
            <Route path="/destinations" element={<Destinations />} />
            <Route path="/destinations/:id" element={<DestinationDetail />} />

            {/* Requires login */}
            <Route element={<ProtectedRoute />}>
              <Route path="/trips" element={<Trips />} />
              <Route path="/trips/new" element={<NewTrip />} />
              <Route path="/trips/:id" element={<TripDetail />} />
              <Route path="/trips/:id/edit" element={<EditTrip />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
