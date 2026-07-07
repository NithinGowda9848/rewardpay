import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import GlassCard from '../components/GlassCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import SuccessModal from '../components/SuccessModal';
import DashboardHeader from '../components/DashboardHeader';
import { BACKEND_IP } from '../config';

export default function BuyScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const [packages, setPackages] = useState([]);
  const [activeInvestments, setActiveInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(null);

  // Tab Control
  const [activeTab, setActiveTab] = useState('packages'); // 'packages' | 'my_investments'
  const [category, setCategory] = useState('ALL');

  // Success Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMsg, setModalMsg] = useState('');

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
      console.warn('Error fetching packages, loading offline fallbacks:', err);
      const offlinePackages = [
        {
          _id: 'mock_pkg_3',
          name: 'Growth Plan',
          price: 510,
          dailyEarnings: 37,
          validityDays: 30,
          tag: '510-4500',
          vipLevel: 0,
          maxCopies: 10,
        },
        {
          _id: 'mock_pkg_4',
          name: 'Solar System',
          price: 1080,
          dailyEarnings: 60.0,
          validityDays: 30,
          tag: '510-4500',
          vipLevel: 0,
          maxCopies: 10,
        },
        {
          _id: 'mock_pkg_5',
          name: 'Windmills Plant',
          price: 1799,
          dailyEarnings: 130.0,
          validityDays: 30,
          tag: '510-4500',
          vipLevel: 1,
          maxCopies: 5,
        },
        {
          _id: 'mock_pkg_6',
          name: 'Hydroplant Mega',
          price: 2999,
          dailyEarnings: 280.0,
          validityDays: 30,
          tag: '510-4500',
          vipLevel: 2,
          maxCopies: 3,
        }
      ];
      setPackages(offlinePackages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackagesAndInvestments();
  }, []);

  const handlePurchase = async (id, name, price) => {
    Alert.alert(
      'Confirm Investment',
      `Are you sure you want to purchase the "${name}" for ₹${price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setPurchaseLoading(id);
            try {
              const res = await API.post(`/purchase/buy/${id}`);
              if (res.data.success) {
                setModalTitle('Investment Active!');
                setModalMsg(`Successfully purchased "${name}". Daily earnings of ₹${res.data.data.dailyEarnings} started!`);
                setIsModalOpen(true);
                await refreshUser();
                fetchPackagesAndInvestments();
              }
            } catch (err) {
              const errMsg = err.response?.data?.message || 'Transaction failed. Check wallet balance.';
              Alert.alert('Purchase Error', errMsg);
            } finally {
              setPurchaseLoading(null);
            }
          }
        }
      ]
    );
  };

  const filteredPackages = category === 'ALL'
    ? packages
    : packages.filter(pkg => pkg.tag === category);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <DashboardHeader title="Investments" navigation={navigation} />
        <View style={{ padding: 20 }}>
          <LoadingSkeleton type="line" count={1} />
          <LoadingSkeleton type="card" count={3} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <DashboardHeader title="Investment Center" navigation={navigation} />

      {/* Segmented Tab Bar */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('packages')}
          style={[styles.tabBtn, activeTab === 'packages' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'packages' && styles.tabTextActive]}>
            Invest Packages
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('my_investments')}
          style={[styles.tabBtn, activeTab === 'my_investments' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'my_investments' && styles.tabTextActive]}>
            My Investments ({activeInvestments.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'packages' ? (
        // Packages Panel
        <View style={{ flex: 1 }}>
          {/* Categories Selector */}
          <View style={styles.categoryWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[styles.catBadge, category === cat && styles.catBadgeActive]}
                >
                  <Text style={[styles.catText, category === cat && styles.catTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {filteredPackages.length === 0 ? (
              <View style={styles.emptyView}>
                <Text style={styles.emptyText}>No packages available under this category.</Text>
              </View>
            ) : (
              filteredPackages.map((pkg) => {
                return (
                  <GlassCard key={pkg._id} style={styles.packageCard}>
                  <View style={styles.cardHeader}>
                    <Image
                      source={{ uri: `http://${BACKEND_IP}:5000${pkg.image || '/images/solar_farm.png'}` }}
                      style={styles.packageImage}
                      resizeMode="cover"
                    />
                    <View style={styles.cardInfo}>
                      <Text style={styles.packageName}>{pkg.name}</Text>
                      <Text style={styles.packageTag}>Range: {pkg.tag} INR</Text>
                    </View>
                    <View style={styles.vipTag}>
                      <Text style={styles.vipTagText}>VIP {pkg.vipLevel || 0}</Text>
                    </View>
                  </View>

                  <View style={styles.detailsGrid}>
                    <View style={styles.detailCol}>
                      <Text style={styles.detailLabel}>Price</Text>
                      <Text style={styles.detailValue}>₹{pkg.price}</Text>
                    </View>
                    <View style={styles.detailCol}>
                      <Text style={styles.detailLabel}>Daily Return</Text>
                      <Text style={[styles.detailValue, { color: '#10b981' }]}>₹{pkg.dailyEarnings}</Text>
                    </View>
                    <View style={styles.detailCol}>
                      <Text style={styles.detailLabel}>Validity</Text>
                      <Text style={styles.detailValue}>{pkg.validityDays} Days</Text>
                    </View>
                  </View>

                  <View style={styles.separator} />

                  <View style={styles.cardFooter}>
                    <View style={styles.revenueEstimation}>
                      <Text style={styles.estLabel}>Total Estimated Revenue</Text>
                      <Text style={styles.estValue}>₹{(pkg.dailyEarnings * pkg.validityDays).toFixed(2)}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.investBtn}
                      onPress={() => handlePurchase(pkg._id, pkg.name, pkg.price)}
                      disabled={purchaseLoading !== null}
                    >
                      {purchaseLoading === pkg._id ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.investBtnText}>Invest Now</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              );
            })
            )}
          </ScrollView>
        </View>
      ) : (
        // Active Investments Panel
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {activeInvestments.length === 0 ? (
            <View style={styles.emptyView}>
              <FontAwesome5 name="shopping-cart" size={48} color="#64748b" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>You don't have any active investments yet.</Text>
            </View>
          ) : (
            activeInvestments.map((inv) => {
              const daysElapsed = Math.floor((new Date() - new Date(inv.purchaseDate)) / (1000 * 60 * 60 * 24));
              const daysRemaining = Math.max(0, inv.validityDays - daysElapsed);
              const progress = Math.min(100, (daysElapsed / inv.validityDays) * 100);

              return (
                <GlassCard key={inv._id} style={styles.activeCard}>
                  <View style={styles.activeHeader}>
                    <Image
                      source={{ uri: `http://${BACKEND_IP}:5000${inv.packageId?.image || '/images/solar_farm.png'}` }}
                      style={styles.activePackageImage}
                      resizeMode="cover"
                    />
                    <View style={styles.activeInfo}>
                      <Text style={styles.activeTitle}>{inv.packageName || inv.name}</Text>
                      <View style={styles.activeStatusRow}>
                        <View style={styles.statusBadge}>
                          <Text style={styles.statusBadgeText}>ACTIVE</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.activeStats}>
                    <View style={styles.activeStat}>
                      <Text style={styles.activeLabel}>Purchased Price</Text>
                      <Text style={styles.activeValue}>₹{inv.purchasePrice}</Text>
                    </View>
                    <View style={styles.activeStat}>
                      <Text style={styles.activeLabel}>Total Earned</Text>
                      <Text style={[styles.activeValue, { color: '#10b981' }]}>₹{inv.earningsAccumulated.toFixed(2)}</Text>
                    </View>
                    <View style={styles.activeStat}>
                      <Text style={styles.activeLabel}>Remaining Days</Text>
                      <Text style={styles.activeValue}>{daysRemaining} / {inv.validityDays}</Text>
                    </View>
                  </View>

                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                  </View>

                  <Text style={styles.dateText}>
                    Date: {new Date(inv.purchaseDate).toLocaleDateString()}
                  </Text>
                </GlassCard>
              );
            })
          )}
        </ScrollView>
      )}

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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0b10',
  },
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
  categoryWrapper: {
    height: 48,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  catBadge: {
    paddingHorizontal: 16,
    height: 34,
    borderRadius: 18,
    backgroundColor: '#11131e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  catBadgeActive: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  catText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  catTextActive: {
    color: '#818cf8',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 90,
  },
  emptyView: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
  },
  packageCard: {
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  packageImage: {
    width: 54,
    height: 54,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  cardInfo: {
    flex: 1,
  },
  packageName: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  packageTag: {
    color: '#64748b',
    fontSize: 12,
  },
  vipTag: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  vipTagText: {
    color: '#eab308',
    fontSize: 10,
    fontWeight: '700',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    color: '#64748b',
    fontSize: 11,
    marginBottom: 4,
  },
  detailValue: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revenueEstimation: {
    flex: 1,
  },
  estLabel: {
    color: '#64748b',
    fontSize: 10,
    marginBottom: 2,
  },
  estValue: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
  },
  investBtn: {
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  investBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  activeCard: {
    padding: 16,
    marginBottom: 16,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  activePackageImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  activeInfo: {
    flex: 1,
  },
  activeStatusRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  activeTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '800',
  },
  activeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  activeStat: {
    flex: 1,
  },
  activeLabel: {
    color: '#64748b',
    fontSize: 10,
    marginBottom: 4,
  },
  activeValue: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  dateText: {
    color: '#64748b',
    fontSize: 11,
    textAlign: 'right',
  },
});
