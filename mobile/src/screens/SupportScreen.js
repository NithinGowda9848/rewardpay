import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import DashboardHeader from '../components/DashboardHeader';
import { LinearGradient } from 'expo-linear-gradient';

export default function SupportScreen({ navigation }) {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: 'How long does a deposit verification take?',
      a: 'Deposits are normally credited immediately after you input your payment details and click "Verify". In rare cases, UPI network congestion might delay verification up to 10 minutes.'
    },
    {
      q: 'What is the minimum withdrawal limit?',
      a: 'The minimum withdrawal limit is ₹300.00. You can request withdrawals directly to your target UPI ID or bank account details anytime.'
    },
    {
      q: 'How does the MLM Referral Rebate program work?',
      a: 'We offer a high-return 4-tier commission rebate. Level 1 (direct) gets 10%, Level 2 gets 5%, Level 3 gets 3%, and Level 4 gets 2% on their plan purchases.'
    },
    {
      q: 'Can I purchase multiple packages of the same type?',
      a: 'Yes, but each package has a maximum copy limit. For example, the Growth Plan (₹510) is limited to 10 copies per user account.'
    }
  ];

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const openLink = async (url) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', `Cannot open connection to: ${url}`);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <DashboardHeader title="Help & Support" navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Helpline Channels */}
        <Text style={styles.sectionTitle}>Customer Support Helplines</Text>
        
        <View style={styles.channelsContainer}>
          {/* Telegram bot */}
          <GlassCard style={styles.channelCard}>
            <View style={[styles.channelIconBox, { backgroundColor: '#0ea5e9' }]}>
              <FontAwesome5 name="telegram-plane" size={20} color="#ffffff" />
            </View>
            <View style={styles.channelInfo}>
              <Text style={styles.channelTitle}>Telegram Help Bot</Text>
              <Text style={styles.channelDesc}>
                Chat with our official Telegram help bot to get instant resolutions and payment support.
              </Text>
              <TouchableOpacity
                onPress={() => openLink('https://t.me/Rewardpayindia')}
                style={[styles.linkBtn, { backgroundColor: '#0ea5e9' }]}
              >
                <Text style={styles.linkBtnText}>Message Help Bot</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>

          {/* Email Support */}
          <GlassCard style={styles.channelCard}>
            <View style={[styles.channelIconBox, { backgroundColor: '#ec4899' }]}>
              <FontAwesome5 name="envelope" size={20} color="#ffffff" />
            </View>
            <View style={styles.channelInfo}>
              <Text style={styles.channelTitle}>Email Support Desk</Text>
              <Text style={styles.channelDesc}>
                Send your queries or payment screenshots directly to our billing desk.
              </Text>
              <TouchableOpacity
                onPress={() => openLink('mailto:Ik6628321@gmail.com')}
                style={[styles.linkBtn, { backgroundColor: '#ec4899' }]}
              >
                <Text style={styles.linkBtnText}>Send an Email</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>

        {/* Helpline timings & security */}
        <View style={styles.rowLayout}>
          <GlassCard style={styles.sideCard}>
            <View style={styles.sideCardHeader}>
              <FontAwesome5 name="clock" size={14} color="#6366f1" style={{ marginRight: 6 }} />
              <Text style={styles.sideCardTitle}>Helpline Timings</Text>
            </View>
            <Text style={styles.sideCardText}>Our live operators are online daily:</Text>
            <View style={styles.timeBadge}>
              <Text style={styles.timeText}>Mon - Sun</Text>
              <Text style={styles.timeVal}>10:00 AM - 10:00 PM</Text>
            </View>
            <Text style={styles.warningText}>
              * Requests outside hours will be processed sequentially the next morning.
            </Text>
          </GlassCard>

          <GlassCard style={[styles.sideCard, { borderColor: 'rgba(244, 63, 94, 0.2)' }]}>
            <View style={styles.sideCardHeader}>
              <FontAwesome5 name="shield-alt" size={14} color="#f43f5e" style={{ marginRight: 6 }} />
              <Text style={styles.sideCardTitle}>Security Advisory</Text>
            </View>
            <Text style={styles.sideCardText}>
              RewardPay agents will <Text style={{ fontWeight: '700', color: '#ffffff' }}>NEVER</Text> ask you for your login credentials, passwords, or transaction PINs. Please secure your account details.
            </Text>
          </GlassCard>
        </View>

        {/* FAQs */}
        <Text style={[styles.sectionTitle, { marginTop: 12 }]}>
          <FontAwesome5 name="question-circle" size={14} color="#818cf8" /> Frequently Asked Questions
        </Text>

        <View style={styles.faqList}>
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <GlassCard key={index} style={styles.faqCard} onPress={() => toggleFaq(index)} interactive>
                <View style={styles.faqQuestionRow}>
                  <Text style={styles.faqQuestion}>{faq.q}</Text>
                  <FontAwesome5 name={isOpen ? 'chevron-up' : 'chevron-down'} size={12} color="#94a3b8" />
                </View>
                {isOpen && (
                  <View style={styles.faqAnswerRow}>
                    <Text style={styles.faqAnswer}>{faq.a}</Text>
                  </View>
                )}
              </GlassCard>
            );
          })}
        </View>
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
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  channelsContainer: {
    marginBottom: 8,
  },
  channelCard: {
    flexDirection: 'row',
    padding: 18,
    marginBottom: 16,
  },
  channelIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  channelInfo: {
    flex: 1,
  },
  channelTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  channelDesc: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  linkBtn: {
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  linkBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  rowLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sideCard: {
    width: '48%',
    padding: 14,
    marginBottom: 0,
  },
  sideCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sideCardTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },
  sideCardText: {
    color: '#94a3b8',
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 10,
  },
  timeBadge: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  timeText: {
    color: '#64748b',
    fontSize: 10,
    marginBottom: 2,
  },
  timeVal: {
    color: '#6366f1',
    fontSize: 11,
    fontWeight: '700',
  },
  warningText: {
    color: '#eab308',
    fontSize: 9.5,
    lineHeight: 13,
  },
  faqList: {
    marginTop: 8,
  },
  faqCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  faqAnswerRow: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    paddingTop: 10,
  },
  faqAnswer: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
});
