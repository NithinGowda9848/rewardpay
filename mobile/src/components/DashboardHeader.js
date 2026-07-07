import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../services/api';

export default function DashboardHeader({ title, showBack = false, onBackPress, navigation }) {
  const { user } = useAuth();
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await API.get('/user/notifications');
      if (res.data.success) {
        const readIdsStr = await AsyncStorage.getItem('read_announcements');
        const readIds = readIdsStr ? JSON.parse(readIdsStr) : [];
        const formatted = res.data.data.map((notif) => {
          const isRead = notif.isAnnouncement
            ? readIds.includes(notif._id)
            : notif.read;

          return {
            id: notif._id,
            title: notif.title,
            message: notif.message,
            time: new Date(notif.createdAt).toLocaleDateString() + ' ' + new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: isRead,
            isAnnouncement: notif.isAnnouncement,
          };
        });
        setNotifications(formatted);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id) => {
    try {
      const targetNotif = notifications.find(n => n.id === id);
      if (!targetNotif) return;

      if (targetNotif.isAnnouncement) {
        const readIdsStr = await AsyncStorage.getItem('read_announcements');
        const readIds = readIdsStr ? JSON.parse(readIdsStr) : [];
        if (!readIds.includes(id)) {
          readIds.push(id);
          await AsyncStorage.setItem('read_announcements', JSON.stringify(readIds));
        }
      } else {
        await API.put(`/user/notifications/${id}/read`);
      }

      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const annIds = notifications.filter(n => n.isAnnouncement).map(n => n.id);
      const dbNotifIds = notifications.filter(n => !n.isAnnouncement && !n.read).map(n => n.id);

      const readIdsStr = await AsyncStorage.getItem('read_announcements');
      const readIds = readIdsStr ? JSON.parse(readIdsStr) : [];
      annIds.forEach(id => {
        if (!readIds.includes(id)) readIds.push(id);
      });
      await AsyncStorage.setItem('read_announcements', JSON.stringify(readIds));

      await Promise.all(
        dbNotifIds.map(id => API.put(`/user/notifications/${id}/read`))
      );

      setNotifications(notifications.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to clear all notifications:', err);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          {showBack && onBackPress ? (
            <TouchableOpacity onPress={onBackPress} style={styles.iconBtn}>
              <FontAwesome5 name="chevron-left" size={18} color="#f8fafc" />
            </TouchableOpacity>
          ) : (
            <Text style={styles.logoText}>RewardPay</Text>
          )}
          {title && !showBack && <Text style={styles.headerTitle}>{title}</Text>}
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate('Support')} style={styles.iconBtn}>
            <FontAwesome5 name="headset" size={18} color="#f8fafc" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowNotif(true)} style={styles.iconBtn}>
            <FontAwesome5 name="bell" size={18} color="#f8fafc" />
            {unreadCount > 0 && <View style={styles.badge} />}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications Modal */}
      <Modal visible={showNotif} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <SafeAreaView edges={['top', 'bottom']} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <View style={styles.modalHeaderActions}>
                {unreadCount > 0 && (
                  <TouchableOpacity onPress={clearAllNotifications} style={styles.clearBtn}>
                    <Text style={styles.clearBtnText}>Mark all read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowNotif(false)} style={styles.closeBtn}>
                  <FontAwesome5 name="times" size={20} color="#f8fafc" />
                </TouchableOpacity>
              </View>
            </View>

            {loading && notifications.length === 0 ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
              </View>
            ) : (
              <ScrollView style={styles.notifList}>
                {notifications.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No notifications found.</Text>
                  </View>
                ) : (
                  notifications.map((n) => (
                    <TouchableOpacity
                      key={n.id}
                      style={[styles.notifItem, n.read ? styles.notifRead : styles.notifUnread]}
                      onPress={() => markAsRead(n.id)}
                    >
                      <View style={styles.notifStatusCol}>
                        {!n.read && <View style={styles.unreadDot} />}
                      </View>
                      <View style={styles.notifBodyCol}>
                        <Text style={styles.notifItemTitle}>{n.title}</Text>
                        <Text style={styles.notifItemMsg}>{n.message}</Text>
                        <Text style={styles.notifItemTime}>{n.time}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#0a0b10',
  },
  headerContainer: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#0a0b10',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#6366f1',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 8,
    marginHorizontal: 4,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f43f5e',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 11, 16, 0.85)',
  },
  modalContent: {
    flex: 1,
    marginTop: 50,
    backgroundColor: '#11131e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearBtn: {
    marginRight: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  clearBtnText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 6,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  },
  notifList: {
    flex: 1,
    padding: 12,
  },
  notifItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
  },
  notifUnread: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
  },
  notifRead: {
    backgroundColor: 'rgba(22, 25, 41, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  notifStatusCol: {
    width: 14,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366f1',
  },
  notifBodyCol: {
    flex: 1,
  },
  notifItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 4,
  },
  notifItemMsg: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 6,
  },
  notifItemTime: {
    fontSize: 11,
    color: '#64748b',
  },
});
