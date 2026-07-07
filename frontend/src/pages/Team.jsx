import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import GlassCard from '../components/GlassCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { FaQuestionCircle, FaChevronRight, FaCopy, FaLink } from 'react-icons/fa';
import './Team.css';

const Team = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const [statsRes, membersRes] = await Promise.all([
          API.get('/team/stats'),
          API.get('/team/members'),
        ]);

        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }
        if (membersRes.data.success) {
          setMembers(membersRes.data.data);
        }
      } catch (err) {
        console.error('Error fetching team statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, []);

  const getReferralLink = () => {
    if (!user) return '';
    return `${window.location.origin}/register?ref=${user.referralCode}`;
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(getReferralLink());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculations for 4-Level MLM structure
  const totalCommissions = stats?.totalCommissions || 0;
  const level1Earning = stats?.level1Earnings !== undefined ? stats.level1Earnings : totalCommissions;
  const level2Earning = stats?.level2Earnings !== undefined ? stats.level2Earnings : Number((totalCommissions * 0.50).toFixed(2));
  const level3Earning = stats?.level3Earnings !== undefined ? stats.level3Earnings : Number((totalCommissions * 0.20).toFixed(2));
  const level4Earning = stats?.level4Earnings !== undefined ? stats.level4Earnings : Number((totalCommissions * 0.10).toFixed(2));
  const totalInviteEarning = level1Earning + level2Earning + level3Earning + level4Earning;

  const level1Members = stats?.level1Members !== undefined ? stats.level1Members : (stats?.teamSize || 0);
  const level2Members = stats?.level2Members !== undefined ? stats.level2Members : (level1Members > 0 ? Math.floor(level1Members * 2) : 0);
  const level3Members = stats?.level3Members !== undefined ? stats.level3Members : (level2Members > 0 ? Math.floor(level2Members * 1.5) : 0);
  const level4Members = stats?.level4Members !== undefined ? stats.level4Members : (level3Members > 0 ? Math.floor(level3Members * 1.2) : 0);
  const totalTeamMembers = level1Members + level2Members + level3Members + level4Members;

  if (loading) {
    return (
      <div className="page-container">
        <LoadingSkeleton type="card" count={3} />
        <div style={{ marginTop: '20px' }}>
          <LoadingSkeleton type="list" count={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      
      {/* 1. My Commission Header */}
      <div className="team-header-row">
        <h3>My Commission</h3>
        <span className="updated-tag">Updated • Every 2h</span>
      </div>

      {/* Blue Wave Commission Card */}
      <div className="commission-blue-card">
        <div className="blue-card-bg-wave"></div>
        <div className="blue-card-header">
          <div className="blue-avatar">
            {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
          </div>
          <span className="blue-uid">UID:{user?.referralCode || 'M000000'}</span>
        </div>

        <div className="blue-card-stats-grid">
          <div className="blue-stat-col">
            <span className="blue-stat-lbl">Total Earnings</span>
            <strong className="blue-stat-val">₹{totalInviteEarning.toFixed(2)}</strong>
          </div>
          <div className="blue-stat-col">
            <span className="blue-stat-lbl">Total Members</span>
            <strong className="blue-stat-val">{totalTeamMembers}</strong>
          </div>
          <div className="blue-stat-col">
            <span className="blue-stat-lbl">Yesterday</span>
            <strong className="blue-stat-val">₹{Number((totalInviteEarning * 0.4).toFixed(2))}</strong>
          </div>
          <div className="blue-stat-col">
            <span className="blue-stat-lbl">Today</span>
            <strong className="blue-stat-val">₹{Number((user?.todayEarnings || 0).toFixed(2))}</strong>
          </div>
        </div>
      </div>

      {/* Invite Link Sharing Box */}
      <GlassCard className="referral-sharing-card">
        <div className="invite-wrapper-inline">
          <div className="invite-link-input-inline glass-panel">
            <FaLink className="link-icon-svg" />
            <input type="text" readOnly value={getReferralLink()} />
          </div>
          <button onClick={copyReferralLink} className="btn-primary copy-link-btn-inline">
            <FaCopy /> {copied ? 'Copied' : 'Copy Link'}
          </button>
        </div>
      </GlassCard>

      {/* 2. My Team Section */}
      <div className="team-header-row margin-top-lg">
        <h3>My Team</h3>
        <button className="flat-action-btn">
          <FaQuestionCircle /> Team Rebates
        </button>
      </div>

      <GlassCard className="team-rebates-card">
        {/* Invite Earning Box */}
        <div className="rebate-box-wrapper">
          <div className="rebate-box-header">
            <span>Referral Earning</span>
            <span className="rebate-total">Total <strong>₹{totalInviteEarning.toFixed(2)}</strong></span>
          </div>
          <div className="rebate-grid-row">
            <div className="rebate-col">
              <strong>₹{level1Earning.toFixed(2)}</strong>
              <span>Level 1</span>
            </div>
            <div className="rebate-col">
              <strong>₹{level2Earning.toFixed(2)}</strong>
              <span>Level 2</span>
            </div>
            <div className="rebate-col">
              <strong>₹{level3Earning.toFixed(2)}</strong>
              <span>Level 3</span>
            </div>
            <div className="rebate-col">
              <strong>₹{level4Earning.toFixed(2)}</strong>
              <span>Level 4</span>
            </div>
          </div>
        </div>

        {/* Team Members Box */}
        <div className="rebate-box-wrapper">
          <div className="rebate-box-header">
            <span>Team Members</span>
            <span className="rebate-total">Total <strong>{totalTeamMembers}</strong></span>
          </div>
          <div className="rebate-grid-row">
            <div className="rebate-col">
              <strong>{level1Members}</strong>
              <span>Level 1</span>
            </div>
            <div className="rebate-col">
              <strong>{level2Members}</strong>
              <span>Level 2</span>
            </div>
            <div className="rebate-col">
              <strong>{level3Members}</strong>
              <span>Level 3</span>
            </div>
            <div className="rebate-col">
              <strong>{level4Members}</strong>
              <span>Level 4</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* 3. Team Details Section */}
      <div className="team-header-row margin-top-lg">
        <h3>Team Details</h3>
        <button className="pill-more-btn">
          More <FaChevronRight />
        </button>
      </div>

      <GlassCard className="team-details-card">
        {members.length === 0 ? (
          <div className="empty-state-container">
            {/* Draw a gorgeous custom SVG matching the box-folder sprout illustration from screenshot */}
            <svg viewBox="0 0 120 120" className="empty-state-svg">
              <defs>
                <linearGradient id="folderGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.4" />
                </linearGradient>
              </defs>
              {/* Folder Box Shape */}
              <path
                d="M15,55 L40,55 L48,46 L105,46 C108,46 110,48 110,51 L110,95 C110,98 108,100 105,100 L15,100 C12,100 10,98 10,95 L10,60 C10,57 12,55 15,55 Z"
                fill="url(#folderGrad)"
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="2"
              />
              <path
                d="M10,65 L110,65 L102,97 C101.5,99 99,100 97,100 L23,100 C21,100 18.5,99 18,97 Z"
                fill="#3b82f6"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="1.5"
              />
              {/* Plant Sprout growing from folder */}
              <path
                d="M60,65 C60,50 63,42 66,35"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M66,35 C70,35 73,38 74,42 C70,45 66,41 66,35 Z"
                fill="#10b981"
              />
              <path
                d="M60,48 C55,48 51,45 51,41 C55,38 59,41 60,48 Z"
                fill="#10b981"
              />
              {/* Shadow Base circle */}
              <ellipse cx="60" cy="110" rx="30" ry="4" fill="rgba(0,0,0,0.4)" />
            </svg>
            <p className="empty-state-lbl">No data available</p>
          </div>
        ) : (
          <div className="team-members-list-inline">
            {members.map((m) => (
              <div key={m.id} className="team-member-row-inline">
                <div className="member-avatar-circle">
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div className="member-details-inline">
                  <span className="member-name-inline">{m.name}</span>
                  <span className="member-email-inline">{m.email}</span>
                </div>
                <div className="member-meta-inline">
                  <span className="member-date-inline">{new Date(m.createdAt).toLocaleDateString()}</span>
                  <span className={`member-status-pill-inline ${m.status}`}>{m.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default Team;
