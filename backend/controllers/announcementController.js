const Announcement = require('../models/Announcement');
const AuditLog = require('../models/AuditLog');

exports.getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createAnnouncement = async (req, res) => {
  const { title, message, priority, status, schedule, scheduledDate } = req.body;

  try {
    const announcement = await Announcement.create({
      title,
      message,
      priority,
      status,
      schedule,
      scheduledDate: schedule === 'Scheduled' ? scheduledDate : null
    });

    await AuditLog.create({
      admin: req.admin.username,
      role: req.admin.role,
      action: 'Create Announcement',
      details: `Created announcement: ${title}`,
      ipAddress: req.ip
    });

    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateAnnouncement = async (req, res) => {
  const { id } = req.params;
  const { title, message, priority, status, schedule, scheduledDate } = req.body;

  try {
    const announcement = await Announcement.findById(id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });

    announcement.title = title !== undefined ? title : announcement.title;
    announcement.message = message !== undefined ? message : announcement.message;
    announcement.priority = priority !== undefined ? priority : announcement.priority;
    announcement.status = status !== undefined ? status : announcement.status;
    
    if (schedule !== undefined) {
      announcement.schedule = schedule;
      if (schedule === 'Scheduled') {
        announcement.scheduledDate = scheduledDate !== undefined ? scheduledDate : announcement.scheduledDate;
      } else {
        announcement.scheduledDate = null;
      }
    } else if (scheduledDate !== undefined) {
      announcement.scheduledDate = scheduledDate;
    }

    const updated = await announcement.save();

    await AuditLog.create({
      admin: req.admin.username,
      role: req.admin.role,
      action: 'Update Announcement',
      details: `Updated announcement: ${announcement.title}`,
      ipAddress: req.ip
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  const { id } = req.params;

  try {
    const announcement = await Announcement.findById(id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });

    await Announcement.findByIdAndDelete(id);

    await AuditLog.create({
      admin: req.admin.username,
      role: req.admin.role,
      action: 'Delete Announcement',
      details: `Deleted announcement: ${announcement.title}`,
      ipAddress: req.ip
    });

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
