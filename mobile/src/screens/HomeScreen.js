import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  RefreshControl,
  Modal,
  Linking,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import GlassCard from '../components/GlassCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import DashboardHeader from '../components/DashboardHeader';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen({ navigation }) {
  const { user, refreshUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [copied, setCopied] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);

  const fetchData = async () => {
    try {
      await refreshUser();
      const txRes = await API.get('/wallet/transactions');
      if (txRes.data.success) {
        setTransactions(txRes.data.data.slice(0, 5)); // show latest 5
      }
    } catch (err) {
      console.warn('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleClosePromoModal = () => {
    setShowPromoModal(false);
  };

  // Show modal EVERY time the home screen is focused/opened
  useFocusEffect(
    useCallback(() => {
      setShowPromoModal(true);
      fetchData();

      // Poll server to sync user wallet balance/VIP state every 12 seconds
      const interval = setInterval(async () => {
        await refreshUser();
      }, 12000);

      return () => clearInterval(interval);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const copyReferralCode = async () => {
    if (!user) return;
    await Clipboard.setStringAsync(user.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = async () => {
    if (!user) return;
    try {
      await Share.share({
        message: `Earn passive income on RewardPay! Register using my referral code: ${user.referralCode}`,
      });
    } catch (error) {
      console.warn('Sharing failed:', error);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit':
        return { name: 'plus-circle', color: '#10b981' };
      case 'withdraw':
        return { name: 'arrow-circle-down', color: '#f43f5e' };
      case 'purchase':
        return { name: 'shopping-cart', color: '#6366f1' };
      case 'reward':
        return { name: 'coins', color: '#eab308' };
      case 'referral':
        return { name: 'share-alt', color: '#0ea5e9' };
      default:
        return { name: 'file-invoice-dollar', color: '#94a3b8' };
    }
  };

  const getTransactionStatusColor = (status) => {
    if (status === 'completed') return '#10b981';
    if (status === 'pending') return '#f59e0b';
    return '#f43f5e';
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
      <View style={styles.loadingContainer}>
        <DashboardHeader navigation={navigation} />
        <View style={{ padding: 20 }}>
          <LoadingSkeleton type="line" count={1} />
          <LoadingSkeleton type="card" count={2} />
          <LoadingSkeleton type="list" count={3} />
        </View>
      </View>
    );
  }

  if (showPromoModal) {
    return (
      <View style={[styles.mainContainer, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={handleClosePromoModal}
              style={styles.modalCloseBtn}
            >
              <FontAwesome5 name="times" size={16} color="#94a3b8" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Welcome to Reward Pay</Text>
            <Text style={styles.modalSubtitle}>New best app launched 🚀</Text>
          </View>

          {/* Body */}
          <View style={styles.modalBody}>
            <View style={styles.modalRow}>
              <View style={styles.modalRowLeft}>
                <View style={[styles.modalIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                  <FontAwesome5 name="gift" size={12} color="#6366f1" />
                </View>
                <Text style={styles.modalRowText}>SignUp Reward</Text>
              </View>
              <Text style={styles.modalBadge}>₹50</Text>
            </View>

            <View style={styles.modalRow}>
              <View style={styles.modalRowLeft}>
                <View style={[styles.modalIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <FontAwesome5 name="users" size={12} color="#10b981" />
                </View>
                <Text style={styles.modalRowText}>Team work</Text>
              </View>
              <Text style={styles.modalBadge}>10% / 5% / 3% / 2%</Text>
            </View>

            <View style={styles.modalRow}>
              <View style={styles.modalRowLeft}>
                <View style={[styles.modalIconBox, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
                  <FontAwesome5 name="credit-card" size={12} color="#f43f5e" />
                </View>
                <Text style={styles.modalRowText}>Min withdrawal</Text>
              </View>
              <Text style={styles.modalBadge}>₹300</Text>
            </View>

            <View style={styles.modalRow}>
              <View style={styles.modalRowLeft}>
                <View style={[styles.modalIconBox, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
                  <FontAwesome5 name="coins" size={12} color="#eab308" />
                </View>
                <Text style={styles.modalRowText}>Min Recharge</Text>
              </View>
              <Text style={styles.modalBadge}>₹510</Text>
            </View>

            <View style={styles.modalRow}>
              <View style={styles.modalRowLeft}>
                <View style={[styles.modalIconBox, { backgroundColor: 'rgba(14, 165, 233, 0.15)' }]}>
                  <FontAwesome5 name="clock" size={12} color="#0ea5e9" />
                </View>
                <Text style={styles.modalRowText}>Withdrawal time</Text>
              </View>
              <Text style={styles.modalBadge}>24/7</Text>
            </View>
          </View>

          {/* Footer */}
          <TouchableOpacity
            onPress={() => {
              handleClosePromoModal();
              Linking.openURL('https://t.me/rewardspayofficial');
            }}
            style={styles.modalTelegramBtn}
          >
            <FontAwesome5 name="telegram-plane" size={16} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.modalTelegramBtnText}>Join Telegram</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <DashboardHeader navigation={navigation} />
      
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
      >
        {/* Welcome Promo Banner */}
        <LinearGradient colors={['#6366f1', '#3b82f6']} style={styles.promoBanner}>
          <View style={styles.promoContent}>
            <View style={styles.bannerTag}>
              <Text style={styles.bannerTagText}>{getVipLevel(user?.totalEarnings)}</Text>
            </View>
            <Text style={styles.bannerTitle}>Welcome, {user?.name || user?.username}!</Text>
            <Text style={styles.bannerSubtitle}>Grow your wallet earnings by investing in packages and inviting active team members.</Text>
            
            <View style={styles.referralBox}>
              <Text style={styles.refLabel}>Referral Code: </Text>
              <Text style={styles.refVal}>{user?.referralCode || 'N/A'}</Text>
              <TouchableOpacity onPress={copyReferralCode} style={styles.refActionBtn}>
                <FontAwesome5 name={copied ? 'check' : 'copy'} size={14} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={shareReferral} style={styles.refActionBtn}>
                <FontAwesome5 name="share-alt" size={14} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Dashboard Stats Cards */}
        <View style={styles.statsGrid}>
          <GlassCard style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
              <FontAwesome5 name="wallet" size={18} color="#6366f1" />
            </View>
            <Text style={styles.statLabel}>Wallet Balance</Text>
            <Text style={styles.statValue}>₹{user?.walletBalance?.toFixed(2) || '0.00'}</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <FontAwesome5 name="coins" size={18} color="#10b981" />
            </View>
            <Text style={styles.statLabel}>Today's Earnings</Text>
            <Text style={styles.statValue}>₹{user?.todayEarnings?.toFixed(2) || '0.00'}</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
              <FontAwesome5 name="money-check-alt" size={18} color="#eab308" />
            </View>
            <Text style={styles.statLabel}>Total Earnings</Text>
            <Text style={styles.statValue}>₹{user?.totalEarnings?.toFixed(2) || '0.00'}</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(14, 165, 233, 0.15)' }]}>
              <FontAwesome5 name="shopping-cart" size={18} color="#0ea5e9" />
            </View>
            <Text style={styles.statLabel}>Active Investments</Text>
            <Text style={styles.statValue}>{user?.activeInvestmentsCount || 0}</Text>
          </GlassCard>
        </View>

        {/* VIP Level Progress */}
        <GlassCard style={styles.vipContainer}>
          <View style={styles.vipHeader}>
            <Text style={styles.sectionTitle}>VIP Milestone Progress</Text>
            <Text style={styles.vipSubText}>₹{totalEarned.toFixed(2)} / ₹{nextVipMilestone}</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.vipProgressDesc}>
            Earn ₹{(nextVipMilestone - totalEarned).toFixed(2)} more to reach next VIP level.
          </Text>
        </GlassCard>

        {/* Quick Menu Shortcuts */}
        <View style={styles.menuRow}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Buy')}>
            <LinearGradient colors={['rgba(99, 102, 241, 0.25)', 'rgba(99, 102, 241, 0.15)']} style={styles.menuItemGradient}>
              <FontAwesome5 name="shopping-cart" size={20} color="#818cf8" />
              <Text style={styles.menuItemText}>Invest</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('UPI')}>
            <LinearGradient colors={['rgba(16, 185, 129, 0.25)', 'rgba(16, 185, 129, 0.15)']} style={styles.menuItemGradient}>
              <FontAwesome5 name="qrcode" size={20} color="#34d399" />
              <Text style={styles.menuItemText}>UPI Pay</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Team')}>
            <LinearGradient colors={['rgba(14, 165, 233, 0.25)', 'rgba(14, 165, 233, 0.15)']} style={styles.menuItemGradient}>
              <FontAwesome5 name="users" size={20} color="#38bdf8" />
              <Text style={styles.menuItemText}>My Team</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <GlassCard>
          <View style={styles.transactionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('UPI')}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <Text style={styles.noTxText}>No transactions recorded yet.</Text>
          ) : (
            transactions.map((tx) => {
              const iconInfo = getTransactionIcon(tx.type);
              return (
                <View key={tx._id} style={styles.txRow}>
                  <View style={[styles.txIconBox, { backgroundColor: 'rgba(255,255,255,0.03)' }]}>
                    <FontAwesome5 name={iconInfo.name} size={16} color={iconInfo.color} />
                  </View>
                  <View style={styles.txMeta}>
                    <Text style={styles.txTitle}>{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</Text>
                    <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.txValueCol}>
                    <Text style={[styles.txAmount, { color: tx.flow === 'in' ? '#10b981' : '#f43f5e' }]}>
                      {tx.flow === 'in' ? '+' : '-'}₹{tx.amount}
                    </Text>
                    <Text style={[styles.txStatus, { color: getTransactionStatusColor(tx.status) }]}>
                      {tx.status}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </GlassCard>

        {/* Action Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <FontAwesome5 name="sign-out-alt" size={16} color="#f43f5e" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Logout Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0b10',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#0a0b10',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 90,
  },
  promoBanner: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  promoContent: {
    zIndex: 2,
  },
  bannerTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 8,
  },
  bannerTagText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  referralBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  refLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  refVal: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
    marginRight: 10,
  },
  refActionBtn: {
    padding: 6,
    marginLeft: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statCard: {
    width: '48%',
    padding: 16,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  vipContainer: {
    padding: 16,
    marginBottom: 20,
  },
  vipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  vipSubText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  vipProgressDesc: {
    color: '#64748b',
    fontSize: 12,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  menuItem: {
    width: '31%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItemGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    color: '#818cf8',
    fontSize: 13,
    fontWeight: '600',
  },
  noTxText: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  txIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txMeta: {
    flex: 1,
  },
  txTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  txDate: {
    color: '#64748b',
    fontSize: 11,
  },
  txValueCol: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  txStatus: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.2)',
    backgroundColor: 'rgba(244, 63, 94, 0.04)',
    marginTop: 10,
  },
  logoutBtnText: {
    color: '#f43f5e',
    fontSize: 14,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#11131e',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  modalCloseBtn: {
    position: 'absolute',
    right: 0,
    top: -5,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 15,
  },
  modalSubtitle: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  modalBody: {
    marginBottom: 24,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  modalRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  modalRowText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
  modalBadge: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalTelegramBtn: {
    backgroundColor: '#0ea5e9',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  modalTelegramBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
