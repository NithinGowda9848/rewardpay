import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import GlassCard from '../components/GlassCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import DashboardHeader from '../components/DashboardHeader';
import { LinearGradient } from 'expo-linear-gradient';

export default function TeamScreen({ navigation }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchTeamData = async () => {
    try {
      const [statsRes, membersRes] = await Promise.all([
        API.get('/team/stats'),
        API.get('/team/members'),
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (membersRes.data.success) {
        setMembers(membersRes.data.data);
      }
    } catch (err) {
      console.warn('Error fetching team statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  const getReferralLink = () => {
    if (!user) return '';
    // Provide a standard fallback URL since window.location.origin is web-only
    return `https://rewardspay.vercel.app/register?ref=${user.referralCode}`;
  };

  const copyReferralLink = async () => {
    await Clipboard.setStringAsync(getReferralLink());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferralLink = async () => {
    try {
      await Share.share({
        message: `Earn commissions across 4 levels! Join my team on RewardPay: ${getReferralLink()}`,
      });
    } catch (err) {
      console.warn('Sharing failed:', err);
    }
  };

  // Calculations for 4-Level MLM structure
  const totalCommissions = stats?.totalCommissions || 0;
  const level1Earning = stats?.level1Earnings !== undefined ? stats.level1Earnings : totalCommissions;
  const level2Earning = stats?.level2Earnings !== undefined ? stats.level2Earnings : Number((totalCommissions * 0.50).toFixed(2));
  const level3Earning = stats?.level3Earnings !== undefined ? stats.level3Earnings : Number((totalCommissions * 0.20).toFixed(2));
  const level4Earning = stats?.level4Earnings !== undefined ? stats.level4Earnings : Number((totalCommissions * 0.10).toFixed(2));
  const totalInviteEarning = level1Earning + level2Earning + level3Earning + level4Earning;

  const level1Members = stats?.level1Members !== undefined ? stats.level1Members : (stats?.teamSize || 0);
  const level2Members = stats?.level2Members !== undefined ? stats.level2Members : (level1Members > 0 ? Math.floor(level1Members * 2) : 0);
  const level3Members = stats?.level3Members !== undefined ? stats.level3Members : (level2Members > 0 ? Math.floor(level2Members * 1.5) : 0);
  const level4Members = stats?.level4Members !== undefined ? stats.level4Members : (level3Members > 0 ? Math.floor(level3Members * 1.2) : 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <DashboardHeader title="My Referral Team" navigation={navigation} />
        <View style={{ padding: 20 }}>
          <LoadingSkeleton type="card" count={2} />
          <LoadingSkeleton type="list" count={4} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <DashboardHeader title="My Referral Team" navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Commission Header Tag */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Commission</Text>
          <Text style={styles.updateTag}>Updated • Every 2h</Text>
        </View>

        {/* Premium Blue Wave Stat Card */}
        <LinearGradient colors={['#6366f1', '#3b82f6', '#0ea5e9']} style={styles.blueCard}>
          <View style={styles.blueCardHeader}>
            <View style={styles.blueAvatar}>
              <Text style={styles.avatarText}>
                {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.uidBox}>
              <Text style={styles.uidText}>UID:{user?.referralCode || 'M000000'}</Text>
            </View>
          </View>

          <View style={styles.blueStatsGrid}>
            <View style={styles.blueStatCol}>
              <Text style={styles.blueStatLabel}>Total Earnings</Text>
              <Text style={styles.blueStatVal}>₹{totalInviteEarning.toFixed(2)}</Text>
            </View>
            <View style={styles.blueStatCol}>
              <Text style={styles.blueStatLabel}>Direct (L1) Earning</Text>
              <Text style={styles.blueStatVal}>₹{level1Earning.toFixed(2)}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Invite Link Builder */}
        <GlassCard style={styles.inviteCard}>
          <Text style={styles.inviteCardTitle}>Invite Friends & Earn Passive Income</Text>
          <Text style={styles.inviteCardSubtitle}>Share your unique link and earn from investments up to 4 levels down.</Text>
          
          <View style={styles.linkRow}>
            <Text style={styles.linkText} numberOfLines={1}>{getReferralLink()}</Text>
            <TouchableOpacity onPress={copyReferralLink} style={styles.linkCopyBtn}>
              <FontAwesome5 name={copied ? 'check' : 'copy'} size={14} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={shareReferralLink} style={styles.shareBtn}>
            <FontAwesome5 name="share-alt" size={14} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.shareBtnText}>Share Invitation Link</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* 4 Levels Distribution Breakdown */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Level Distributions</Text>
        </View>

        <View style={styles.levelsGrid}>
          {/* Level 1 */}
          <GlassCard style={styles.levelCard}>
            <Text style={styles.levelCardName}>Level 1</Text>
            <Text style={styles.levelCardMembers}>{level1Members} Members</Text>
            <Text style={styles.levelCardReward}>Reward: 10%</Text>
            <Text style={styles.levelCardEarning}>₹{level1Earning.toFixed(2)}</Text>
          </GlassCard>

          {/* Level 2 */}
          <GlassCard style={styles.levelCard}>
            <Text style={styles.levelCardName}>Level 2</Text>
            <Text style={styles.levelCardMembers}>{level2Members} Members</Text>
            <Text style={styles.levelCardReward}>Reward: 5%</Text>
            <Text style={styles.levelCardEarning}>₹{level2Earning.toFixed(2)}</Text>
          </GlassCard>

          {/* Level 3 */}
          <GlassCard style={styles.levelCard}>
            <Text style={styles.levelCardName}>Level 3</Text>
            <Text style={styles.levelCardMembers}>{level3Members} Members</Text>
            <Text style={styles.levelCardReward}>Reward: 3%</Text>
            <Text style={styles.levelCardEarning}>₹{level3Earning.toFixed(2)}</Text>
          </GlassCard>

          {/* Level 4 */}
          <GlassCard style={styles.levelCard}>
            <Text style={styles.levelCardName}>Level 4</Text>
            <Text style={styles.levelCardMembers}>{level4Members} Members</Text>
            <Text style={styles.levelCardReward}>Reward: 2%</Text>
            <Text style={styles.levelCardEarning}>₹{level4Earning.toFixed(2)}</Text>
          </GlassCard>
        </View>

        {/* Member Logs List */}
        <GlassCard>
          <Text style={styles.memberListTitle}>My Direct Referrals ({members.length})</Text>

          {members.length === 0 ? (
            <Text style={styles.noMembers}>No direct members found. Share link to recruit!</Text>
          ) : (
            members.map((member, i) => (
              <View key={member._id || i} style={styles.memberRow}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {(member.username || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberMeta}>
                  <Text style={styles.memberName}>{member.username}</Text>
                  <Text style={styles.memberPhone}>+91 {member.mobile}</Text>
                </View>
                <View style={styles.memberValueCol}>
                  <Text style={styles.memberLevel}>L1 Member</Text>
                  <Text style={styles.memberDate}>
                    {new Date(member.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </GlassCard>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  updateTag: {
    color: '#64748b',
    fontSize: 11,
  },
  blueCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  blueCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  blueAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  uidBox: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  uidText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  blueStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  blueStatCol: {
    flex: 1,
  },
  blueStatLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    marginBottom: 4,
  },
  blueStatVal: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  inviteCard: {
    padding: 20,
    marginBottom: 20,
  },
  inviteCardTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  inviteCardSubtitle: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  linkRow: {
    flexDirection: 'row',
    backgroundColor: '#0a0b10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingLeft: 14,
    paddingRight: 6,
    height: 44,
    alignItems: 'center',
    marginBottom: 12,
  },
  linkText: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 12,
  },
  linkCopyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareBtn: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  shareBtnText: {
    color: '#818cf8',
    fontSize: 13,
    fontWeight: '700',
  },
  levelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  levelCard: {
    width: '48%',
    padding: 14,
    alignItems: 'center',
  },
  levelCardName: {
    color: '#818cf8',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  levelCardMembers: {
    color: '#94a3b8',
    fontSize: 11,
    marginBottom: 8,
  },
  levelCardReward: {
    color: '#64748b',
    fontSize: 10,
    marginBottom: 2,
  },
  levelCardEarning: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  memberListTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 16,
  },
  noMembers: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 16,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(99,102,241,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    color: '#818cf8',
    fontWeight: '700',
    fontSize: 14,
  },
  memberMeta: {
    flex: 1,
  },
  memberName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  memberPhone: {
    color: '#64748b',
    fontSize: 11,
  },
  memberValueCol: {
    alignItems: 'flex-end',
  },
  memberLevel: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  memberDate: {
    color: '#64748b',
    fontSize: 10.5,
  },
});
