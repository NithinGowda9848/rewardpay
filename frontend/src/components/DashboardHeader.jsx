import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaBell, FaTelegramPlane, FaTimes, FaHeadset } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import './DashboardHeader.css';

const DashboardHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, socket } = useAuth();

  // Notifications state
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await API.get('/user/notifications');
      if (res.data.success) {
        const readIds = JSON.parse(localStorage.getItem('read_announcements') || '[]');
        const formatted = res.data.data.map((notif) => {
          const isRead = notif.isAnnouncement
            ? readIds.includes(notif._id)
            : notif.read;

          return {
            id: notif._id,
            title: notif.title,
            message: notif.message,
            time: new Date(notif.createdAt).toLocaleDateString() + ' ' + new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: isRead,
            isAnnouncement: notif.isAnnouncement,
          };
        });

        setNotifications(formatted);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Poll notifications every 10 seconds to automatically show updates or new announcements
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  useEffect(() => {
    if (!socket) return;

    socket.on('new_notification', fetchNotifications);
    socket.on('deposit_change', fetchNotifications);
    socket.on('withdrawal_change', fetchNotifications);

    return () => {
      socket.off('new_notification', fetchNotifications);
      socket.off('deposit_change', fetchNotifications);
      socket.off('withdrawal_change', fetchNotifications);
    };
  }, [socket, fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const toggleNotifications = () => {
    setShowNotif(!showNotif);
  };

  const markAsRead = async (id) => {
    try {
      const targetNotif = notifications.find(n => n.id === id);
      if (!targetNotif) return;

      if (targetNotif.isAnnouncement) {
        const readIds = JSON.parse(localStorage.getItem('read_announcements') || '[]');
        if (!readIds.includes(id)) {
          readIds.push(id);
          localStorage.setItem('read_announcements', JSON.stringify(readIds));
        }
      } else {
        await API.put(`/user/notifications/${id}/read`);
      }

      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const annIds = notifications.filter(n => n.isAnnouncement).map(n => n.id);
      const dbNotifIds = notifications.filter(n => !n.isAnnouncement && !n.read).map(n => n.id);

      // 1. Mark announcements as read in localStorage
      const readIds = JSON.parse(localStorage.getItem('read_announcements') || '[]');
      annIds.forEach(id => {
        if (!readIds.includes(id)) readIds.push(id);
      });
      localStorage.setItem('read_announcements', JSON.stringify(readIds));

      // 2. Mark db notifications as read in parallel in backend
      await Promise.all(
        dbNotifIds.map(id => API.put(`/user/notifications/${id}/read`))
      );

      // 3. Update local state
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to clear all notifications:', err);
    }
  };

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/':
        return 'Rewards Pay';
      case '/buy':
        return 'Investment Packages';
      case '/upi':
        return 'UPI Payment Center';
      case '/team':
        return 'My Referral Team';
      case '/profile':
        return 'Profile Settings';
      case '/support':
        return 'Help & Support';
      default:
        return 'Rewards Dashboard';
    }
  };

  const isHome = location.pathname === '/';

  return (
    <header className="dashboard-header-bar glass-panel">
      <div className="header-left">
        {!isHome && (
          <button
            onClick={() => navigate(-1)}
            className="back-btn-icon"
            title="Go Back"
          >
            <FaChevronLeft />
          </button>
        )}
        {isHome ? (
          <div className="header-logo-container">
            <img src="/logo.jpg" alt="Rewards Pay Logo" className="header-logo" />
          </div>
        ) : (
          <h2 className="header-title">{getPageTitle(location.pathname)}</h2>
        )}
      </div>

      <div className="header-right">
        {/* Customer Support Option (Helpline redirect) */}
        <button
          onClick={() => navigate('/support')}
          className="header-action-btn support-telegram-btn"
          title="Customer Support Helpline"
        >
          <span className="telegram-paperplane-circle">
            <FaHeadset />
          </span>
        </button>

        {/* Notifications Option */}
        <button
          className={`header-action-btn ${showNotif ? 'active' : ''}`}
          title="Notifications"
          onClick={toggleNotifications}
        >
          <FaBell />
          {unreadCount > 0 && <span className="notif-badge"></span>}
        </button>
        
        <div
          className="header-user-avatar"
          onClick={() => navigate('/profile')}
          title="View Profile"
        >
          {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Interactive Notification Dropdown */}
      {showNotif && (
        <div className="notif-dropdown glass-panel animate-slide-up">
          <div className="notif-dropdown-header">
            <h4>Notifications</h4>
            {unreadCount > 0 && (
              <button onClick={clearAllNotifications} className="clear-notif-btn">
                Mark all read
              </button>
            )}
            <button onClick={() => setShowNotif(false)} className="close-notif-btn">
              <FaTimes />
            </button>
          </div>

          <div className="notif-dropdown-list">
            {notifications.length === 0 ? (
              <div className="no-notif-text">No notifications found.</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notif-item ${n.read ? 'read' : 'unread'}`}
                  onClick={() => markAsRead(n.id)}
                >
                  <div className="notif-item-dot-container">
                    {!n.read && <span className="unread-dot-indicator"></span>}
                  </div>
                  <div className="notif-item-body">
                    <p className="notif-item-title">{n.title}</p>
                    <p className="notif-item-msg">{n.message}</p>
                    <span className="notif-item-time">{n.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default DashboardHeader;
