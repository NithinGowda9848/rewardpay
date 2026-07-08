import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import { FaHeadset, FaTelegramPlane, FaEnvelope, FaClock, FaQuestionCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import './Support.css';

const Support = () => {
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
      a: 'Yes, but each package has a maximum copy limit. For example, the Growth Plan (₹450) is limited to 10 copies per user account.'
    }
  ];

  const toggleFaq = (index) => {
    if (openFaq === index) {
      setOpenFaq(null);
    } else {
      setOpenFaq(index);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="support-header">
        <h1>Help & Support</h1>
        <p>Connect with our customer care help lines or view answers to frequently asked queries.</p>
      </div>

      <div className="support-grid">
        {/* Left Panel: Contact Help lines */}
        <div className="support-channels-section">
          <h2>Customer Support Helplines</h2>
          <div className="channels-container">
            {/* Telegram Helpline */}
            <GlassCard className="channel-card glass-panel-interactive">
              <div className="channel-icon-wrapper telegram-color">
                <FaTelegramPlane />
              </div>
              <div className="channel-info">
                <h3>Telegram Help Bot</h3>
                <p>Chat with our official Telegram help bot to get instant resolutions and payment support.</p>
                <a 
                  href="https://t.me/rewardpayindia1" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="channel-link-btn tg-btn"
                >
                  Message Help Bot
                </a>
              </div>
            </GlassCard>

            {/* Email Support */}
            <GlassCard className="channel-card glass-panel-interactive">
              <div className="channel-icon-wrapper email-color">
                <FaEnvelope />
              </div>
              <div className="channel-info">
                <h3>Email Support</h3>
                <p>Send your queries or payment screenshots directly to our billing desk.</p>
                <a 
                  href="mailto:Ik6628321@gmail.com" 
                  className="channel-link-btn mail-btn"
                >
                  Send an Email
                </a>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Right Panel: Working Hours & Quick Info */}
        <div className="support-info-sidebar">
          <GlassCard className="info-sidebar-card">
            <div className="sidebar-info-header">
              <FaClock className="accent-icon" />
              <h3>Helpline Timings</h3>
            </div>
            <p className="working-hours-text">
              Our live chat operators are online daily:
            </p>
            <div className="time-badge">
              <span>Monday - Sunday</span>
              <strong>10:00 AM - 10:00 PM</strong>
            </div>
            <p className="notif-warning-text">
              * Verification requests initiated outside hours will be processed sequentially the next morning.
            </p>
          </GlassCard>

          <GlassCard className="info-sidebar-card warning-card">
            <div className="sidebar-info-header">
              <FaHeadset className="accent-icon rose-text" />
              <h3>Security Advisory</h3>
            </div>
            <p className="security-text">
              Rewards Pay support agents will **NEVER** ask you for your login credentials, passwords, or transaction PINs. Please secure your account details.
            </p>
          </GlassCard>
        </div>
      </div>

      {/* FAQs Section */}
      <div className="faqs-container-section">
        <h2><FaQuestionCircle /> Frequently Asked Questions</h2>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <GlassCard 
              key={index} 
              className={`faq-item ${openFaq === index ? 'open' : ''}`}
              onClick={() => toggleFaq(index)}
            >
              <div className="faq-question-row">
                <h4>{faq.q}</h4>
                {openFaq === index ? <FaChevronUp /> : <FaChevronDown />}
              </div>
              {openFaq === index && (
                <div className="faq-answer-row animate-fade-in">
                  <p>{faq.a}</p>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Support;
