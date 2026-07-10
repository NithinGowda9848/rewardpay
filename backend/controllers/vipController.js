const VipLevel = require('../models/VipLevel');
const AuditLog = require('../models/AuditLog');

exports.getVips = async (req, res) => {
  try {
    const vips = await VipLevel.find().sort({ requiredInvestment: 1 });
    res.json(vips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createVip = async (req, res) => {
  const { levelName, requiredEarnings, requiredInvestment, benefits, commissionRate } = req.body;

  try {
    const vip = await VipLevel.create({
      levelName,
      requiredEarnings,
      requiredInvestment,
      benefits,
      commissionRate
    });

    await AuditLog.create({
      admin: req.admin.username,
      role: req.admin.role,
      action: 'Create VIP Level',
      details: `Created VIP Tier: ${levelName}`,
      ipAddress: req.ip
    });

    res.status(201).json(vip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateVip = async (req, res) => {
  const { id } = req.params;
  const { levelName, requiredEarnings, requiredInvestment, benefits, commissionRate } = req.body;

  try {
    const vip = await VipLevel.findById(id);
    if (!vip) return res.status(404).json({ message: 'VIP level not found' });

    vip.levelName = levelName || vip.levelName;
    vip.requiredEarnings = requiredEarnings !== undefined ? requiredEarnings : vip.requiredEarnings;
    vip.requiredInvestment = requiredInvestment !== undefined ? requiredInvestment : vip.requiredInvestment;
    vip.benefits = benefits || vip.benefits;
    vip.commissionRate = commissionRate !== undefined ? commissionRate : vip.commissionRate;

    const updated = await vip.save();

    await AuditLog.create({
      admin: req.admin.username,
      role: req.admin.role,
      action: 'Update VIP Level',
      details: `Updated VIP Tier: ${vip.levelName}`,
      ipAddress: req.ip
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteVip = async (req, res) => {
  const { id } = req.params;

  try {
    const vip = await VipLevel.findById(id);
    if (!vip) return res.status(404).json({ message: 'VIP level not found' });

    await VipLevel.findByIdAndDelete(id);

    await AuditLog.create({
      admin: req.admin.username,
      role: req.admin.role,
      action: 'Delete VIP Level',
      details: `Deleted VIP Tier: ${vip.levelName}`,
      ipAddress: req.ip
    });

    res.json({ message: 'VIP level deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
