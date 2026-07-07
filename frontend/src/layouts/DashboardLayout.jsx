import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import DashboardHeader from '../components/DashboardHeader';
import LoadingSkeleton from '../components/LoadingSkeleton';

const DashboardLayout = () => {
  const { user, loading } = useAuth();

  // If session is checking, display a full-page loading indicator
  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '30px', padding: '40px' }}>
        <LoadingSkeleton type="line" count={1} />
        <LoadingSkeleton type="card" count={3} />
        <LoadingSkeleton type="chart" count={1} />
      </div>
    );
  }

  // Render dashboard layout
  return (
    <div className="dashboard-layout">
      {/* Sidebar/Bottom Nav component */}
      <BottomNav />

      {/* Top sticky header bar with back arrow navigation option */}
      <DashboardHeader />
      
      {/* Main panel containing children pages */}
      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
