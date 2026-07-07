import React from 'react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import { FaUser, FaEnvelope, FaCalendarAlt, FaWallet, FaCoins, FaSignOutAlt, FaShieldAlt } from 'react-icons/fa';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();

  const getVipLevel = (earnings) => {
    if (earnings >= 1000) return 'VIP 3 Gold';
    if (earnings >= 200) return 'VIP 2 Silver';
    if (earnings >= 50) return 'VIP 1 Bronze';
    return 'VIP 0 Starter';
  };

  const totalEarnings = user?.totalEarnings || 0;
  const joinedDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';

  return (
    <div className="page-container animate-fade-in">
      <div className="profile-header">
        <h1>Account Profile</h1>
        <p>View your verification details, referral status, and wallet credentials.</p>
      </div>

      <div className="profile-grid">
        {/* Left Side: Avatar Card */}
        <div className="profile-left-col">
          <GlassCard className="profile-avatar-card">
            <div className="profile-avatar-glow"></div>
            <div className="profile-large-avatar">
              {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
            </div>
            <h3>{user?.name || user?.username}</h3>
            <p className="profile-email-text">{user?.email || `Referral ID: ${user?.referralCode}`}</p>
            <span className="profile-vip-tag">{getVipLevel(totalEarnings)}</span>
            
            <div className="profile-joined-date">
              <FaCalendarAlt /> Joined: {joinedDate}
            </div>
          </GlassCard>

          {/* Wallet summary */}
          <GlassCard className="profile-wallet-card">
            <h4>Wallet Overview</h4>
            <div className="wallet-mini-stats">
              <div className="wallet-stat-item">
                <span className="w-icon-box bg-purple"><FaWallet /></span>
                <div>
                  <span className="w-lbl">Available Balance</span>
                  <strong className="w-val text-green">₹{user?.walletBalance?.toFixed(2) || '0.00'}</strong>
                </div>
              </div>
              
              <div className="wallet-stat-item">
                <span className="w-icon-box bg-yellow"><FaCoins /></span>
                <div>
                  <span className="w-lbl">Total Accumulated Earnings</span>
                  <strong className="w-val text-yellow">₹{totalEarnings.toFixed(2)}</strong>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right Side: Account Details Panel */}
        <div className="profile-right-col">
          <GlassCard className="profile-edit-card">
            <h4>Account Profile Information</h4>
            <p className="card-hint">Full verification details of your active account session.</p>

            <div className="profile-details-list">
              <div className="detail-row">
                <span className="detail-label"><FaUser /> Full Name</span>
                <span className="detail-value">{user?.name || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label"><FaUser /> Username</span>
                <span className="detail-value">@{user?.username}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label"><FaEnvelope /> Email Address</span>
                <span className="detail-value">{user?.email || 'Not Linked'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label"><FaShieldAlt /> Phone Number</span>
                <span className="detail-value">{user?.mobile ? `+91 ${user.mobile}` : 'Not Linked'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label"><FaShieldAlt /> Referral ID (UID)</span>
                <span className="detail-value">{user?.referralCode || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label"><FaCalendarAlt /> Joined On</span>
                <span className="detail-value">{joinedDate}</span>
              </div>
            </div>

            <div className="profile-btn-row" style={{ marginTop: '30px' }}>
              <button type="button" onClick={logout} className="btn-secondary profile-logout-btn" style={{ width: '100%' }}>
                <FaSignOutAlt /> Log Out Account
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Profile;
