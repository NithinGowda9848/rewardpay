const User = require('../models/User');
const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const { collectEarnings } = require('./authController');

// @desc    Get user profile details
// @route   GET /api/user/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    // Collect latest earnings
    await collectEarnings(req.user._id);

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('getProfile Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update fields
    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email; // optional email change
    
    // Handle password updates
    if (req.body.password) {
      user.password = req.body.password; // pre-save hook will hash this
    }

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        walletBalance: updatedUser.walletBalance,
      },
    });
  } catch (error) {
    console.error('updateProfile Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get active announcements
// @route   GET /api/user/announcements
// @access  Private
exports.getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({ status: 'Active' }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    console.error('getAnnouncements Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all notifications (user-specific, global notifications, and announcements)
// @route   GET /api/user/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    // 1. Fetch active announcements from announcements collection in MongoDB
    const activeAnnouncements = await Announcement.find({ status: 'Active' });

    // 2. Synchronize active announcements to notifications collection in MongoDB (upserting)
    for (const ann of activeAnnouncements) {
      await Notification.findOneAndUpdate(
        {
          title: `📢 Announcement: ${ann.title}`,
          type: 'Announcement'
        },
        {
          message: ann.message,
          userId: null, // global notification
          createdAt: ann.createdAt
        },
        { upsert: true, new: true }
      );
    }

    // 3. Clean up any notifications for announcements that are deleted or set to Inactive
    const activeAnnouncementTitles = activeAnnouncements.map(ann => `📢 Announcement: ${ann.title}`);
    await Notification.deleteMany({
      type: 'Announcement',
      title: { $nin: activeAnnouncementTitles }
    });

    // 4. Fetch all user-specific and synchronized global notifications directly from the notifications collection in MongoDB
    const dbNotifications = await Notification.find({
      $or: [
        { userId: req.user._id },
        { userId: null }
      ]
    }).sort({ createdAt: -1 });

    // 5. Format notifications to send back to frontend
    const formattedNotifications = dbNotifications.map((notif) => ({
      _id: notif._id,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      read: notif.read,
      createdAt: notif.createdAt,
      isAnnouncement: notif.type === 'Announcement',
    }));

    res.status(200).json({
      success: true,
      data: formattedNotifications,
    });
  } catch (error) {
    console.error('getNotifications Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/user/notifications/:id/read
// @access  Private
exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, $or: [{ userId: req.user._id }, { userId: null }] },
      { read: true },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    console.error('markNotificationRead Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
