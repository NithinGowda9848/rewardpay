import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import GlassCard from '../components/GlassCard';
import SuccessModal from '../components/SuccessModal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { FaCalendarAlt, FaCoins, FaCheckCircle, FaExclamationTriangle, FaMobileAlt, FaCopy, FaUpload, FaSpinner, FaImage, FaLink } from 'react-icons/fa';
import './Buy.css';

const getBackendHost = () => {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isLocalhost ? 'http://localhost:5000' : 'https://s-reward-pay.onrender.com';
};

const Buy = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [packages, setPackages] = useState([]);
  const [activeInvestments, setActiveInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(null);

  // Tab states
  const currency = 'INR';
  const [category, setCategory] = useState('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMsg, setModalMsg] = useState('');
  const [purchaseError, setPurchaseError] = useState('');

  // Deposit Modal states
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [copied, setCopied] = useState(false);
  const [utr, setUtr] = useState('');
  const [screenshot, setScreenshot] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [txLoading, setTxLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const categories = [
    'ALL',
    '510-4500',
    '7000-14000',
    '19999-55000',
    '75000-115000',
    '250000-999999'
  ];

  const fetchPackagesAndInvestments = async () => {
    try {
      const [packagesRes, activeRes] = await Promise.all([
        API.get('/purchase/packages'),
        API.get('/purchase/active')
      ]);

      if (packagesRes.data.success) {
        setPackages(packagesRes.data.data);
      }
      if (activeRes.data.success) {
        setActiveInvestments(activeRes.data.data);
      }
    } catch (err) {
      console.warn('Error fetching packages from backend, loading offline fallback data:', err);
      const offlinePackages = [
        {
          _id: 'mock_pkg_3',
          name: 'Growth Plan',
          price: 510,
          dailyEarnings: 37,
          validityDays: 30,
          tag: '510-4500',
          icon: 'FaCrown',
          image: '/images/biomass.png',
          vipLevel: 0,
          maxCopies: 10,
          date: '2026-06-04',
        },
        {
          _id: 'mock_pkg_4',
          name: 'Solar System',
          price: 1080,
          dailyEarnings: 60.0,
          validityDays: 30,
          tag: '510-4500',
          icon: 'FaCrown',
          image: '/images/solar_farm.png',
          vipLevel: 0,
          maxCopies: 10,
          date: '2026-06-04',
        },
        {
          _id: 'mock_pkg_5',
          name: 'Windmills',
          price: 1799,
          dailyEarnings: 130.0,
          validityDays: 30,
          tag: '510-4500',
          icon: 'FaCrown',
          image: '/images/wind_turbines.png',
          vipLevel: 0,
          maxCopies: 10,
          date: '2026-06-04',
        },
        {
          _id: 'mock_pkg_6',
          name: 'Hydroplant',
          price: 2999,
          dailyEarnings: 280.0,
          validityDays: 30,
          tag: '510-4500',
          icon: 'FaCrown',
          image: '/images/hydro_plant.png',
          vipLevel: 0,
          maxCopies: 10,
          date: '2026-06-04',
        },
        {
          _id: 'mock_pkg_7',
          name: 'Geothermal Energy',
          price: 4500,
          dailyEarnings: 350.0,
          validityDays: 30,
          tag: '510-4500',
          icon: 'FaCrown',
          image: '/images/geothermal.png',
          vipLevel: 0,
          maxCopies: 10,
          date: '2026-06-04',
        },
        {
          _id: 'mock_pkg_8',
          name: 'Hydrogen Cell',
          price: 7000,
          dailyEarnings: 480.0,
          validityDays: 30,
          tag: '7000-14000',
          icon: 'FaCrown',
          image: '/images/hydrogen.png',
          vipLevel: 1,
          maxCopies: 10,
          date: '2026-06-04',
        },
        {
          _id: 'mock_pkg_9',
          name: 'Solar Array',
          price: 9999,
          dailyEarnings: 710.0,
          validityDays: 30,
          tag: '7000-14000',
          icon: 'FaCrown',
          image: '/images/solar_canopy.png',
          vipLevel: 1,
          maxCopies: 10,
          date: '2026-06-04',
        },
        {
          _id: 'mock_pkg_10',
          name: 'Tidal Energy',
          price: 14000,
          dailyEarnings: 1500.0,
          validityDays: 15,
          tag: '7000-14000',
          icon: 'FaCrown',
          image: '/images/tidal_energy.png',
          vipLevel: 1,
          maxCopies: 10,
          date: '2026-06-04',
        },
        {
          _id: 'mock_pkg_11',
          name: 'Offshore Windfarm',
          price: 19999,
          dailyEarnings: 980.0,
          validityDays: 30,
          tag: '19999-55000',
          icon: 'FaGem',
          image: '/images/wind_offshore.png',
          vipLevel: 2,
          maxCopies: 10,
          date: '2026-06-04',
        },
        {
          _id: 'mock_pkg_12',
          name: 'Substation Link',
          price: 26599,
          dailyEarnings: 1400.0,
          validityDays: 30,
          tag: '19999-55000',
          icon: 'FaGem',
          image: '/images/substation.png',
          vipLevel: 2,
          maxCopies: 10,
          date: '2026-06-04',
        },
        {
          _id: 'mock_pkg_13',
          name: 'Hydrogen Power Plant',
          price: 30999,
          dailyEarnings: 3500.0,
          validityDays: 15,
          tag: '19999-55000',
          icon: 'FaGem',
          image: '/images/hydrogen.png',
          vipLevel: 2,
          maxCopies: 10,
          date: '2026-06-04',
        },
        {
          _id: 'mock_pkg_14',
          name: 'Apex Nuclear Core',
          price: 40000,
          dailyEarnings: 5000.0,
          validityDays: 15,
          tag: '19999-55000',
          icon: 'FaGem',
          image: '/images/nuclear_plant.png',
          vipLevel: 2,
          maxCopies: 10,
          date: '2026-06-04',
        },
        {
          _id: 'mock_pkg_15',
          name: 'Eco Smart City Grid',
          price: 42000,
          dailyEarnings: 5300.0,
          validityDays: 15,
          tag: '19999-55000',
          icon: 'FaGem',
          image: '/images/smart_city.png',
          vipLevel: 2,
          maxCopies: 10,
          date: '2026-06-04',
        },
        {
          _id: 'mock_pkg_16',
          name: 'Tidal Wave Array',
          price: 48000,
          dailyEarnings: 6000.0,
          validityDays: 15,
          tag: '19999-55000',
          icon: 'FaGem',
          image: '/images/tidal_energy.png',
          vipLevel: 2,
          maxCopies: 10,
          date: '2026-06-04',
        },
        {
          _id: 'mock_pkg_17',
          name: 'Magma Geothermal',
          price: 55000,
          dailyEarnings: 7500.0,
          validityDays: 15,
          tag: '19999-55000',
          icon: 'FaGem',
          image: '/images/geothermal.png',
          vipLevel: 2,
          maxCopies: 10,
          date: '2026-06-04',
        },
        {
          _id: 'mock_pkg_18',
          name: 'Smart Grid Core',
          price: 75000,
          dailyEarnings: 11000.0,
          validityDays: 15,
          tag: '75000-115000',
          icon: 'FaGem',
          image: '/images/smart_grid.png',
          vipLevel: 3,
          maxCopies: 5,
          date: '2026-06-04',
        },
        {
          _id: 'mock_pkg_19',
          name: 'Power Vault',
          price: 95000,
          dailyEarnings: 15000.0,
          validityDays: 15,
          tag: '75000-115000',
          icon: 'FaGem',
          image: '/images/battery_storage.png',
          vipLevel: 3,
          maxCopies: 5,
          date: '2026-06-04',
        },
        {
          _id: 'mock_pkg_20',
          name: 'Grid Substation',
          price: 110000,
          dailyEarnings: 18000.0,
          validityDays: 15,
          tag: '75000-115000',
          icon: 'FaGem',
          image: '/images/substation.png',
          vipLevel: 3,
          maxCopies: 5,
          date: '2026-06-04',
        },
        {
          _id: 'mock_pkg_21',
          name: 'Smart City Grid',
          price: 115000,
          dailyEarnings: 25000.0,
          validityDays: 15,
          tag: '75000-115000',
          icon: 'FaGem',
          image: '/images/smart_city.png',
          vipLevel: 3,
          maxCopies: 5,
          date: '2026-06-04',
        },
        {
          _id: 'mock_pkg_22',
          name: 'Deepwater Power Grid',
          price: 250000,
          dailyEarnings: 40000.0,
          validityDays: 15,
          tag: '250000-999999',
          icon: 'FaShieldAlt',
          image: '/images/submarine.png',
          vipLevel: 4,
          maxCopies: 3,
          date: '2026-06-04',
        },
        {
          _id: 'mock_pkg_23',
          name: 'Apex Nuclear Station',
          price: 400000,
          dailyEarnings: 65000.0,
          validityDays: 15,
          tag: '250000-999999',
          icon: 'FaShieldAlt',
          image: '/images/nuclear_plant.png',
          vipLevel: 4,
          maxCopies: 3,
          date: '2026-06-04',
        },
        {
          _id: 'mock_pkg_24',
          name: 'Metropolis Mega Grid',
          price: 999999,
          dailyEarnings: 150000.0,
          validityDays: 15,
          tag: '250000-999999',
          icon: 'FaShieldAlt',
          image: '/images/smart_city.png',
          vipLevel: 4,
          maxCopies: 2,
          date: '2026-06-04',
        },
      ];
      setPackages(offlinePackages);

      // Create a nice mock active investment so the bottom list has mock data too!
      setActiveInvestments([
        {
          _id: 'mock_active_2',
          name: 'Growth Plan',
          price: 450,
          dailyEarnings: 37,
          validityDays: 15,
          expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days remaining
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackagesAndInvestments();
  }, []);

  const handleBuy = async (pkg) => {
    setPurchaseLoading(pkg._id);
    setPurchaseError('');

    try {
      const res = await API.post('/purchase/buy', { packageId: pkg._id });
      if (res.data.success) {
        setModalTitle('Purchase Successful!');
        setModalMsg(`You have successfully purchased the ${pkg.name} for ₹${pkg.price.toFixed(2)}. Daily rewards are now accumulating!`);
        setIsModalOpen(true);
        await refreshUser();
        await fetchPackagesAndInvestments();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Purchase failed. Please try again.';
      setPurchaseError(errMsg);
    } finally {
      setPurchaseLoading(null);
    }
  };

  const copyUpiAddress = () => {
    navigator.clipboard.writeText('kesavaroyal117-1@okicici');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getUpiUrl = (targetApp = 'generic') => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (targetApp === 'phonepe') {
      if (isAndroid) {
        return `intent://#Intent;scheme=phonepe;package=com.phonepe.app;end`;
      } else {
        return `phonepe://`;
      }
    }
    return `upi://pay`;
  };

  const handleUpiPayment = (e, app = 'generic') => {
    e.preventDefault();
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isMobile) {
      let webUrl = 'https://www.bhimupi.org.in';
      if (app === 'phonepe') {
        webUrl = 'https://phonepe.com';
      }
      window.open(webUrl, '_blank');
      return;
    }
    const url = getUpiUrl(app);
    window.location.href = url;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result);
        setScreenshotPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!utr || utr.length !== 12) {
      setFormError('Please enter a valid 12-digit UTR number.');
      return;
    }

    if (!screenshot) {
      setFormError('Please upload a payment screenshot.');
      return;
    }

    setTxLoading(true);
    try {
      const res = await API.post('/wallet/deposit', {
        amount: selectedPkg.price,
        utr,
        screenshot
      });

      if (res.data.success) {
        setModalTitle('Deposit Submitted!');
        setModalMsg(`Your deposit of ₹${selectedPkg.price} has been submitted for validation. Once approved (usually within 30 minutes), your wallet will be credited, and you can purchase the ${selectedPkg.name}.`);
        setIsModalOpen(true);
        setShowDepositModal(false);
        setUtr('');
        setScreenshot('');
        setScreenshotPreview('');
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Deposit submission failed. Please try again.');
    } finally {
      setTxLoading(false);
    }
  };

  const handleInvestClick = (pkg) => {
    if (user && user.walletBalance >= pkg.price) {
      handleBuy(pkg);
    } else {
      setSelectedPkg(pkg);
      setShowDepositModal(true);
    }
  };

  const scrollToHistory = () => {
    const section = document.getElementById('active-investments-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Convert prices based on currency selection (1 USDT = 83 INR)
  const formatCurrency = (amount) => {
    return `₹${amount.toFixed(0)}`;
  };

  // Filter packages based on category pill
  const filteredPackages = packages.filter((pkg) => {
    if (category === 'ALL') return true;
    return pkg.tag === category;
  });

  if (loading) {
    return (
      <div className="page-container">
        <LoadingSkeleton type="chart" count={1} />
        <div style={{ marginTop: '24px' }}>
          <LoadingSkeleton type="card" count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">

      {/* Top Header Switcher & History Button */}
      <div className="buy-nav-row">
        <div className="currency-selector-tabs">
          <button className="currency-tab active">
            INR
          </button>
        </div>

        <button onClick={scrollToHistory} className="pill-history-btn">
          INR History
        </button>
      </div>

      {/* Category Horizontal Scrolling Pills */}
      <div className="category-scroll-bar">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-pill ${category === cat ? 'active' : ''}`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {purchaseError && (
        <div className="buy-error-banner animate-fade-in">
          <FaExclamationTriangle /> {purchaseError}
        </div>
      )}

      {/* Package List Grid (Exact layout from user screenshot) */}
      <div className="custom-packages-column">
        {filteredPackages.length === 0 ? (
          <GlassCard className="empty-category-card">
            <p>No plans available in this price category range.</p>
          </GlassCard>
        ) : (
          filteredPackages.map((pkg) => {
            const displayPrice = currency === 'INR' ? pkg.price : (pkg.price / 83);
            const displayIncome = currency === 'INR' ? pkg.dailyEarnings : (pkg.dailyEarnings / 83);
            const totalRevenue = pkg.dailyEarnings * pkg.validityDays;
            const displayQuota = currency === 'INR' ? totalRevenue : (totalRevenue / 83);

            return (
              <GlassCard key={pkg._id} className="exact-product-card">
                {/* Main Card Content: Image on left, Details on right */}
                <div className="prod-card-main-content">
                  {/* Left Column: Image */}
                  <div className="prod-card-image-wrapper">
                    <img
                      src={pkg.image ? pkg.image : '/images/solar_farm.png'}
                      alt={pkg.name}
                      className="prod-card-image"
                    />
                  </div>

                  {/* Right Column: Details */}
                  <div className="prod-card-details-wrapper">
                    {/* Title */}
                    <h3 className="prod-card-title">{pkg.name}</h3>

                    {/* Badges */}
                    <div className="prod-card-badges-row">
                      <span className="prod-badge vip-badge">VIP {pkg.vipLevel || 0}</span>
                    </div>

                    {/* Info Grid (2 Columns, 2 Rows) */}
                    <div className="prod-info-grid">
                      <div className="info-grid-cell">
                        <span className="info-cell-label">Each Price</span>
                        <strong className="info-cell-value accent-orange">
                          {currency === 'INR' ? '₹' : '$'}{displayPrice.toFixed(2)}
                        </strong>
                      </div>
                      <div className="info-grid-cell">
                        <span className="info-cell-label">Daily Earnings</span>
                        <strong className="info-cell-value accent-orange">
                          {currency === 'INR' ? '₹' : '$'}{displayIncome.toFixed(2)}
                        </strong>
                      </div>
                      <div className="info-grid-cell">
                        <span className="info-cell-label">Maximum</span>
                        <strong className="info-cell-value accent-orange-dark">
                          {pkg.maxCopies || 10} Copies
                        </strong>
                      </div>
                      <div className="info-grid-cell">
                        <span className="info-cell-label">Total revenue</span>
                        <strong className="info-cell-value accent-orange">
                          {currency === 'INR' ? '₹' : '$'}{displayQuota.toFixed(2)}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action: Invest Now Button */}
                <button
                  onClick={() => handleInvestClick(pkg)}
                  className="btn-primary prod-invest-now-btn"
                  disabled={purchaseLoading === pkg._id}
                >
                  {purchaseLoading === pkg._id ? 'Processing...' : 'Invest Now'}
                </button>
              </GlassCard>
            );
          })
        )}
      </div>

      {/* Active Packages Portfolio */}
      <div id="active-investments-section" className="active-packages-section">
        <h2>Your Active Investments ({activeInvestments.length})</h2>
        {activeInvestments.length === 0 ? (
          <GlassCard className="no-investments">
            <FaCoins className="no-inv-icon" />
            <p>You do not have any active packages running. Purchase a plan above to start earning hourly!</p>
          </GlassCard>
        ) : (
          <div className="investments-list">
            {activeInvestments.map((inv) => {
              const daysLeft = Math.ceil((new Date(inv.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
              const progressWidth = Math.max(0, Math.min(100, ((inv.validityDays - daysLeft) / inv.validityDays) * 100));

              return (
                <GlassCard key={inv._id} className="investment-item">
                  <div className="inv-left">
                    <img
                      src={inv.packageId?.image ? inv.packageId.image : '/images/solar_farm.png'}
                      alt={inv.name}
                      className="inv-pkg-image"
                    />
                    <div className="inv-info">
                      <h4>{inv.name}</h4>
                      <p className="inv-meta">
                        Cost: <strong>{formatCurrency(inv.price)}</strong> | Daily: <strong>{formatCurrency(inv.dailyEarnings)}</strong>
                      </p>
                    </div>
                  </div>
                  <div className="inv-right">
                    <div className="inv-timeline">
                      <div className="timeline-labels">
                        <span>Active Progress</span>
                        <span>{daysLeft > 0 ? `${daysLeft} days remaining` : 'Expired'}</span>
                      </div>
                      <div className="timeline-bar">
                        <div className="timeline-bar-fill" style={{ width: `${progressWidth}%` }}></div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span className="inv-date-span">
                        <FaCalendarAlt /> Purchased: {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                      <span className="inv-date-span">
                        <FaCalendarAlt /> Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        message={modalMsg}
      />

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="buy-modal-overlay">
          <GlassCard className="buy-deposit-modal animate-fade-in">
            <div className="buy-modal-header">
              <h3>Deposit & Invest</h3>
              <button type="button" className="close-modal-btn" onClick={() => setShowDepositModal(false)}>&times;</button>
            </div>
            
            <div className="buy-modal-body">
              <p className="buy-modal-subtext">You need to add funds to purchase <strong>{selectedPkg?.name}</strong>.</p>
              
              <div className="deposit-amount-row">
                <span>Amount to Pay:</span>
                <strong>₹{selectedPkg?.price}</strong>
              </div>

              <div className="merchant-info-box">
                <span className="merchant-lbl">Merchant Name: <strong style={{ color: '#ffffff' }}>Akula kesava</strong></span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: '6px' }}>
                  <span className="merchant-lbl">Merchant UPI: <strong>kesavaroyal117-1@okicici</strong></span>
                  <button type="button" onClick={copyUpiAddress} className="copy-btn-mini">
                    <FaCopy /> {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="direct-pay-apps">
                <button type="button" onClick={(e) => handleUpiPayment(e, 'phonepe')} className="phonepe-pay-btn">
                  <FaMobileAlt /> Pay via PhonePe
                </button>
                <button type="button" onClick={(e) => handleUpiPayment(e, 'generic')} className="generic-upi-pay-btn">
                  <FaMobileAlt /> Pay via Other UPI Apps
                </button>
              </div>

              {formError && <div className="upi-form-error animate-fade-in" style={{ marginTop: '10px' }}>{formError}</div>}

              <form onSubmit={handleDepositSubmit} className="modal-deposit-form">
                <div className="upi-input-group">
                  <label>12-Digit UTR / Transaction ID</label>
                  <input
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
                      id="modal-screenshot-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                      required
                    />
                    <label htmlFor="modal-screenshot-input" className="upload-label">
                      <FaUpload className="upload-icon" />
                      <span>{screenshot ? 'Change Screenshot' : 'Upload Screenshot'}</span>
                    </label>
                  </div>
                  {screenshotPreview && (
                    <div className="screenshot-preview-container animate-fade-in" style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                      <img src={screenshotPreview} alt="Screenshot Preview" className="screenshot-preview" style={{ maxWidth: '120px', borderRadius: '8px', border: '1px solid var(--border-glass-bright)' }} />
                    </div>
                  )}
                </div>

                <div className="submit-action-container" style={{ marginTop: '15px' }}>
                  <button type="submit" className="btn-primary upi-submit-btn" disabled={txLoading} style={{ width: '100%' }}>
                    {txLoading ? <FaSpinner className="spin" /> : 'Submit Deposit'}
                  </button>
                </div>
              </form>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default Buy;
