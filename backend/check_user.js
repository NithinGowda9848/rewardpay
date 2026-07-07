const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const checkUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Database Connected.');

    const user = await User.findOne({ mobile: '6300316162' });
    if (user) {
      console.log('USER FOUND:', {
        id: user._id,
        username: user.username,
        mobile: user.mobile,
        createdAt: user.createdAt
      });
    } else {
      console.log('USER NOT FOUND for mobile: 6300316162');
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error running script:', error);
    process.exit(1);
  }
};

checkUser();
