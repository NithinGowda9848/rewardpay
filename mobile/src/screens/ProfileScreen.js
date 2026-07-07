import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import DashboardHeader from '../components/DashboardHeader';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  const getVipLevel = (earnings) => {
    if (earnings >= 1000) return 'VIP 3 Gold';
    if (earnings >= 200) return 'VIP 2 Silver';
    if (earnings >= 50) return 'VIP 1 Bronze';
    return 'VIP 0 Starter';
  };

  const totalEarnings = user?.totalEarnings || 0;
  const joinedDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';

  return (
    <View style={styles.mainContainer}>
      <DashboardHeader title="My Account" navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Avatar Profile Box */}
        <GlassCard style={styles.avatarCard}>
          <LinearGradient colors={['#6366f1', '#3b82f6']} style={styles.avatarGlow} />
          
          <View style={styles.largeAvatar}>
            <Text style={styles.largeAvatarText}>
              {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>

          <Text style={styles.profileName}>{user?.name || user?.username}</Text>
          <Text style={styles.profileEmail}>{user?.email || `UID: ${user?.referralCode}`}</Text>
          
          <View style={styles.vipTag}>
            <Text style={styles.vipTagText}>{getVipLevel(totalEarnings)}</Text>
          </View>

          <View style={styles.joinedDateRow}>
            <FontAwesome5 name="calendar-alt" size={12} color="#64748b" style={{ marginRight: 6 }} />
            <Text style={styles.joinedDateText}>Joined: {joinedDate}</Text>
          </View>
        </GlassCard>

        {/* Wallet summary */}
        <GlassCard>
          <Text style={styles.cardTitle}>Wallet Overview</Text>

          <View style={styles.walletMiniStatRow}>
            <View style={[styles.walletIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
              <FontAwesome5 name="wallet" size={16} color="#6366f1" />
            </View>
            <View style={styles.walletMeta}>
              <Text style={styles.walletLabel}>Available Balance</Text>
              <Text style={[styles.walletVal, { color: '#10b981' }]}>₹{user?.walletBalance?.toFixed(2) || '0.00'}</Text>
            </View>
          </View>

          <View style={styles.walletMiniStatRow}>
            <View style={[styles.walletIconBox, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
              <FontAwesome5 name="coins" size={16} color="#eab308" />
            </View>
            <View style={styles.walletMeta}>
              <Text style={styles.walletLabel}>Total Earnings</Text>
              <Text style={[styles.walletVal, { color: '#eab308' }]}>₹{totalEarnings.toFixed(2)}</Text>
            </View>
          </View>
        </GlassCard>

        {/* Details Information */}
        <GlassCard>
          <Text style={styles.cardTitle}>Profile Information</Text>
          <Text style={styles.cardSubtitle}>Full details of your active account session.</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <FontAwesome5 name="user" size={14} color="#64748b" style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Full Name</Text>
            </View>
            <Text style={styles.detailValText}>{user?.name || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <FontAwesome5 name="at" size={14} color="#64748b" style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Username</Text>
            </View>
            <Text style={styles.detailValText}>@{user?.username}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <FontAwesome5 name="envelope" size={14} color="#64748b" style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Email Address</Text>
            </View>
            <Text style={styles.detailValText} numberOfLines={1}>{user?.email || 'Not Linked'}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <FontAwesome5 name="phone-alt" size={14} color="#64748b" style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Phone Number</Text>
            </View>
            <Text style={styles.detailValText}>
              {user?.mobile ? `+91 ${user.mobile}` : 'Not Linked'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <FontAwesome5 name="id-card" size={14} color="#64748b" style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Referral ID (UID)</Text>
            </View>
            <Text style={styles.detailValText}>{user?.referralCode || 'N/A'}</Text>
          </View>

          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <View style={styles.detailLeft}>
              <FontAwesome5 name="calendar-day" size={14} color="#64748b" style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Joined On</Text>
            </View>
            <Text style={styles.detailValText}>{joinedDate}</Text>
          </View>
        </GlassCard>

        {/* Log Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <FontAwesome5 name="sign-out-alt" size={16} color="#ffffff" style={{ marginRight: 10 }} />
          <Text style={styles.logoutBtnText}>Log Out Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#0a0b10',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 90,
  },
  avatarCard: {
    alignItems: 'center',
    paddingVertical: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  avatarGlow: {
    position: 'absolute',
    top: -50,
    width: 250,
    height: 100,
    borderRadius: 125,
    opacity: 0.15,
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  largeAvatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
  },
  profileName: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileEmail: {
    color: '#64748b',
    fontSize: 13,
    marginBottom: 12,
  },
  vipTag: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  vipTagText: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: '700',
  },
  joinedDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinedDateText: {
    color: '#64748b',
    fontSize: 12,
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  cardSubtitle: {
    color: '#64748b',
    fontSize: 11,
    marginBottom: 16,
  },
  walletMiniStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  walletIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  walletMeta: {
    flex: 1,
  },
  walletLabel: {
    color: '#94a3b8',
    fontSize: 11,
    marginBottom: 2,
  },
  walletVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 10,
  },
  detailLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
  detailValText: {
    color: '#f8fafc',
    fontSize: 13.5,
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: '#f43f5e',
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#f43f5e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },
  logoutBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
