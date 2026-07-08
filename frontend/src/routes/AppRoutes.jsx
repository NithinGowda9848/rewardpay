import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';

// Pages
import Home from '../pages/Home';
import Buy from '../pages/Buy';
import Upi from '../pages/Upi';
import Team from '../pages/Team';
import Profile from '../pages/Profile';
import Support from '../pages/Support';
import Admin from '../pages/Admin';
import Login from '../pages/Login/Login';
import Register from '../pages/Register/Register';

// Public Route Guard (redirects logged-in users to home)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
};

// Private Route Guard (redirects unauthenticated users to login)
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Authenticated Dashboard Pages */}
      <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
        <Route index element={<Home />} />
        <Route path="buy" element={<Buy />} />
        <Route path="upi" element={<Upi />} />
        <Route path="team" element={<Team />} />
        <Route path="profile" element={<Profile />} />
        <Route path="support" element={<Support />} />
        <Route path="admin" element={<Admin />} />
      </Route>

      {/* Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
