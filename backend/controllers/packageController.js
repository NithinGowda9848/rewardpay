const Package = require('../models/Package');
const AuditLog = require('../models/AuditLog');

exports.getPackages = async (req, res) => {
  try {
    const packages = await Package.find().sort({ createdAt: -1 });
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createPackage = async (req, res) => {
  const { name, category, price, hourlyProfit, validityHours, maxPurchaseLimit, vipRequirement } = req.body;

  try {
    const pkg = await Package.create({
      name,
      category,
      price,
      hourlyProfit,
      validityHours,
      maxPurchaseLimit,
      vipRequirement
    });

    await AuditLog.create({
      admin: req.admin.username,
      role: req.admin.role,
      action: 'Create Package',
      details: `Created package: ${name} (₹${price})`,
      ipAddress: req.ip
    });

    res.status(201).json(pkg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePackage = async (req, res) => {
  const { id } = req.params;
  const { name, category, price, hourlyProfit, validityHours, maxPurchaseLimit, vipRequirement, status } = req.body;

  try {
    const pkg = await Package.findById(id);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });

    pkg.name = name || pkg.name;
    pkg.category = category || pkg.category;
    pkg.price = price !== undefined ? price : pkg.price;
    pkg.hourlyProfit = hourlyProfit !== undefined ? hourlyProfit : pkg.hourlyProfit;
    pkg.validityHours = validityHours !== undefined ? validityHours : pkg.validityHours;
    pkg.maxPurchaseLimit = maxPurchaseLimit !== undefined ? maxPurchaseLimit : pkg.maxPurchaseLimit;
    pkg.vipRequirement = vipRequirement || pkg.vipRequirement;
    pkg.status = status || pkg.status;

    const updated = await pkg.save();

    await AuditLog.create({
      admin: req.admin.username,
      role: req.admin.role,
      action: 'Update Package',
      details: `Updated package: ${pkg.name}`,
      ipAddress: req.ip
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deletePackage = async (req, res) => {
  const { id } = req.params;

  try {
    const pkg = await Package.findById(id);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });

    await Package.findByIdAndDelete(id);

    await AuditLog.create({
      admin: req.admin.username,
      role: req.admin.role,
      action: 'Delete Package',
      details: `Deleted package: ${pkg.name}`,
      ipAddress: req.ip
    });

    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.duplicatePackage = async (req, res) => {
  const { id } = req.params;

  try {
    const original = await Package.findById(id);
    if (!original) return res.status(404).json({ message: 'Package not found' });

    const duplicated = await Package.create({
      name: `${original.name} (Copy)`,
      category: original.category,
      price: original.price,
      hourlyProfit: original.hourlyProfit,
      validityHours: original.validityHours,
      maxPurchaseLimit: original.maxPurchaseLimit,
      vipRequirement: original.vipRequirement,
      status: 'Inactive' // Duplicated packages default to Inactive
    });

    await AuditLog.create({
      admin: req.admin.username,
      role: req.admin.role,
      action: 'Duplicate Package',
      details: `Duplicated package ${original.name} into ${duplicated.name}`,
      ipAddress: req.ip
    });

    res.status(201).json(duplicated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.bulkDeletePackages = async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'Invalid or empty package IDs list' });
  }

  try {
    const result = await Package.deleteMany({ _id: { $in: ids } });

    await AuditLog.create({
      admin: req.admin.username,
      role: req.admin.role,
      action: 'Bulk Delete Packages',
      details: `Bulk deleted ${result.deletedCount} packages`,
      ipAddress: req.ip
    });

    res.json({ message: `Successfully deleted ${result.deletedCount} packages` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
