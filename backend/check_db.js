require('dotenv').config();
const mongoose = require('mongoose');

const run = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Connecting to database with URI:', uri.replace(/:([^:@]+)@/, ':****@'));
    
    await mongoose.connect(uri);
    console.log('Successfully connected to MongoDB Cluster!\n');

    const admin = mongoose.connection.db.admin();
    const dbsList = await admin.listDatabases();
    
    console.log('=========================================');
    console.log('DATABASES IN YOUR CLUSTER:');
    console.log('=========================================');
    for (const dbInfo of dbsList.databases) {
      console.log(`- Database Name: ${dbInfo.name} (Size on disk: ${dbInfo.sizeOnDisk} bytes)`);
    }
    console.log('');

    // Let's inspect 'mongodb' and 'test' databases
    const targetDbs = ['mongodb', 'test'];
    for (const dbName of targetDbs) {
      console.log(`=========================================`);
      console.log(`INSPECTING DATABASE: ${dbName}`);
      console.log(`=========================================`);
      
      const client = mongoose.connection.client;
      const db = client.db(dbName);
      const collections = await db.listCollections().toArray();
      
      if (collections.length === 0) {
        console.log('No collections found in this database.\n');
        continue;
      }

      console.log('Collections:');
      for (const col of collections) {
        const count = await db.collection(col.name).countDocuments();
        console.log(`  - ${col.name} (${count} documents)`);
      }
      console.log('');

      // Print announcements if any
      const announcementsCol = db.collection('announcements');
      const annCount = await announcementsCol.countDocuments();
      if (annCount > 0) {
        console.log(`Sample Announcements from ${dbName}.announcements:`);
        const anns = await announcementsCol.find({}).limit(2).toArray();
        console.log(JSON.stringify(anns, null, 2));
        console.log('');
      }

      // Print notifications if any
      const notificationsCol = db.collection('notifications');
      const notifCount = await notificationsCol.countDocuments();
      if (notifCount > 0) {
        console.log(`Sample Notifications from ${dbName}.notifications:`);
        const notifs = await notificationsCol.find({}).limit(2).toArray();
        console.log(JSON.stringify(notifs, null, 2));
        console.log('');
      }
    }

  } catch (err) {
    console.error('Error executing check_db diagnostics:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
};

run();
