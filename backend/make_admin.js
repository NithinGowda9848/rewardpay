require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const usernameOrMobileOrEmail = process.argv[2];

if (!usernameOrMobileOrEmail) {
  console.error('Please specify a username, mobile number, or email. E.g., node make_admin.js testuser');
  process.exit(1);
}

const promote = async () => {
  try {
    console.log('Connecting to MongoDB database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const user = await User.findOne({
      $or: [
        { username: usernameOrMobileOrEmail.toLowerCase() },
        { email: usernameOrMobileOrEmail.toLowerCase() },
        { mobile: usernameOrMobileOrEmail }
      ]
    });

    if (!user) {
      console.error(`User "${usernameOrMobileOrEmail}" not found.`);
      process.exit(1);
    }

    user.role = 'admin';
    await user.save();

    console.log(`Success! User "${user.username}" (Mobile: ${user.mobile || 'N/A'}) has been promoted to admin.`);
  } catch (error) {
    console.error('Error promoting user:', error.message);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

promote();
