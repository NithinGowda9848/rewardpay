import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import GlassCard from '../components/GlassCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { FaWallet, FaCoins, FaMoneyCheckAlt, FaArrowUp, FaArrowDown, FaCopy, FaShareAlt, FaPlus, FaSignOutAlt, FaTelegram, FaUsers, FaClock, FaGift, FaCreditCard } from 'react-icons/fa';
import './Home.css';

const Home = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(() => {
    return !sessionStorage.getItem('hasSeenWelcomeModal');
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        await refreshUser();
        const txRes = await API.get('/wallet/transactions');
        if (txRes.data.success) {
          setTransactions(txRes.data.data.slice(0, 5)); // show latest 5
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Set up real-time simulated collection poll every 10 seconds
    const interval = setInterval(async () => {
      await refreshUser();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const copyReferralCode = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit':
        return <div className="tx-icon-wrapper type-deposit"><FaPlus /></div>;
      case 'withdraw':
        return <div className="tx-icon-wrapper type-withdraw"><FaArrowDown /></div>;
      case 'purchase':
        return <div className="tx-icon-wrapper type-purchase"><FaArrowUp /></div>;
      case 'reward':
        return <div className="tx-icon-wrapper type-reward"><FaCoins /></div>;
      case 'referral':
        return <div className="tx-icon-wrapper type-referral"><FaShareAlt /></div>;
      default:
        return <div className="tx-icon-wrapper"><FaCoins /></div>;
    }
  };

  const getTransactionStatusClass = (status) => {
    if (status === 'completed') return 'status-completed';
    if (status === 'pending') return 'status-pending';
    return 'status-failed';
  };

  // Determine VIP Progress
  const totalEarned = user?.totalEarnings || 0;
  const nextVipMilestone = totalEarned < 50 ? 50 : totalEarned < 200 ? 200 : totalEarned < 1000 ? 1000 : 5000;
  const prevVipMilestone = nextVipMilestone === 50 ? 0 : nextVipMilestone === 200 ? 50 : nextVipMilestone === 1000 ? 200 : 1000;
  const progressPercent = Math.min(
    100,
    ((totalEarned - prevVipMilestone) / (nextVipMilestone - prevVipMilestone)) * 100
  );

  const getVipLevel = (earnings) => {
    if (earnings >= 1000) return 'VIP 3 Gold';
    if (earnings >= 200) return 'VIP 2 Silver';
    if (earnings >= 50) return 'VIP 1 Bronze';
    return 'VIP 0 Starter';
  };

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <LoadingSkeleton type="line" count={1} />
          <LoadingSkeleton type="card" count={3} />
          <LoadingSkeleton type="chart" count={1} />
        </div>
      </div>
    );
  }

  if (showModal) {
    return (
      <div className="promo-modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0b10', zIndex: 9999 }}>
        <div className="promo-modal-card">
          <div className="promo-modal-header">
            {/* Background decorative elements */}
            <div className="modal-header-shape-1"></div>
            <div className="modal-header-shape-2"></div>
            <div className="modal-header-star star-1">★</div>
            <div className="modal-header-star star-2">★</div>
            
            <button className="promo-modal-close" onClick={() => {
              sessionStorage.setItem('hasSeenWelcomeModal', 'true');
              setShowModal(false);
            }}>
              &times;
            </button>
            <h2>Welcome to Reward Pay</h2>
            <p className="promo-modal-subtitle">New best app launched 🚀</p>
          </div>
          <div className="promo-modal-body">
            <div className="promo-modal-row">
              <div className="promo-modal-row-left">
                <div className="promo-icon-container">
                  <FaGift className="promo-row-icon" />
                </div>
                <span>SignUp Reward</span>
              </div>
              <div className="promo-badge">₹50</div>
            </div>
            <div className="promo-modal-row">
              <div className="promo-modal-row-left">
                <div className="promo-icon-container">
                  <FaUsers className="promo-row-icon" />
                </div>
                <span>Team work</span>
              </div>
              <div className="promo-badge">10% / 5% / 3% / 2%</div>
            </div>
            <div className="promo-modal-row">
              <div className="promo-modal-row-left">
                <div className="promo-icon-container">
                  <FaCreditCard className="promo-row-icon" />
                </div>
                <span>Min withdrawal</span>
              </div>
              <div className="promo-badge">₹300</div>
            </div>
            <div className="promo-modal-row">
              <div className="promo-modal-row-left">
                <div className="promo-icon-container">
                  <FaCoins className="promo-row-icon" />
                </div>
                <span>Min Recharge</span>
              </div>
              <div className="promo-badge">₹510</div>
            </div>
            <div className="promo-modal-row">
              <div className="promo-modal-row-left">
                <div className="promo-icon-container">
                  <FaClock className="promo-row-icon" />
                </div>
                <span>Withdrawal time</span>
              </div>
              <div className="promo-badge">24/7</div>
            </div>
          </div>
          <div className="promo-modal-footer">
            <a 
              href="https://t.me/rewardspayofficial" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="promo-modal-btn"
              onClick={() => {
                sessionStorage.setItem('hasSeenWelcomeModal', 'true');
                setShowModal(false);
              }}
            >
              <FaTelegram className="telegram-btn-icon" /> Join Telegram
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      {/* Welcome Banner */}
      <div className="promo-banner">
        <div className="promo-banner-glow"></div>
        <div className="promo-content">
          <span className="banner-tag">EARNING REWARDS</span>
          <h1>Welcome Back, {user?.name}!</h1>
          <p>
            Your account is actively generating reward payouts. Keep purchasing high-yield plans to multiply your daily earnings.
          </p>
          <div className="referral-quick-copy glass-panel">
            <span className="ref-lbl">Referral Code: <strong>{user?.referralCode}</strong></span>
            <button onClick={copyReferralCode} className="copy-btn-mini">
              <FaCopy /> {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
        <div className="promo-illustration">
          <div className="ill-circle-outer"></div>
          <div className="ill-circle-inner"></div>
          <FaCoins className="floating-coin" />
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="stats-grid">
        <GlassCard className="stat-card" interactive={true}>
          <div className="stat-icon-container stat-blue">
            <FaWallet />
          </div>
          <div className="stat-details">
            <p className="stat-label">Wallet Balance</p>
            <h3 className="stat-value">₹{user?.walletBalance?.toFixed(2)}</h3>
          </div>
        </GlassCard>

        <GlassCard className="stat-card" interactive={true}>
          <div className="stat-icon-container stat-emerald">
            <FaCoins />
          </div>
          <div className="stat-details">
            <p className="stat-label">Today's Profit</p>
            <h3 className="stat-value text-emerald">+₹{user?.todayEarnings?.toFixed(2)}</h3>
          </div>
        </GlassCard>

        <GlassCard className="stat-card" interactive={true}>
          <div className="stat-icon-container stat-gold">
            <FaMoneyCheckAlt />
          </div>
          <div className="stat-details">
            <p className="stat-label">Total Return</p>
            <h3 className="stat-value text-gold">₹{user?.totalEarnings?.toFixed(2)}</h3>
          </div>
        </GlassCard>
      </div>

      {/* Reward Progress Tracker & Quick Actions */}
      <div className="dashboard-middle-row">
        {/* Progress Tracker */}
        <GlassCard className="middle-panel progress-panel">
          <div className="panel-header">
            <h4>VIP Progression</h4>
            <span className="current-level-badge">{getVipLevel(totalEarned)}</span>
          </div>
          <div className="vip-progress-details">
            <p className="progress-hint">Accumulate earnings to unlock next VIP rank</p>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <div className="milestone-labels">
              <span>₹{totalEarned.toFixed(2)} / ₹{nextVipMilestone}</span>
              <span>Next Level: {getVipLevel(nextVipMilestone)}</span>
            </div>
          </div>
        </GlassCard>

        {/* Quick Actions */}
        <GlassCard className="middle-panel actions-panel">
          <h4>Quick Shortcuts</h4>
          <div className="action-buttons-grid">
            <a href="/upi" className="quick-action-btn">
              <span className="action-icon act-deposit"><FaPlus /></span>
              <span>Deposit</span>
            </a>
            <a href="/upi" className="quick-action-btn">
              <span className="action-icon act-withdraw"><FaArrowDown /></span>
              <span>Withdraw</span>
            </a>
            <a href="/team" className="quick-action-btn">
              <span className="action-icon act-refer"><FaShareAlt /></span>
              <span>Team Stats</span>
            </a>
            <a href="/buy" className="quick-action-btn">
              <span className="action-icon act-buy"><FaCoins /></span>
              <span>Invest</span>
            </a>
          </div>
        </GlassCard>
      </div>

      {/* Recent Activity Section */}
      <div className="recent-activity-section">
        <GlassCard className="activity-card">
          <div className="panel-header">
            <h4>Recent Activity Logs</h4>
            <a href="/upi" className="see-all-link">See Transaction History</a>
          </div>
          
          <div className="activity-list">
            {transactions.length === 0 ? (
              <div className="no-activity">
                <p>No transactions logged yet. Start earning rewards today!</p>
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx._id} className="activity-item">
                  <div className="activity-left">
                    {getTransactionIcon(tx.type)}
                    <div className="activity-info">
                      <p className="activity-desc">{tx.description}</p>
                      <span className="activity-time">
                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div className="activity-right">
                    <span className={`activity-amount ${tx.type === 'deposit' || tx.type === 'reward' || tx.type === 'referral' ? 'positive' : 'negative'}`}>
                      {tx.type === 'deposit' || tx.type === 'reward' || tx.type === 'referral' ? '+' : '-'}₹{tx.amount?.toFixed(2)}
                    </span>
                    <span className={`tx-status ${getTransactionStatusClass(tx.status)}`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default Home;
