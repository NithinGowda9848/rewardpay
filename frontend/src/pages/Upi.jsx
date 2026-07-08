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
  FaMobileAlt,
  FaDownload,
  FaWallet,
  FaGoogle
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
  const [bankUserName, setBankUserName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [formError, setFormError] = useState('');

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

  const fetchTransactions = async () => {
    try {
      const res = await API.get('/wallet/transactions');
      if (res.data.success) {
        setTransactions(res.data.data);
      }
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const notInstalled = params.get('not_installed');
    if (notInstalled) {
      if (notInstalled === 'any') {
        setFormError('No UPI applications are available on this device.');
      } else {
        setFormError('Selected UPI app is not installed on this device.');
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.search]);

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
      });

      if (res.data.success) {
        setModalTitle('Deposit Submitted!');
        setModalMsg(`Your deposit request for ₹${depAmount.toFixed(2)} has been submitted with UTR: ${utr}. It is currently pending verification.`);
        setIsModalOpen(true);
        setAmount('');
        setUtr('');
        setScreenshot('');
        setScreenshotPreview('');
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
      if (!bankUserName || !accountNumber || !ifscCode) {
        setFormError('Please fill in all bank details (name, account number, and IFSC code)');
        return;
      }
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

  const copyUpiAddress = () => {
    navigator.clipboard.writeText('kesavaroyal117-1@okicici');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getUpiUrl = (targetApp) => {
    switch (targetApp) {
      case 'paytm':
        return 'https://paytm.com?utm_source=chatgpt.com';
      case 'phonepe':
        return 'https://www.phonepe.com?utm_source=chatgpt.com';
      case 'gpay':
        return 'https://pay.google.com?utm_source=chatgpt.com';
      case 'bhim':
        return 'https://www.bhimupi.org.in?utm_source=chatgpt.com';
      case 'amazonpay':
        return 'https://www.amazon.in/amazonpay?utm_source=chatgpt.com';
      case 'supermoney':
        return 'https://super.money?utm_source=chatgpt.com';
      case 'payzapp':
        return 'https://www.payzapp.in?utm_source=chatgpt.com';
      default:
        return 'https://paytm.com?utm_source=chatgpt.com';
    }
  };

  const handleUpiPayment = (e, app) => {
    e.preventDefault();
    setFormError('');

    // Copy the UPI ID to clipboard
    navigator.clipboard.writeText('kesavaroyal117-1@okicici');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    const url = getUpiUrl(app);
    window.location.href = url;
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
                    <p className="qr-subtext">Copy the UPI ID below to pay, or use direct payment apps.</p>

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

                    <div className="direct-pay-apps">
                      <button type="button" onClick={(e) => handleUpiPayment(e, 'paytm')} className="paytm-pay-btn">
                        <FaMobileAlt /> Pay via Paytm
                      </button>
                      <button type="button" onClick={(e) => handleUpiPayment(e, 'phonepe')} className="phonepe-pay-btn">
                        <FaWallet /> Pay via PhonePe
                      </button>
                      <button type="button" onClick={(e) => handleUpiPayment(e, 'gpay')} className="gpay-pay-btn">
                        <FaGoogle /> Pay via Google Pay
                      </button>
                      <button type="button" onClick={(e) => handleUpiPayment(e, 'bhim')} className="bhim-pay-btn">
                        <FaMobileAlt /> Pay via BHIM
                      </button>
                      <button type="button" onClick={(e) => handleUpiPayment(e, 'amazonpay')} className="amazon-pay-btn">
                        <FaMobileAlt /> Pay via Amazon Pay
                      </button>
                      <button type="button" onClick={(e) => handleUpiPayment(e, 'supermoney')} className="supermoney-pay-btn">
                        <FaMobileAlt /> Pay via Super.money
                      </button>
                      <button type="button" onClick={(e) => handleUpiPayment(e, 'payzapp')} className="payzapp-pay-btn">
                        <FaMobileAlt /> Pay via PayZapp
                      </button>
                    </div>

                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '15px', textAlign: 'center', lineHeight: '1.5' }}>
                      * UPI ID is auto-copied to clipboard. If the app opens to the search page (like in the referral screen), simply paste and proceed.
                    </p>
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
                        href="https://t.me/Rewardpayindia"
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
                  href="https://t.me/Rewardpayindia"
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
          <div className="history-header">
            <h4><FaHistory /> Wallet Transaction Logs</h4>
          </div>

          <div className="history-list">
            {transactions.length === 0 ? (
              <div className="no-history-text">
                <p>No transaction history logged.</p>
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx._id} className="history-row">
                  <div className="history-row-left">
                    <div className={`type-badge badge-${tx.type}`}>{tx.type}</div>
                    <div className="history-info">
                      <p className="history-desc">{tx.description}</p>
                      <span className="history-time">{new Date(tx.createdAt).toLocaleString()}</span>
                      {tx.utr && <span className="history-utr-text">UTR: {tx.utr}</span>}
                      {tx.screenshot && (
                        <button
                          type="button"
                          className="view-screenshot-inline-btn"
                          onClick={() => setActiveScreenshot({ url: tx.screenshot, utr: tx.utr })}
                        >
                          <FaImage /> View Screenshot
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="history-row-right">
                    <span className={`history-amount ${tx.type === 'deposit' || tx.type === 'reward' || tx.type === 'referral' ? 'pos' : 'neg'}`}>
                      {tx.type === 'deposit' || tx.type === 'reward' || tx.type === 'referral' ? '+' : '-'}₹{tx.amount?.toFixed(2)}
                    </span>
                    <div className="status-container">
                      <span className={`status-pill ${tx.status}`}>{tx.status}</span>
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
    </div>
  );
};

export default Upi;
