require('dotenv').config();
const mongoose = require('mongoose');
const Announcement = require('./models/Announcement');
const Notification = require('./models/Notification');

const testSync = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Connecting to database:', uri.replace(/:([^:@]+)@/, ':****@'));
    await mongoose.connect(uri);
    console.log('Connected successfully!\n');

    console.log('--- 1. RETRIEVING ACTIVE ANNOUNCEMENTS FROM test.announcements ---');
    const activeAnnouncements = await Announcement.find({ status: 'Active' });
    console.log(`Found ${activeAnnouncements.length} active announcements:`);
    activeAnnouncements.forEach((ann, i) => console.log(`  - ${ann.title}: "${ann.message}"`));
    console.log('');

    console.log('--- 2. RUNNING AUTOMATIC SYNCHRONIZATION TO test.notifications ---');
    for (const ann of activeAnnouncements) {
      await Notification.findOneAndUpdate(
        {
          title: `📢 Announcement: ${ann.title}`,
          type: 'Announcement'
        },
        {
          message: ann.message,
          userId: null,
          createdAt: ann.createdAt
        },
        { upsert: true, new: true }
      );
    }
    console.log('Synchronization complete!');

    // Clean up de-activated or deleted ones
    const activeAnnouncementTitles = activeAnnouncements.map(ann => `📢 Announcement: ${ann.title}`);
    const deleteResult = await Notification.deleteMany({
      type: 'Announcement',
      title: { $nin: activeAnnouncementTitles }
    });
    console.log(`Cleaned up: Deleted ${deleteResult.deletedCount} inactive announcement notifications.\n`);

    console.log('--- 3. VERIFYING test.notifications COLLECTION CONTENTS ---');
    const dbNotifications = await Notification.find({
      type: 'Announcement'
    }).sort({ createdAt: -1 });

    console.log(`Stored ${dbNotifications.length} announcement notifications directly in MongoDB 'notifications' collection:`);
    console.log(JSON.stringify(dbNotifications, null, 2));

  } catch (err) {
    console.error('Error during test fetch:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
    process.exit(0);
  }
};

testSync();
