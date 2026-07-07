import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaQuestionCircle } from 'react-icons/fa';
import SuccessModal from '../../components/SuccessModal';
import authService from '../../services/authService';
import styles from './Login.module.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '', // This will hold either username or mobile
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Forgot Password state
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [resetData, setResetData] = useState({
    username: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [resetSuccess, setResetSuccess] = useState('');

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleResetChange = (e) => {
    setResetData({ ...resetData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData);
      setShowSuccessModal(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResetSuccess('');

    if (resetData.newPassword !== resetData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.resetPassword({
        username: resetData.username,
        newPassword: resetData.newPassword
      });
      if (res.success) {
        setResetSuccess('Password reset successfully! Please login with your new password.');
        setIsForgotMode(false);
        setResetData({ username: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.particles}></div>
      <div className={styles.card}>
        <div className={styles.logoContainer}>
          <div className={styles.logoHalo}></div>
          <div className={styles.logoGlass}>
            <img src="/logo.jpg" alt="Reward Pay Logo" className={styles.logo} />
          </div>
          <h1 className={styles.title}>Reward Pay</h1>
          <p className={styles.subtitle}>{isForgotMode ? 'Create a New Password' : 'Welcome Back'}</p>
        </div>

        {error && <div className={styles.errorText} style={{ marginBottom: 15, textAlign: 'center' }}>{error}</div>}
        {resetSuccess && <div style={{ color: '#10b981', fontSize: 14, marginBottom: 15, fontWeight: 500, textAlign: 'center' }}>{resetSuccess}</div>}

        {isForgotMode ? (
          <form onSubmit={handleResetSubmit}>
            {/* Username or Mobile */}
            <div className={styles.formGroup}>
              <div className={styles.inputWrapper}>
                <FaUser className={styles.inputIcon} />
                <input
                  type="text"
                  name="username"
                  className={styles.input}
                  placeholder="Enter Username or Mobile Number"
                  value={resetData.username}
                  onChange={handleResetChange}
                  required
                />
              </div>
            </div>

            {/* New Password */}
            <div className={styles.formGroup}>
              <div className={styles.inputWrapper}>
                <FaLock className={styles.inputIcon} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="newPassword"
                  className={styles.input}
                  placeholder="Enter New Password"
                  value={resetData.newPassword}
                  onChange={handleResetChange}
                  required
                />
                <div
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className={styles.formGroup}>
              <div className={styles.inputWrapper}>
                <FaLock className={styles.inputIcon} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  className={styles.input}
                  placeholder="Confirm New Password"
                  value={resetData.confirmPassword}
                  onChange={handleResetChange}
                  required
                />
              </div>
            </div>

            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? <div className={styles.spinner} /> : 'Create New Password'}
            </button>

            <div style={{ marginTop: 18, textAlign: 'center' }}>
              <a
                href="#"
                className={styles.link}
                onClick={(e) => {
                  e.preventDefault();
                  setIsForgotMode(false);
                  setError('');
                }}
              >
                Back to Login
              </a>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Username or Mobile */}
            <div className={styles.formGroup}>
              <div className={styles.inputWrapper}>
                <FaUser className={styles.inputIcon} />
                <input
                  type="text"
                  name="username"
                  className={styles.input}
                  placeholder="Enter Username or Mobile Number"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className={styles.formGroup}>
              <div className={styles.inputWrapper}>
                <FaLock className={styles.inputIcon} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className={styles.input}
                  placeholder="Enter Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <div
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div style={{ textAlign: 'right', marginTop: -10, marginBottom: 18 }}>
              <a
                href="#"
                className={styles.link}
                style={{ fontSize: 13 }}
                onClick={(e) => {
                  e.preventDefault();
                  setIsForgotMode(true);
                  setError('');
                  setResetSuccess('');
                }}
              >
                Forgot Password?
              </a>
            </div>

            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? <div className={styles.spinner} /> : 'Login'}
            </button>
          </form>
        )}

        <div className={styles.footer} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            Don't have an account?
            <Link to="/register" className={styles.link}>Register</Link>
          </div>
          <div style={{ marginTop: 4 }}>
            Need help?
            <a
              href="https://t.me/Rewardpayindia"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
              style={{ color: '#38bdf8' }}
            >
              Contact Help
            </a>
          </div>
        </div>
      </div>
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          sessionStorage.removeItem('hasSeenWelcomeModal');
          navigate('/');
        }}
        title="Login Successful"
        message="Login complete! Click below to go to home page."
        buttonText="Go to Home Page"
      />
    </div>
  );
};

export default Login;
