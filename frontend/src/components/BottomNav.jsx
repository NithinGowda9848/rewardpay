import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaHome, FaShoppingCart, FaQrcode, FaUsers, FaUser, FaSignOutAlt, FaHeadset, FaShieldAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import './BottomNav.css';

const BottomNav = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Home', path: '/', icon: <FaHome /> },
    { name: 'Buy', path: '/buy', icon: <FaShoppingCart /> },
    { name: 'UPI', path: '/upi', icon: <FaQrcode /> },
    { name: 'Team', path: '/team', icon: <FaUsers /> },
    { name: 'Profile', path: '/profile', icon: <FaUser /> },
    { name: 'Support', path: '/support', icon: <FaHeadset /> },
  ];

  if (user?.role === 'admin') {
    navItems.push({ name: 'Admin', path: '/admin', icon: <FaShieldAlt /> });
  }

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside className="sidebar-nav glass-panel">
        <div className="sidebar-header">
          <div className="logo-glow"></div>
          <img src="/logo.jpg" alt="Rewards Pay Logo" className="sidebar-logo" />
        </div>

        <nav className="sidebar-menu">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div
            className="user-mini-profile"
            onClick={() => navigate('/profile')}
            title="View Profile Settings"
          >
            <div className="avatar-placeholder">
              {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <p className="profile-name">{user?.name || 'Guest User'}</p>
              <p className="profile-balance">₹{user?.walletBalance?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
          <button onClick={logout} className="logout-btn" title="Logout">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `mobile-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
};

export default BottomNav;
