import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import GlassCard from '../components/GlassCard';
import SuccessModal from '../components/SuccessModal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import DashboardHeader from '../components/DashboardHeader';
import { LinearGradient } from 'expo-linear-gradient';

export default function UpiScreen({ navigation, route }) {
  const { user, refreshUser } = useAuth();
  
  // Tab control: 'deposit' | 'withdraw'
  const [activeTab, setActiveTab] = useState('deposit');
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  
  // Form states
  const [amount, setAmount] = useState('');
  const [utr, setUtr] = useState('');
  const [screenshot, setScreenshot] = useState(''); // base64 placeholder
  const [withdrawUpi, setWithdrawUpi] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('upi'); // 'upi' | 'bank'
  const [bankUserName, setBankUserName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [formError, setFormError] = useState('');
  
  // Help sections toggles
  const [showDepositHelp, setShowDepositHelp] = useState(false);
  const [showWithdrawHelp, setShowWithdrawHelp] = useState(false);

  // Success modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMsg, setModalMsg] = useState('');
  const [copiedId, setCopiedId] = useState('');

  const companyUpi = 'kesavaroyal117-1@okicici';

  const handleUpiPress = async (targetApp = 'generic') => {
    // Proactively copy the UPI ID to clipboard
    await Clipboard.setStringAsync(companyUpi);

    let upiUrl = 'upi://pay';
    if (targetApp === 'phonepe') {
      upiUrl = 'phonepe://';
    } else if (targetApp === 'paytm') {
      upiUrl = 'paytmmp://';
    } else if (targetApp === 'gpay') {
      upiUrl = 'gpay://';
    }

    try {
      const supported = await Linking.canOpenURL(upiUrl);
      if (supported) {
        await Linking.openURL(upiUrl);
      } else {
        Alert.alert('UPI ID Copied', 'UPI ID has been copied to your clipboard! Paste it inside your UPI app to pay.');
      }
    } catch (err) {
      Alert.alert('UPI ID Copied', 'UPI ID has been copied to your clipboard! Paste it inside your UPI app to pay.');
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await API.get('/wallet/transactions');
      if (res.data.success) {
        setTransactions(res.data.data);
      }
    } catch (err) {
      console.warn('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Pre-fill amount if passed from Home or Buy page
  useEffect(() => {
    if (route.params?.amount) {
      setAmount(route.params.amount.toString());
      setActiveTab('deposit');
    }
  }, [route.params]);

  const copyToClipboard = async (text, id) => {
    await Clipboard.setStringAsync(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  // Simulate file selection
  const handlePickScreenshot = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'You need to allow camera roll access to upload screenshots.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setScreenshot(base64Image);
        Alert.alert('Screenshot Attached', 'Your payment proof has been attached successfully.');
      }
    } catch (err) {
      console.warn('Error launching image picker:', err);
      const mockBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      setScreenshot(mockBase64);
      Alert.alert('Image Picker Error', 'Attached default screenshot template instead.');
    }
  };

  const handleDepositSubmit = async () => {
    setFormError('');
    const depositAmt = parseFloat(amount);
    
    if (isNaN(depositAmt) || depositAmt <= 0) {
      setFormError('Please enter a valid deposit amount.');
      return;
    }

    if (depositAmt < 500) {
      setFormError('Minimum deposit amount is ₹500.');
      return;
    }

    if (!utr || utr.length !== 12) {
      setFormError('Please enter a valid 12-digit UTR/Ref number.');
      return;
    }

    if (!screenshot) {
      setFormError('Please attach a proof of payment screenshot.');
      return;
    }

    setTxLoading(true);
    try {
      const res = await API.post('/wallet/deposit', {
        amount: depositAmt,
        utr,
        screenshot
      });

      if (res.data.success) {
        setModalTitle('Deposit Submitted');
        setModalMsg(`Your deposit of ₹${depositAmt} has been submitted. It will be credited within 30 minutes after validation.`);
        setIsModalOpen(true);
        setAmount('');
        setUtr('');
        setScreenshot('');
        fetchTransactions();
        await refreshUser();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to submit deposit.');
    } finally {
      setTxLoading(false);
    }
  };

  const handleWithdrawSubmit = async () => {
    setFormError('');
    const withdrawAmt = parseFloat(amount);

    if (isNaN(withdrawAmt) || withdrawAmt <= 0) {
      setFormError('Please enter a valid withdrawal amount.');
      return;
    }

    if (withdrawAmt < 300) {
      setFormError('Minimum withdrawal amount is ₹300.');
      return;
    }

    if (withdrawAmt > (user?.walletBalance || 0)) {
      setFormError('Insufficient wallet balance.');
      return;
    }

    let payload = { amount: withdrawAmt, paymentMethod: withdrawMethod };
    if (withdrawMethod === 'upi') {
      if (!withdrawUpi || !withdrawUpi.includes('@')) {
        setFormError('Please enter a valid UPI address (e.g., name@upi).');
        return;
      }
      payload.upiId = withdrawUpi;
    } else {
      if (!bankUserName || !accountNumber || !ifscCode) {
        setFormError('Please enter bank account name, number, and IFSC code.');
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
        setModalTitle('Withdrawal Requested');
        const displayTarget = withdrawMethod === 'upi' ? `UPI: ${withdrawUpi}` : `Bank A/C: ${accountNumber}`;
        setModalMsg(`Your withdrawal of ₹${withdrawAmt} to ${displayTarget} has been registered. Processing normally takes 2-4 hours.`);
        setIsModalOpen(true);
        setAmount('');
        setWithdrawUpi('');
        setBankUserName('');
        setAccountNumber('');
        setIfscCode('');
        fetchTransactions();
        await refreshUser();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to submit withdrawal request.');
    } finally {
      setTxLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'completed') return '#10b981';
    if (status === 'pending') return '#f59e0b';
    return '#f43f5e';
  };

  return (
    <View style={styles.mainContainer}>
      <DashboardHeader title="UPI Payment Center" navigation={navigation} />

      {/* Segmented Controller */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => {
            setActiveTab('deposit');
            setFormError('');
          }}
          style={[styles.tabBtn, activeTab === 'deposit' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'deposit' && styles.tabTextActive]}>
            Add Fund (Deposit)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setActiveTab('withdraw');
            setFormError('');
          }}
          style={[styles.tabBtn, activeTab === 'withdraw' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'withdraw' && styles.tabTextActive]}>
            Withdraw (Redeem)
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

        {activeTab === 'deposit' ? (
          // DEPOSIT COMPONENT
          <View>
            <GlassCard>
              <Text style={styles.cardTitle}>Step 1: Pay to Company UPI</Text>
              
              <View style={{ marginBottom: 12, backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                <Text style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>Merchant Name</Text>
                <Text style={{ color: '#f8fafc', fontSize: 15, fontWeight: '700' }}>Akula kesava</Text>
              </View>

              <TouchableOpacity onPress={handleUpiPress} style={styles.upiCopyRow}>
                <View style={styles.upiLabelCol}>
                  <Text style={styles.upiLabel}>Official UPI ID (Tap to Pay)</Text>
                  <Text style={styles.upiValue}>{companyUpi}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => copyToClipboard(companyUpi, 'upi_id')}
                  style={styles.copyBtn}
                >
                  <FontAwesome5 name={copiedId === 'upi_id' ? 'check' : 'copy'} size={14} color="#818cf8" />
                  <Text style={styles.copyBtnText}>{copiedId === 'upi_id' ? 'Copied' : 'Copy ID'}</Text>
                </TouchableOpacity>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleUpiPress('paytm')}
                style={styles.paytmBtn}
              >
                <FontAwesome5 name="mobile-alt" size={14} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.paytmBtnText}>Pay via Paytm</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleUpiPress('phonepe')}
                style={styles.phonepeBtn}
              >
                <FontAwesome5 name="wallet" size={14} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.phonepeBtnText}>Pay via PhonePe</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowDepositHelp(!showDepositHelp)}
                style={styles.helpToggle}
              >
                <Text style={styles.helpToggleText}>How to complete deposit?</Text>
                <FontAwesome5 name={showDepositHelp ? 'chevron-up' : 'chevron-down'} size={12} color="#818cf8" />
              </TouchableOpacity>

              {showDepositHelp && (
                <View style={styles.helpBox}>
                  <Text style={styles.helpStep}>1. Copy company UPI ID or tap the button to pay.</Text>
                  <Text style={styles.helpStep}>2. Transfer amount (Min: ₹500) using your payment app.</Text>
                  <Text style={styles.helpStep}>3. Copy the 12-digit UTR/UPI Ref No. from the receipt.</Text>
                  <Text style={styles.helpStep}>4. Take a screenshot of the payment success screen.</Text>
                  <Text style={styles.helpStep}>5. Submit amount, UTR and screenshot proof below.</Text>
                </View>
              )}
            </GlassCard>

            <GlassCard>
              <Text style={styles.cardTitle}>Step 2: Submit Payment Details</Text>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Deposit Amount (INR)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Minimum ₹500"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>12-Digit UTR / Transaction ID</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter 12-digit numeric code"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  maxLength={12}
                  value={utr}
                  onChangeText={(text) => setUtr(text.replace(/[^0-9]/g, ''))}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Attach Payment Screenshot</Text>
                <TouchableOpacity onPress={handlePickScreenshot} style={styles.uploadBtn}>
                  <FontAwesome5 name={screenshot ? 'check-circle' : 'upload'} size={16} color={screenshot ? '#10b981' : '#818cf8'} />
                  <Text style={[styles.uploadBtnText, screenshot && { color: '#10b981' }]}>
                    {screenshot ? 'Screenshot Attached' : 'Select Screenshot Image'}
                  </Text>
                </TouchableOpacity>

                {screenshot ? (
                  <View style={styles.screenshotPreviewContainer}>
                    <Image
                      source={{ uri: screenshot }}
                      style={styles.screenshotPreview}
                      resizeMode="cover"
                    />
                    <TouchableOpacity onPress={() => setScreenshot('')} style={styles.removeScreenshotBtn}>
                      <FontAwesome5 name="times-circle" size={14} color="#f43f5e" />
                      <Text style={styles.removeScreenshotText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  onPress={handleDepositSubmit}
                  style={[styles.submitBtn, { flex: 2 }]}
                  disabled={txLoading}
                >
                  {txLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.submitBtnText}>Submit Request</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => Linking.openURL('https://t.me/Rewardpayindia')}
                  style={styles.helpBtnSecondary}
                >
                  <FontAwesome5 name="telegram" size={16} color="#38bdf8" />
                  <Text style={styles.helpBtnSecondaryText}>Get Help</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>
        ) : (
          // WITHDRAW COMPONENT
          <View>
            <GlassCard>
              <View style={styles.balanceInfo}>
                <Text style={styles.balanceLabel}>Available Balance</Text>
                <Text style={styles.balanceVal}>₹{user?.walletBalance?.toFixed(2) || '0.00'}</Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowWithdrawHelp(!showWithdrawHelp)}
                style={styles.helpToggle}
              >
                <Text style={styles.helpToggleText}>Withdrawal Rules & Limits</Text>
                <FontAwesome5 name={showWithdrawHelp ? 'chevron-up' : 'chevron-down'} size={12} color="#818cf8" />
              </TouchableOpacity>

              {showWithdrawHelp && (
                <View style={styles.helpBox}>
                  <Text style={styles.helpStep}>• Minimum withdrawal threshold: ₹300.</Text>
                  <Text style={styles.helpStep}>• Withdrawals processed daily between 10:00 AM - 6:00 PM.</Text>
                  <Text style={styles.helpStep}>• Usually takes 2-4 hours to reflect in accounts.</Text>
                  <Text style={styles.helpStep}>• Ensure your UPI Address or Bank details are typed correctly.</Text>
                </View>
              )}
            </GlassCard>

            <GlassCard>
              <Text style={styles.cardTitle}>Request Cashout</Text>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Select Withdrawal Mode</Text>
                <View style={[styles.tabContainer, { marginHorizontal: 0, marginTop: 4, marginBottom: 0 }]}>
                  <TouchableOpacity
                    onPress={() => {
                      setWithdrawMethod('upi');
                      setFormError('');
                    }}
                    style={[styles.tabBtn, withdrawMethod === 'upi' && styles.tabActive]}
                  >
                    <Text style={[styles.tabText, withdrawMethod === 'upi' && styles.tabTextActive]}>
                      UPI ID
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setWithdrawMethod('bank');
                      setFormError('');
                    }}
                    style={[styles.tabBtn, withdrawMethod === 'bank' && styles.tabActive]}
                  >
                    <Text style={[styles.tabText, withdrawMethod === 'bank' && styles.tabTextActive]}>
                      Bank Account
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Withdrawal Amount (INR)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Minimum ₹300"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>

              {withdrawMethod === 'upi' ? (
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>UPI Address (VPA)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. user@okaxis, mobile@paytm"
                    placeholderTextColor="#64748b"
                    autoCapitalize="none"
                    value={withdrawUpi}
                    onChangeText={setWithdrawUpi}
                  />
                </View>
              ) : (
                <View>
                  <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>Bank Account Holder Name</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter account holder name"
                      placeholderTextColor="#64748b"
                      value={bankUserName}
                      onChangeText={setBankUserName}
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>Bank Account Number</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter bank account number"
                      placeholderTextColor="#64748b"
                      keyboardType="numeric"
                      value={accountNumber}
                      onChangeText={setAccountNumber}
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>Bank IFSC Code</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. SBIN0001234"
                      placeholderTextColor="#64748b"
                      autoCapitalize="characters"
                      value={ifscCode}
                      onChangeText={setIfscCode}
                    />
                  </View>
                </View>
              )}

              <View style={styles.actionRow}>
                <TouchableOpacity
                  onPress={handleWithdrawSubmit}
                  style={[styles.submitBtn, { backgroundColor: '#f43f5e', flex: 2 }]}
                  disabled={txLoading}
                >
                  {txLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.submitBtnText}>Request Cashout</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => Linking.openURL('https://t.me/Rewardpayindia')}
                  style={styles.helpBtnSecondary}
                >
                  <FontAwesome5 name="telegram" size={16} color="#38bdf8" />
                  <Text style={styles.helpBtnSecondaryText}>Get Help</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>
        )}

        {/* Transaction History Log */}
        <GlassCard>
          <Text style={styles.historyTitle}>Payment logs</Text>
          
          {loading ? (
            <ActivityIndicator size="small" color="#6366f1" />
          ) : transactions.length === 0 ? (
            <Text style={styles.noHistory}>No transaction history found.</Text>
          ) : (
            transactions.map((tx) => (
              <View key={tx._id} style={styles.historyItem}>
                <View style={styles.histLeft}>
                  <Text style={styles.histType}>
                    {tx.type.toUpperCase()} ({tx.flow === 'in' ? 'DEPOSIT' : 'WITHDRAWAL'})
                  </Text>
                  {tx.utr ? <Text style={styles.histDetails}>UTR: {tx.utr}</Text> : null}
                  {tx.upi ? <Text style={styles.histDetails}>UPI: {tx.upi}</Text> : null}
                  <Text style={styles.histDate}>{new Date(tx.createdAt).toLocaleString()}</Text>
                </View>
                <View style={styles.histRight}>
                  <Text style={[styles.histAmount, { color: tx.flow === 'in' ? '#10b981' : '#f43f5e' }]}>
                    {tx.flow === 'in' ? '+' : '-'}₹{tx.amount}
                  </Text>
                  <Text style={[styles.histStatus, { color: getStatusColor(tx.status) }]}>
                    {tx.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </GlassCard>
      </ScrollView>

      <SuccessModal
        isOpen={isModalOpen}
        title={modalTitle}
        message={modalMsg}
        onClose={() => setIsModalOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#0a0b10',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#11131e',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#6366f1',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 90,
  },
  errorText: {
    color: '#f43f5e',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  upiCopyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0a0b10',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  upiLabelCol: {
    flex: 1,
  },
  upiLabel: {
    color: '#64748b',
    fontSize: 11,
    marginBottom: 4,
  },
  upiValue: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderRadius: 10,
  },
  copyBtnText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrMock: {
    width: '100%',
    height: 140,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrMockText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 10,
    fontWeight: '500',
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tapGlow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  tapGlowText: {
    color: '#a5b4fc',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  helpToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  helpToggleText: {
    color: '#818cf8',
    fontSize: 13,
    fontWeight: '600',
  },
  helpBox: {
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  helpStep: {
    color: '#94a3b8',
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 6,
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#0a0b10',
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    color: '#f8fafc',
    fontSize: 15,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    borderStyle: 'dashed',
  },
  uploadBtnText: {
    color: '#818cf8',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  screenshotPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 8,
  },
  screenshotPreview: {
    width: 60,
    height: 60,
    borderRadius: 6,
  },
  removeScreenshotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
  },
  removeScreenshotText: {
    color: '#f43f5e',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  submitBtn: {
    backgroundColor: '#6366f1',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  paytmBtn: {
    backgroundColor: '#00baf2',
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 4,
    shadowColor: '#00baf2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  paytmBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  phonepeBtn: {
    backgroundColor: '#5f259f',
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 8,
    shadowColor: '#5f259f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  phonepeBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  helpBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    height: 50,
    borderRadius: 14,
  },
  helpBtnSecondaryText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  balanceInfo: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: 12,
  },
  balanceLabel: {
    color: '#64748b',
    fontSize: 13,
    marginBottom: 4,
  },
  balanceVal: {
    color: '#f8fafc',
    fontSize: 26,
    fontWeight: '800',
  },
  historyTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 16,
  },
  noHistory: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 16,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  histLeft: {
    flex: 1,
    marginRight: 10,
  },
  histType: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  histDetails: {
    color: '#94a3b8',
    fontSize: 11,
    marginBottom: 2,
  },
  histDate: {
    color: '#64748b',
    fontSize: 10.5,
  },
  histRight: {
    alignItems: 'flex-end',
  },
  histAmount: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  histStatus: {
    fontSize: 10,
    fontWeight: '800',
  },
});
