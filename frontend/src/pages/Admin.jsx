import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import GlassCard from '../components/GlassCard';
import SuccessModal from '../components/SuccessModal';
import { FaImage, FaSpinner, FaCheckCircle, FaUser, FaPhoneAlt, FaEnvelope } from 'react-icons/fa';
import './Admin.css';

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState(null);
  const [activeScreenshot, setActiveScreenshot] = useState(null);

  // Success modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMsg, setModalMsg] = useState('');

  // Redirect if not admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const fetchPendingDeposits = async () => {
    try {
      const res = await API.get('/wallet/admin/pending-deposits');
      if (res.data.success) {
        setPendingDeposits(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching pending deposits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchPendingDeposits();
    }
  }, [user]);

  const handleVerifyDeposit = async (txId, amount) => {
    setVerifyingId(txId);
    try {
      const res = await API.post(`/wallet/admin/confirm-deposit/${txId}`);
      if (res.data.success) {
        setModalTitle('Deposit Approved!');
        setModalMsg(`Successfully approved the deposit request. ₹${amount.toFixed(2)} has been credited to the user's wallet.`);
        setIsModalOpen(true);
        // Refresh list
        fetchPendingDeposits();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve deposit');
    } finally {
      setVerifyingId(null);
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Control Panel</h1>
        <p>Review and verify pending UPI user deposit transactions.</p>
      </div>

      <GlassCard className="admin-card">
        <div className="admin-card-header">
          <h2>Pending Deposit Approvals</h2>
          <span className="pending-count">{pendingDeposits.length} pending</span>
        </div>

        {loading ? (
          <div className="admin-loading">
            <FaSpinner className="spinner" />
            <p>Loading pending transactions...</p>
          </div>
        ) : pendingDeposits.length === 0 ? (
          <div className="no-pending-deposits">
            <FaCheckCircle className="empty-icon" />
            <h3>All Caught Up!</h3>
            <p>There are no pending deposit requests requiring verification.</p>
          </div>
        ) : (
          <div className="deposits-list">
            {pendingDeposits.map((tx) => (
              <div key={tx._id} className="deposit-row">
                <div className="deposit-user-info">
                  <div className="info-item">
                    <FaUser className="info-icon" />
                    <div>
                      <label>Username</label>
                      <p>{tx.userId?.username || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <FaPhoneAlt className="info-icon" />
                    <div>
                      <label>Mobile</label>
                      <p>{tx.userId?.mobile || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <FaEnvelope className="info-icon" />
                    <div>
                      <label>Email</label>
                      <p>{tx.userId?.email || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="deposit-tx-details">
                  <div className="detail-item">
                    <label>Amount</label>
                    <p className="amount-text">₹{tx.amount?.toFixed(2)}</p>
                  </div>
                  <div className="detail-item">
                    <label>UTR / Ref ID</label>
                    <p className="utr-text">{tx.utr}</p>
                  </div>
                  <div className="detail-item">
                    <label>Submitted At</label>
                    <p className="date-text">{new Date(tx.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div className="deposit-actions">
                  {tx.screenshot ? (
                    <button
                      type="button"
                      className="btn-screenshot"
                      onClick={() => setActiveScreenshot({ url: tx.screenshot, utr: tx.utr })}
                    >
                      <FaImage /> View Screenshot
                    </button>
                  ) : (
                    <span className="no-screenshot">No Screenshot</span>
                  )}
                  <button
                    className="btn-verify"
                    disabled={verifyingId === tx._id}
                    onClick={() => handleVerifyDeposit(tx._id, tx.amount)}
                  >
                    {verifyingId === tx._id ? 'Verifying...' : 'Approve & Verify'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Success Modal */}
      <SuccessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        message={modalMsg}
      />

      {/* Custom Screenshot View Modal */}
      {activeScreenshot && (
        <div className="modal-overlay" onClick={() => setActiveScreenshot(null)}>
          <div className="modal-content glass-panel animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3>Deposit Proof Screenshot</h3>
            <p style={{ margin: '8px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              UTR Reference: {activeScreenshot.utr || 'N/A'}
            </p>
            <div className="screenshot-modal-view">
              <img src={activeScreenshot.url} alt="Uploaded Payment Proof" className="screenshot-view-img" />
            </div>
            <button onClick={() => setActiveScreenshot(null)} className="btn-primary modal-close-btn" style={{ marginTop: '20px' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
