require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to Atlas');
    
    // Find users with null username and fix them
    const nullUsers = await mongoose.connection.collection('users').find({ username: null }).toArray();
    for (let u of nullUsers) {
      const newUsername = 'legacy_user_' + u._id.toString();
      await mongoose.connection.collection('users').updateOne(
        { _id: u._id },
        { $set: { username: newUsername } }
      );
      console.log('Fixed username for', u._id);
    }
    
    // Drop old mobile index if it exists, to allow recreating it as sparse
    try {
      await mongoose.connection.db.collection('users').dropIndex('mobile_1');
      console.log('Dropped old mobile_1 index');
    } catch (e) {
      console.log('No old mobile_1 index to drop or error:', e.message);
    }
    
    // Drop old transactionId index if it exists
    try {
      await mongoose.connection.db.collection('transactions').dropIndex('transactionId_1');
      console.log('Dropped old transactionId_1 index');
    } catch (e) {
      console.log('No old transactionId_1 index to drop or error:', e.message);
    }
    
    // Sync indexes
    await User.syncIndexes();
    console.log('Indexes synced successfully on Atlas');

  } catch (err) {
    console.log('Error:', err.message);
  } finally {
    process.exit(0);
  }
}
run();