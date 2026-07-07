import React, { useState } from 'react';
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
  Alert,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import authService from '../services/authService';

export default function RegisterScreen({ navigation }) {
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

  const getStrengthLabel = () => {
    if (formData.password.length === 0) return '';
    if (passStrength < 3) return 'Weak';
    if (passStrength < 5) return 'Medium';
    return 'Strong';
  };

  const getStrengthColor = () => {
    if (passStrength < 3) return '#ef4444'; // red
    if (passStrength < 5) return '#f59e0b'; // yellow
    return '#10b981'; // green
  };

  const handleSubmit = async () => {
    // Validations
    if (!formData.username || !formData.mobile || !formData.email || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (formData.username.length < 4) {
      setError('Username must be at least 4 characters long.');
      return;
    }

    if (formData.mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (passStrength < 5) {
      setError('Please enter a strong password containing uppercase, lowercase, numbers, and symbols.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await authService.register(formData);
      Alert.alert('Success', 'Registration successful! Please login to your account.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
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
              <Text style={styles.subtitle}>Create Your Account</Text>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.formGroup}>
              <View style={styles.inputWrapper}>
                <FontAwesome5 name="user" size={16} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="#64748b"
                  value={formData.username}
                  onChangeText={(text) => setFormData({ ...formData, username: text.replace(/[^a-zA-Z0-9]/g, '') })}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.mobileRow}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <View style={[styles.inputWrapper, { flex: 1 }]}>
                  <FontAwesome5 name="mobile-alt" size={16} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Mobile Number"
                    placeholderTextColor="#64748b"
                    keyboardType="number-pad"
                    maxLength={10}
                    value={formData.mobile}
                    onChangeText={(text) => setFormData({ ...formData, mobile: text.replace(/[^0-9]/g, '') })}
                  />
                </View>
              </View>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.inputWrapper}>
                <FontAwesome5 name="envelope" size={16} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email (Gmail)"
                  placeholderTextColor="#64748b"
                  keyboardType="email-address"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
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

              {/* Password strength visualizer */}
              {formData.password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBarBackground}>
                    <View
                      style={[
                        styles.strengthBarFilled,
                        {
                          width: `${(passStrength / 5) * 100}%`,
                          backgroundColor: getStrengthColor(),
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.strengthText, { color: getStrengthColor() }]}>
                    {getStrengthLabel()}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.formGroup}>
              <View style={styles.inputWrapper}>
                <FontAwesome5 name="gift" size={16} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Referral Code (Optional)"
                  placeholderTextColor="#64748b"
                  value={formData.referralCode}
                  onChangeText={(text) => setFormData({ ...formData, referralCode: text })}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerLink}> Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  card: {
    backgroundColor: 'rgba(22, 25, 41, 0.65)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 24,
  },
  errorText: {
    color: '#f43f5e',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  mobileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCode: {
    width: 56,
    height: 52,
    backgroundColor: '#0a0b10',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  countryCodeText: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
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
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  strengthBarBackground: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginRight: 10,
    overflow: 'hidden',
  },
  strengthBarFilled: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 11,
    fontWeight: '700',
  },
  submitBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
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
