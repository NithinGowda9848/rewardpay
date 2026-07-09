const Setting = require('../models/Setting');
const AuditLog = require('../models/AuditLog');

const getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSettings = async (req, res) => {
  const {
    siteName,
    siteDescription,
    minDeposit,
    minWithdrawal,
    maxWithdrawal,
    signupBonus,
    level1Commission,
    level2Commission,
    level3Commission,
    level4Commission,
    upiId,
    bankDetails,
    telegramLink,
    paymentInstructions,
    notificationSettings
  } = req.body;

  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
    }

    settings.siteName = siteName !== undefined ? siteName : settings.siteName;
    settings.siteDescription = siteDescription !== undefined ? siteDescription : settings.siteDescription;
    settings.minDeposit = minDeposit !== undefined ? minDeposit : settings.minDeposit;
    settings.minWithdrawal = minWithdrawal !== undefined ? minWithdrawal : settings.minWithdrawal;
    settings.maxWithdrawal = maxWithdrawal !== undefined ? maxWithdrawal : settings.maxWithdrawal;
    settings.signupBonus = signupBonus !== undefined ? signupBonus : settings.signupBonus;
    settings.level1Commission = level1Commission !== undefined ? level1Commission : settings.level1Commission;
    settings.level2Commission = level2Commission !== undefined ? level2Commission : settings.level2Commission;
    settings.level3Commission = level3Commission !== undefined ? level3Commission : settings.level3Commission;
    settings.level4Commission = level4Commission !== undefined ? level4Commission : settings.level4Commission;
    settings.upiId = upiId !== undefined ? upiId : settings.upiId;
    settings.telegramLink = telegramLink !== undefined ? telegramLink : settings.telegramLink;
    
    // Update QR code dynamically if UPI ID changes
    if (upiId !== undefined) {
      settings.upiQr = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=${encodeURIComponent(upiId)}`;
    }

    if (bankDetails !== undefined) {
      settings.bankDetails = {
        ...settings.bankDetails,
        ...bankDetails
      };
    }

    if (notificationSettings !== undefined) {
      settings.notificationSettings = {
        ...settings.notificationSettings,
        ...notificationSettings
      };
    }

    settings.paymentInstructions = paymentInstructions !== undefined ? paymentInstructions : settings.paymentInstructions;

    const saved = await settings.save();

    await AuditLog.create({
      admin: req.admin.username,
      role: req.admin.role,
      action: 'Update Settings',
      details: 'Updated global system settings',
      ipAddress: req.ip
    });

    res.json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSettings,
  updateSettings
};
