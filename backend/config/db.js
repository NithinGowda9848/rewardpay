const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Drop old non-sparse email index to prevent validation issues when email is optional
    try {
      await mongoose.connection.db.collection('users').dropIndex('email_1');
      console.log('Successfully dropped old email_1 index.');
    } catch (indexErr) {
      console.log('email_1 index did not exist or could not be dropped, which is fine.');
    }

    // Drop old non-sparse mobile index to prevent validation issues when mobile is optional
    try {
      await mongoose.connection.db.collection('users').dropIndex('mobile_1');
      console.log('Successfully dropped old mobile_1 index.');
    } catch (indexErr) {
      console.log('mobile_1 index did not exist or could not be dropped, which is fine.');
    }

    // Drop old transactionId_1 index on transactions collection to prevent duplicate key errors
    try {
      await mongoose.connection.db.collection('transactions').dropIndex('transactionId_1');
      console.log('Successfully dropped old transactionId_1 index.');
    } catch (indexErr) {
      console.log('transactionId_1 index did not exist or could not be dropped, which is fine.');
    }
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
