import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import authService from '../../services/authService';
import { FaUser, FaMobileAlt, FaLock, FaEye, FaEyeSlash, FaCheckCircle, FaGift, FaEnvelope } from 'react-icons/fa';
import styles from './Register.module.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    mobile: '',
    email: '',
    password: '',
    referralCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { register, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setFormData(prev => ({ ...prev, referralCode: ref }));
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculateStrength = (pass) => {
    let score = 0;
    if (pass.length > 7) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const passStrength = calculateStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passStrength < 5) {
      setError('Please enter a strong password.');
      return;
    }
    
    setError('');
    setLoading(true);
    try {
      // If user is logged in (came from referral link), log them out first
      if (localStorage.getItem('user')) {
        localStorage.removeItem('user');
      }
      await authService.register(formData);
      localStorage.removeItem('user');
      setSuccess('Registration successful! Please login to your account.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (index) => {
    if (passStrength <= index) return 'rgba(255,255,255,0.1)';
    if (passStrength < 3) return '#ef4444'; // red
    if (passStrength < 5) return '#f59e0b'; // yellow
    return '#10b981'; // green
  };

  return (
    <div className={styles.container}>
      <div className={styles.particles}></div>
      <div className={styles.card}>
        <img src="/logo.jpg" alt="Reward Pay Logo" className={styles.logo} />
        <h1 className={styles.title}>Reward Pay</h1>
        <p className={styles.subtitle}>Create Your Account</p>

        {error && <div className={styles.errorText} style={{marginBottom: 15, textAlign: 'center'}}>{error}</div>}
        {success && <div style={{marginBottom: 15, textAlign: 'center', color: '#10b981', fontWeight: 600}}>✅ {success}</div>}

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div className={styles.formGroup}>
            <div className={styles.inputWrapper}>
              <FaUser className={styles.inputIcon} />
              <input 
                type="text" 
                name="username"
                className={styles.input} 
                placeholder="Enter Username"
                value={formData.username}
                onChange={handleChange}
                required
                minLength={4}
                maxLength={20}
                pattern="[a-zA-Z0-9]+"
                title="Only letters and numbers allowed"
              />
            </div>
          </div>

          {/* Mobile */}
          <div className={styles.formGroup}>
            <div className={styles.mobileInputRow}>
              <div className={styles.countryCode}>+91</div>
              <div className={styles.inputWrapper} style={{flex: 1}}>
                <FaMobileAlt className={styles.inputIcon} />
                <input 
                  type="tel" 
                  name="mobile"
                  className={styles.input} 
                  placeholder="Enter Mobile Number"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{10}"
                  maxLength={10}
                />
              </div>
            </div>
          </div>

          {/* Email / Gmail */}
          <div className={styles.formGroup}>
            <div className={styles.inputWrapper}>
              <FaEnvelope className={styles.inputIcon} />
              <input 
                type="email" 
                name="email"
                className={styles.input} 
                placeholder="Enter Email (Gmail) Address"
                value={formData.email}
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
            
            {formData.password && (
              <>
                <div className={styles.strengthMeter}>
                  {[0, 1, 2, 3, 4].map(i => (
                    <div key={i} className={styles.strengthBar} style={{ background: getStrengthColor(i) }} />
                  ))}
                </div>
                <div className={styles.strengthText}>
                  {passStrength < 5 ? 'Needs uppercase, lowercase, number & symbol' : 'Strong password'}
                </div>
              </>
            )}
          </div>

          {/* Referral Code */}
          <div className={styles.formGroup}>
            <div className={styles.inputWrapper}>
              <FaGift className={styles.inputIcon} />
              <input 
                type="text" 
                name="referralCode"
                className={styles.input} 
                placeholder="Enter Referral Code (Optional)"
                value={formData.referralCode}
                onChange={handleChange}
              />
            </div>
          </div>

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? <div className={styles.spinner}/> : 'Create Account'}
          </button>

        </form>

        <div className={styles.footer}>
          Already have an account? 
          <Link to="/login" className={styles.link}>Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
