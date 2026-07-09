import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import GlassCard from '../components/GlassCard';
import SuccessModal from '../components/SuccessModal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { 
  FaPlusCircle, 
  FaMinusCircle, 
  FaHistory, 
  FaCopy, 
  FaSpinner, 
  FaUpload, 
  FaQuestionCircle, 
  FaImage,
  FaDownload
} from 'react-icons/fa';
import './Upi.css';

const Upi = () => {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  
  // Tab control: 'deposit' | 'withdraw'
  const [activeTab, setActiveTab] = useState('deposit');
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  
  // Form states
  const [amount, setAmount] = useState('');
  const [utr, setUtr] = useState('');
  const [screenshot, setScreenshot] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [withdrawUpi, setWithdrawUpi] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('upi'); // 'upi' | 'bank'
  const [bankName, setBankName] = useState('');
  const [bankUserName, setBankUserName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [formError, setFormError] = useState('');
  const [paymentTime, setPaymentTime] = useState('');

  // Tab control: 'deposit' | 'withdraw'
  const [historyTab, setHistoryTab] = useState('deposit');
  
  // Help sections
  const [showDepositHelp, setShowDepositHelp] = useState(false);
  const [showWithdrawHelp, setShowWithdrawHelp] = useState(false);

  // Screenshot view modal
  const [activeScreenshot, setActiveScreenshot] = useState(null);

  // Success modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMsg, setModalMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);

  // Simulation states
  const [showSimulator, setShowSimulator] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [simulationRemark, setSimulationRemark] = useState({});
  const [simLoading, setSimLoading] = useState(false);

  const fetchPendingRequests = async () => {
    try {
      const res = await API.get('/wallet/admin/pending');
      if (res.data.success) {
        setPendingRequests(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching pending requests for simulator:', err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await API.get('/wallet/transactions');
      if (res.data.success) {
        setTransactions(res.data.data);
      }
      fetchPendingRequests();
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (location.state && location.state.amount) {
      setAmount(location.state.amount.toString());
      setActiveTab('deposit');
    }
  }, [location.state]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate type
      if (!file.type.startsWith('image/')) {
        setFormError('Please select a valid image file');
        return;
      }
      // Show preview
      setScreenshotPreview(URL.createObjectURL(file));
      // Read base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const depAmount = parseFloat(amount);
    if (!depAmount || depAmount <= 0) {
      setFormError('Please enter a valid deposit amount');
      return;
    }

    if (!utr) {
      setFormError('Please enter the 12-digit transaction UTR / Reference ID');
      return;
    }

    if (utr.trim().length !== 12 || isNaN(utr)) {
      setFormError('UTR must be exactly a 12-digit number');
      return;
    }

    if (!screenshot) {
      setFormError('Please upload a screenshot of your payment');
      return;
    }

    setTxLoading(true);
    try {
      const res = await API.post('/wallet/deposit', {
        amount: depAmount,
        utr,
        screenshot,
        paymentTime,
      });

      if (res.data.success) {
        setModalTitle('Deposit Request Submitted Successfully.');
        setModalMsg(`Your deposit request for ₹${depAmount.toFixed(2)} has been submitted with UTR: ${utr}. It is currently pending verification.`);
        setIsModalOpen(true);
        setAmount('');
        setUtr('');
        setScreenshot('');
        setScreenshotPreview('');
        setPaymentTime('');
        fetchTransactions(); // Refresh log
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Deposit submission failed');
    } finally {
      setTxLoading(false);
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const wdrAmount = parseFloat(amount);
    if (!wdrAmount || wdrAmount <= 0) {
      setFormError('Please enter a valid withdrawal amount');
      return;
    }

    if (wdrAmount < 300) {
      setFormError('Minimum withdrawal amount is ₹300');
      return;
    }

    if (user.walletBalance < wdrAmount) {
      setFormError('Insufficient wallet balance');
      return;
    }

    let payload = { amount: wdrAmount, paymentMethod: withdrawMethod };
    if (withdrawMethod === 'upi') {
      if (!withdrawUpi) {
        setFormError('Please enter your payout UPI ID');
        return;
      }
      payload.upiId = withdrawUpi;
    } else {
      if (!bankName || !bankUserName || !accountNumber || !ifscCode) {
        setFormError('Please fill in all bank details (bank name, holder name, account number, and IFSC code)');
        return;
      }
      payload.bankName = bankName;
      payload.bankUserName = bankUserName;
      payload.accountNumber = accountNumber;
      payload.ifscCode = ifscCode;
    }

    setTxLoading(true);
    try {
      const res = await API.post('/wallet/withdraw', payload);

      if (res.data.success) {
        setModalTitle('Withdrawal Requested!');
        const displayTarget = withdrawMethod === 'upi' ? `UPI ID: ${withdrawUpi}` : `Bank A/C: ${accountNumber}`;
        setModalMsg(`A withdrawal request of ₹${wdrAmount.toFixed(2)} to ${displayTarget} has been submitted successfully and is pending approval.`);
        setIsModalOpen(true);
        setAmount('');
        setWithdrawUpi('');
        setBankName('');
        setBankUserName('');
        setAccountNumber('');
        setIfscCode('');
        await refreshUser();
        fetchTransactions();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Withdrawal request failed');
    } finally {
      setTxLoading(false);
    }
  };

  const handleAdminApprove = async (id, type) => {
    setSimLoading(true);
    try {
      const endpoint = type === 'deposit' 
        ? `/wallet/admin/confirm-deposit/${id}`
        : `/wallet/admin/confirm-withdrawal/${id}`;
      
      const remark = simulationRemark[id] || '';
      const res = await API.post(endpoint, { adminRemark: remark });
      
      if (res.data.success) {
        setSimulationRemark(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        await refreshUser();
        await fetchTransactions();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Approve action failed');
    } finally {
      setSimLoading(false);
    }
  };

  const handleAdminReject = async (id, type) => {
    const remark = simulationRemark[id];
    if (!remark || !remark.trim()) {
      alert('Please enter a rejection remark / reason for rejection');
      return;
    }
    setSimLoading(true);
    try {
      const endpoint = type === 'deposit' 
        ? `/wallet/admin/reject-deposit/${id}`
        : `/wallet/admin/reject-withdrawal/${id}`;
      
      const res = await API.post(endpoint, { adminRemark: remark });
      
      if (res.data.success) {
        setSimulationRemark(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        await refreshUser();
        await fetchTransactions();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Reject action failed');
    } finally {
      setSimLoading(false);
    }
  };

  const copyUpiAddress = () => {
    navigator.clipboard.writeText('kesavaroyal117-1@okicici');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusClass = (status) => {
    const s = status ? status.toLowerCase() : '';
    if (s === 'approved' || s === 'completed' || s === 'paid') return 'completed';
    if (s === 'pending') return 'pending';
    if (s === 'rejected' || s === 'failed') return 'failed';
    return 'pending';
  };

  if (loading) {
    return (
      <div className="page-container">
        <LoadingSkeleton type="card" count={2} />
        <div style={{ marginTop: '20px' }}>
          <LoadingSkeleton type="list" count={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="upi-header">
        <h1>UPI Transactions</h1>
        <p>Fund your account wallet via UPI scanning, or request rapid withdrawals directly to your banking address.</p>
      </div>

      <div className="upi-main-container">
        <GlassCard className="upi-card">
          {/* Tab Header */}
          <div className="upi-tabs">
            <button
              className={`upi-tab-btn ${activeTab === 'deposit' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('deposit');
                setFormError('');
                setAmount('');
                setUtr('');
                setScreenshot('');
                setScreenshotPreview('');
              }}
            >
              <FaPlusCircle /> Deposit Funds
            </button>
            <button
              className={`upi-tab-btn ${activeTab === 'withdraw' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('withdraw');
                setFormError('');
                setAmount('');
                setWithdrawUpi('');
              }}
            >
              <FaMinusCircle /> Withdraw Funds
            </button>
          </div>

          {formError && <div className="upi-form-error animate-fade-in">{formError}</div>}

          {/* Deposit Layout */}
          {activeTab === 'deposit' && (
            <div className="deposit-layout animate-fade-in">
              <div className="deposit-grid">
                
                {/* Step 1: Scan and Pay */}
                <div className="deposit-qr-column">
                  <div className="qr-box-wrapper">
                    <h4>UPI Payment</h4>
                    <p className="qr-subtext">Copy the UPI ID below to pay using your preferred UPI app.</p>
                    
                    <div style={{ margin: '10px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Amount to Pay</span>
                      <span style={{ fontSize: '28px', fontWeight: '800', color: '#ffffff' }}>₹{parseFloat(amount) || 0}</span>
                    </div>

                    <div className="merchant-address-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
                      <span className="merchant-lbl">Merchant Name: <strong style={{ color: '#ffffff' }}>Akula kesava</strong></span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span className="merchant-lbl">Merchant UPI: <strong>kesavaroyal117-1@okicici</strong></span>
                        <button type="button" onClick={copyUpiAddress} className="copy-btn-mini">
                          <FaCopy /> {copied ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2: Verification details */}
                <div className="deposit-form-column">
                  <form onSubmit={handleDepositSubmit} className="upi-form">
                    
                    <div className="upi-input-group">
                      <label htmlFor="amount">Deposit Amount (₹)</label>
                      <input
                        id="amount"
                        type="number"
                        min="1"
                        className="input-field"
                        placeholder="Enter paid amount (e.g. 500)"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />
                    </div>

                    <div className="upi-input-group">
                      <label htmlFor="utr">UTR / Transaction ID (12 Digits)</label>
                      <input
                        id="utr"
                        type="text"
                        maxLength="12"
                        className="input-field"
                        placeholder="Enter 12-digit UTR code"
                        value={utr}
                        onChange={(e) => setUtr(e.target.value)}
                        required
                      />
                    </div>

                    <div className="upi-input-group">
                      <label htmlFor="paymentTime">Payment Time</label>
                      <input
                        id="paymentTime"
                        type="datetime-local"
                        className="input-field"
                        value={paymentTime}
                        onChange={(e) => setPaymentTime(e.target.value)}
                        required
                      />
                    </div>

                    <div className="upi-input-group">
                      <label>Payment Screenshot</label>
                      <div className="screenshot-upload-zone">
                        <input
                          id="screenshot-input"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                          required={!screenshot}
                        />
                        <label htmlFor="screenshot-input" className="upload-label">
                          <FaUpload className="upload-icon" />
                          <span>{screenshot ? 'Change Screenshot' : 'Upload Payment Screenshot'}</span>
                        </label>
                      </div>
                      
                      {screenshotPreview && (
                        <div className="screenshot-preview-container animate-fade-in">
                          <img src={screenshotPreview} alt="Screenshot Preview" className="screenshot-preview" />
                          <span className="preview-lbl"><FaImage /> Preview Loaded</span>
                        </div>
                      )}
                    </div>

                    <div className="submit-action-container">
                      <button type="submit" className="btn-primary upi-submit-btn" disabled={txLoading}>
                        {txLoading ? <FaSpinner className="spin" /> : 'Submit Deposit'}
                      </button>
                    </div>

                    {/* Permanent Guidelines Box */}
                    <div className="deposit-guidelines-box animate-fade-in" style={{ marginTop: '20px' }}>
                      <h5>Deposit Guidelines</h5>
                      <ul>
                        <li>1. Copy the UPI ID: <strong>kesavaroyal117-1@okicici</strong>.</li>
                        <li>2. Use Paytm, PhonePe, or any other UPI app to make the payment.</li>
                        <li>3. Enter the payment amount and complete the transaction.</li>
                        <li>4. Copy the <strong>12-digit UTR / Reference ID</strong> from payment receipt.</li>
                        <li>5. Take a screenshot of the successful payment screen.</li>
                        <li>6. Fill in the amount, paste the UTR, upload the screenshot, and click Submit.</li>
                      </ul>
                      <a 
                        href="https://t.me/rewardpayindia1"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="help-text-btn-blue"
                        data-tooltip="Need Help? Click to chat with Support on Telegram."
                        title="Telegram Support"
                      >
                        Deposit Help
                      </a>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Withdraw Layout */}
          {/* Withdraw Layout */}
          {activeTab === 'withdraw' && (
            <form onSubmit={handleWithdrawSubmit} className="upi-form animate-fade-in">
              <div className="withdraw-balance-bar">
                <span>Available Balance:</span>
                <strong>₹{user?.walletBalance?.toFixed(2)}</strong>
              </div>

              <div className="upi-input-group">
                <label>Select Withdrawal Mode</label>
                <div className="upi-tabs" style={{ marginBottom: 0, padding: '4px' }}>
                  <button
                    type="button"
                    className={`upi-tab-btn ${withdrawMethod === 'upi' ? 'active' : ''}`}
                    onClick={() => {
                      setWithdrawMethod('upi');
                      setFormError('');
                    }}
                  >
                    UPI ID
                  </button>
                  <button
                    type="button"
                    className={`upi-tab-btn ${withdrawMethod === 'bank' ? 'active' : ''}`}
                    onClick={() => {
                      setWithdrawMethod('bank');
                      setFormError('');
                    }}
                  >
                    Bank Transfer
                  </button>
                </div>
              </div>

              <div className="upi-input-group">
                <label htmlFor="amount">Withdrawal Amount (₹)</label>
                <input
                  id="amount"
                  type="number"
                  min="300"
                  className="input-field"
                  placeholder="Minimum ₹300"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                <span className="input-hint">Limit: ₹300 Minimum</span>
              </div>

              {withdrawMethod === 'upi' ? (
                <div className="upi-input-group animate-fade-in">
                  <label htmlFor="withdrawUpi">Your Target UPI ID</label>
                  <input
                    id="withdrawUpi"
                    type="text"
                    className="input-field"
                    placeholder="yourname@okaxis"
                    value={withdrawUpi}
                    onChange={(e) => setWithdrawUpi(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <div className="bank-inputs-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="upi-input-group">
                    <label htmlFor="bankName">Bank Name</label>
                    <input
                      id="bankName"
                      type="text"
                      className="input-field"
                      placeholder="Enter bank name (e.g. State Bank of India)"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="upi-input-group">
                    <label htmlFor="bankUserName">Bank Account Holder Name</label>
                    <input
                      id="bankUserName"
                      type="text"
                      className="input-field"
                      placeholder="Enter account holder's name"
                      value={bankUserName}
                      onChange={(e) => setBankUserName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="upi-input-group">
                    <label htmlFor="accountNumber">Bank Account Number</label>
                    <input
                      id="accountNumber"
                      type="text"
                      className="input-field"
                      placeholder="Enter bank account number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div className="upi-input-group">
                    <label htmlFor="ifscCode">Bank IFSC Code</label>
                    <input
                      id="ifscCode"
                      type="text"
                      className="input-field"
                      placeholder="Enter bank IFSC (e.g. SBIN0001234)"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="submit-action-container">
                <button type="submit" className="btn-primary upi-submit-btn" disabled={txLoading}>
                  {txLoading ? <FaSpinner className="spin" /> : 'Submit Withdrawal Request'}
                </button>
                <a 
                  href="https://t.me/rewardpayindia1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="help-text-btn-blue"
                  data-tooltip="Need Help? Click to chat with Support on Telegram."
                  title="Telegram Support"
                >
                  Withdraw Help
                </a>
              </div>
            </form>
          )}
        </GlassCard>
      </div>

      {/* Transaction History Section */}
      <div className="upi-history-section">
        <GlassCard className="upi-history-card">
          <div className="history-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <h4 style={{ margin: 0 }}><FaHistory /> Transaction History</h4>
            
            <div className="upi-tabs" style={{ margin: 0, padding: '2px', height: '36px', minWidth: '240px' }}>
              <button
                type="button"
                className={`upi-tab-btn ${historyTab === 'deposit' ? 'active' : ''}`}
                style={{ padding: '6px 12px', fontSize: '13px' }}
                onClick={() => setHistoryTab('deposit')}
              >
                Deposit History
              </button>
              <button
                type="button"
                className={`upi-tab-btn ${historyTab === 'withdraw' ? 'active' : ''}`}
                style={{ padding: '6px 12px', fontSize: '13px' }}
                onClick={() => setHistoryTab('withdraw')}
              >
                Withdraw History
              </button>
            </div>
          </div>

          <div className="history-list">
            {transactions.filter(t => historyTab === 'deposit' ? t.type === 'deposit' : t.type === 'withdraw').length === 0 ? (
              <div className="no-history-text">
                <p>No transactions logged.</p>
              </div>
            ) : (
              transactions.filter(t => historyTab === 'deposit' ? t.type === 'deposit' : t.type === 'withdraw').map((tx) => (
                <div key={tx._id} className="history-row">
                  <div className="history-row-left">
                    <div className={`type-badge badge-${tx.type}`}>{tx.type}</div>
                    <div className="history-info">
                      <p className="history-desc">{tx.description}</p>
                      <span className="history-time">{new Date(tx.createdAt).toLocaleString()}</span>
                      {tx.utr && <span className="history-utr-text">UTR: {tx.utr}</span>}
                      {tx.paymentTime && <span className="history-utr-text">Payment Time: {new Date(tx.paymentTime).toLocaleString()}</span>}
                      {tx.screenshot && (
                        <button
                          type="button"
                          className="view-screenshot-inline-btn"
                          onClick={() => setActiveScreenshot({ url: tx.screenshot, utr: tx.utr })}
                        >
                          <FaImage /> View Screenshot
                        </button>
                      )}
                      {tx.adminRemark && (
                        <div className="admin-remark-box" style={{ marginTop: '8px', fontSize: '12.5px', color: '#f59e0b', borderLeft: '2px solid #f59e0b', paddingLeft: '8px', textAlign: 'left' }}>
                          <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Admin Remark:</span>
                          {tx.adminRemark}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="history-row-right">
                    <span className={`history-amount ${tx.type === 'deposit' || tx.type === 'reward' || tx.type === 'referral' ? 'pos' : 'neg'}`}>
                      {tx.type === 'deposit' || tx.type === 'reward' || tx.type === 'referral' ? '+' : '-'}₹{tx.amount?.toFixed(2)}
                    </span>
                    <div className="status-container">
                      <span className={`status-pill ${getStatusClass(tx.status)}`}>{tx.status}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>

      {/* Success Payout Modal */}
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
            <h3>Payment Screenshot</h3>
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
      {/* Floating Simulation Trigger */}
      <button
        onClick={() => setShowSimulator(!showSimulator)}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '24px',
          background: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)',
          color: '#ffffff',
          border: '1px solid rgba(255,255,255,0.2)',
          padding: '12px 18px',
          borderRadius: '30px',
          fontSize: '12px',
          fontWeight: '700',
          cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(79, 70, 229, 0.4)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'transform 0.2s ease',
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <span>🛠️ Admin Simulator</span>
        <span style={{
          background: '#ef4444',
          color: '#ffffff',
          borderRadius: '50%',
          padding: '2px 6px',
          fontSize: '10px',
        }}>
          {pendingRequests.length}
        </span>
      </button>

      {/* Simulation Drawer */}
      {showSimulator && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(10, 11, 16, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 99999,
          }}
          onClick={() => setShowSimulator(false)}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '480px',
              height: '100%',
              background: 'rgba(15, 18, 28, 0.95)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '30px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              overflowY: 'auto',
              boxShadow: '-10px 0 40px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#ffffff' }}>🛠️ Admin Simulation</h3>
              <button 
                onClick={() => setShowSimulator(false)}
                style={{ background: 'transparent', border: 'none', color: '#a0aec0', fontSize: '20px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, textAlign: 'left' }}>
              Use this simulator to instantly approve or reject pending requests. Wallet balances will update automatically on screen!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              {pendingRequests.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
                  No pending requests found in DB.
                </div>
              ) : (
                pendingRequests.map((req) => (
                  <div 
                    key={req._id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        fontWeight: 'bold',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: req.type === 'deposit' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                        color: req.type === 'deposit' ? 'var(--color-emerald)' : 'var(--color-rose)'
                      }}>
                        {req.type}
                      </span>
                      <strong style={{ color: '#ffffff', fontSize: '16px' }}>₹{req.amount}</strong>
                    </div>

                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div>User: <strong>{req.userId?.name || req.userId?.username || 'N/A'}</strong> ({req.userId?.mobile || 'N/A'})</div>
                      <div>Details: {req.description}</div>
                      {req.utr && <div>UTR: <code style={{ color: '#f59e0b' }}>{req.utr}</code></div>}
                      {req.paymentTime && <div>Payment Time: <span>{new Date(req.paymentTime).toLocaleString()}</span></div>}
                      {req.screenshot && (
                        <button
                          type="button"
                          className="view-screenshot-inline-btn"
                          onClick={() => setActiveScreenshot({ url: req.screenshot, utr: req.utr })}
                        >
                          <FaImage /> View Screenshot Proof
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <input 
                        type="text"
                        className="input-field"
                        style={{ padding: '8px 12px', fontSize: '12px', height: '36px' }}
                        placeholder="Admin remark / rejection reason..."
                        value={simulationRemark[req._id] || ''}
                        onChange={(e) => setSimulationRemark({ ...simulationRemark, [req._id]: e.target.value })}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleAdminApprove(req._id, req.type)}
                          disabled={simLoading}
                          style={{
                            flex: 1,
                            background: 'var(--gradient-success)',
                            border: 'none',
                            color: '#ffffff',
                            padding: '8px',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAdminReject(req._id, req.type)}
                          disabled={simLoading}
                          style={{
                            flex: 1,
                            background: 'var(--gradient-danger)',
                            border: 'none',
                            color: '#ffffff',
                            padding: '8px',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upi;
