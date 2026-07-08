import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { AuthContext } from '../context/AuthContext';
import authService from '../services/authService';
import SuccessModal from '../components/SuccessModal';

export default function LoginScreen({ navigation }) {
  const [formData, setFormData] = useState({
    username: '',
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

  const handleSubmit = async () => {
    if (!formData.username || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }

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

  const handleResetSubmit = async () => {
    if (!resetData.username || !resetData.newPassword || !resetData.confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (resetData.newPassword !== resetData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setResetSuccess('');
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
    <LinearGradient colors={['#0a0b10', '#11131e']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['rgba(74, 63, 175, 0.5)', 'rgba(46, 42, 111, 0.15)', 'transparent']}
                style={styles.logoHalo}
              />
              <View style={styles.logoGlass}>
                <Image
                  source={require('../../assets/logo.jpg')}
                  style={styles.logo}
                />
              </View>
              <Text style={styles.title}>Reward Pay</Text>
              <Text style={styles.subtitle}>
                {isForgotMode ? 'Create a New Password' : 'Welcome Back'}
              </Text>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {resetSuccess ? <Text style={styles.successText}>{resetSuccess}</Text> : null}

            {!isForgotMode ? (
              // Login Form
              <View>
                <View style={styles.formGroup}>
                  <View style={styles.inputWrapper}>
                    <FontAwesome5 name="user" size={16} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Username or Mobile"
                      placeholderTextColor="#64748b"
                      value={formData.username}
                      onChangeText={(text) => setFormData({ ...formData, username: text })}
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <View style={styles.inputWrapper}>
                    <FontAwesome5 name="lock" size={16} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="#64748b"
                      secureTextEntry={!showPassword}
                      value={formData.password}
                      onChangeText={(text) => setFormData({ ...formData, password: text })}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.passwordToggle}
                    >
                      <FontAwesome5
                        name={showPassword ? 'eye-slash' : 'eye'}
                        size={16}
                        color="#64748b"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => Linking.openURL('https://t.me/rewardpayindia1')}
                  style={styles.forgotBtn}
                >
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.submitBtnText}>Sign In</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              // Forgot Password Form
              <View>
                <View style={styles.formGroup}>
                  <View style={styles.inputWrapper}>
                    <FontAwesome5 name="user" size={16} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Username or Mobile"
                      placeholderTextColor="#64748b"
                      value={resetData.username}
                      onChangeText={(text) => setResetData({ ...resetData, username: text })}
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <View style={styles.inputWrapper}>
                    <FontAwesome5 name="lock" size={16} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="New Password"
                      placeholderTextColor="#64748b"
                      secureTextEntry={!showPassword}
                      value={resetData.newPassword}
                      onChangeText={(text) => setResetData({ ...resetData, newPassword: text })}
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <View style={styles.inputWrapper}>
                    <FontAwesome5 name="lock" size={16} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm New Password"
                      placeholderTextColor="#64748b"
                      secureTextEntry={!showPassword}
                      value={resetData.confirmPassword}
                      onChangeText={(text) => setResetData({ ...resetData, confirmPassword: text })}
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => setIsForgotMode(false)}
                  style={styles.forgotBtn}
                >
                  <Text style={styles.forgotText}>Back to Sign In</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.submitBtn} onPress={handleResetSubmit} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.submitBtnText}>Reset Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {isForgotMode ? 'Remember password?' : "Don't have an account?"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (isForgotMode) {
                    setIsForgotMode(false);
                  } else {
                    navigation.navigate('Register');
                  }
                }}
              >
                <Text style={styles.footerLink}>
                  {isForgotMode ? ' Sign In' : ' Sign Up'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <SuccessModal
        isOpen={showSuccessModal}
        title="Welcome Back!"
        message="Login successful! Redirecting to dashboard..."
        onClose={() => {
          setShowSuccessModal(false);
        }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
    position: 'relative',
  },
  logoHalo: {
    position: 'absolute',
    top: -18,
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.8,
  },
  logoGlass: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: 'rgba(6, 26, 58, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 12,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? undefined : 'sans-serif-condensed',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  card: {
    backgroundColor: 'rgba(22, 25, 41, 0.65)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 20,
    paddingTop: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  errorText: {
    color: '#f43f5e',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  successText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0b10',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 15,
  },
  passwordToggle: {
    padding: 8,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    color: '#818cf8',
    fontSize: 13,
    fontWeight: '500',
  },
  submitBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#64748b',
    fontSize: 14,
  },
  footerLink: {
    color: '#818cf8',
    fontSize: 14,
    fontWeight: '600',
  },
});
