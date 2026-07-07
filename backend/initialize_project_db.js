require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Package = require('./models/Package');
const Transaction = require('./models/Transaction');
const UserPackage = require('./models/UserPackage');
const Announcement = require('./models/Announcement');
const Notification = require('./models/Notification');

const run = async () => {
  try {
    console.log('Connecting to MongoDB database:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully!');

    // 1. Drop old index in users if it exists
    try {
      await mongoose.connection.db.collection('users').dropIndex('mobile_1');
      console.log('Dropped old mobile_1 index');
    } catch (e) {
      console.log('No old mobile_1 index to drop');
    }

    // 2. Sync all indexes to build collections and indexes
    console.log('Syncing indexes for all models...');
    await User.syncIndexes();
    await Package.syncIndexes();
    await Transaction.syncIndexes();
    await UserPackage.syncIndexes();
    await Announcement.syncIndexes();
    await Notification.syncIndexes();
    console.log('Indexes synced.');

    // 3. Seed Packages
    console.log('Seeding default packages...');
    await Package.deleteMany({});
    await Package.insertMany([
      {
        name: 'Growth Plan',
        price: 510,
        dailyEarnings: 37,
        validityDays: 30,
        tag: '510-4500',
        icon: 'FaCrown',
        image: '/images/biomass.png',
        vipLevel: 0,
        maxCopies: 10,
        date: '2026-06-04',
      },
      {
        name: 'Solar System',
        price: 1080,
        dailyEarnings: 60.0,
        validityDays: 30,
        tag: '510-4500',
        icon: 'FaCrown',
        image: '/images/solar_farm.png',
        vipLevel: 0,
        maxCopies: 10,
        date: '2026-06-04',
      },
      {
        name: 'Windmills',
        price: 1799,
        dailyEarnings: 130.0,
        validityDays: 30,
        tag: '510-4500',
        icon: 'FaCrown',
        image: '/images/wind_turbines.png',
        vipLevel: 0,
        maxCopies: 10,
        date: '2026-06-04',
      },
      {
        name: 'Hydroplant',
        price: 2999,
        dailyEarnings: 280.0,
        validityDays: 30,
        tag: '510-4500',
        icon: 'FaCrown',
        image: '/images/hydro_plant.png',
        vipLevel: 0,
        maxCopies: 10,
        date: '2026-06-04',
      },
      {
        name: 'Geothermal Energy',
        price: 4500,
        dailyEarnings: 350.0,
        validityDays: 30,
        tag: '510-4500',
        icon: 'FaCrown',
        image: '/images/geothermal.png',
        vipLevel: 0,
        maxCopies: 10,
        date: '2026-06-04',
      },
      {
        name: 'Hydrogen Cell',
        price: 7000,
        dailyEarnings: 480.0,
        validityDays: 30,
        tag: '7000-14000',
        icon: 'FaCrown',
        image: '/images/hydrogen.png',
        vipLevel: 1,
        maxCopies: 10,
        date: '2026-06-04',
      },
      {
        name: 'Solar Array',
        price: 9999,
        dailyEarnings: 710.0,
        validityDays: 30,
        tag: '7000-14000',
        icon: 'FaCrown',
        image: '/images/solar_canopy.png',
        vipLevel: 1,
        maxCopies: 10,
        date: '2026-06-04',
      },
      {
        name: 'Tidal Energy',
        price: 14000,
        dailyEarnings: 1500.0,
        validityDays: 15,
        tag: '7000-14000',
        icon: 'FaCrown',
        image: '/images/tidal_energy.png',
        vipLevel: 1,
        maxCopies: 10,
        date: '2026-06-04',
      },
      {
        name: 'Offshore Windfarm',
        price: 19999,
        dailyEarnings: 980.0,
        validityDays: 30,
        tag: '19999-55000',
        icon: 'FaGem',
        image: '/images/wind_offshore.png',
        vipLevel: 2,
        maxCopies: 10,
        date: '2026-06-04',
      },
      {
        name: 'Substation Link',
        price: 26599,
        dailyEarnings: 1400.0,
        validityDays: 30,
        tag: '19999-55000',
        icon: 'FaGem',
        image: '/images/substation.png',
        vipLevel: 2,
        maxCopies: 10,
        date: '2026-06-04',
      },
      {
        name: 'Hydrogen Power Plant',
        price: 30999,
        dailyEarnings: 3500.0,
        validityDays: 15,
        tag: '19999-55000',
        icon: 'FaGem',
        image: '/images/hydrogen.png',
        vipLevel: 2,
        maxCopies: 10,
        date: '2026-06-04',
      },
      {
        name: 'Apex Nuclear Core',
        price: 40000,
        dailyEarnings: 5000.0,
        validityDays: 15,
        tag: '19999-55000',
        icon: 'FaGem',
        image: '/images/nuclear_plant.png',
        vipLevel: 2,
        maxCopies: 10,
        date: '2026-06-04',
      },
      {
        name: 'Eco Smart City Grid',
        price: 42000,
        dailyEarnings: 5300.0,
        validityDays: 15,
        tag: '19999-55000',
        icon: 'FaGem',
        image: '/images/smart_city.png',
        vipLevel: 2,
        maxCopies: 10,
        date: '2026-06-04',
      },
      {
        name: 'Tidal Wave Array',
        price: 48000,
        dailyEarnings: 6000.0,
        validityDays: 15,
        tag: '19999-55000',
        icon: 'FaGem',
        image: '/images/tidal_energy.png',
        vipLevel: 2,
        maxCopies: 10,
        date: '2026-06-04',
      },
      {
        name: 'Magma Geothermal',
        price: 55000,
        dailyEarnings: 7500.0,
        validityDays: 15,
        tag: '19999-55000',
        icon: 'FaGem',
        image: '/images/geothermal.png',
        vipLevel: 2,
        maxCopies: 10,
        date: '2026-06-04',
      },
      {
        name: 'Smart Grid Core',
        price: 75000,
        dailyEarnings: 11000.0,
        validityDays: 15,
        tag: '75000-115000',
        icon: 'FaGem',
        image: '/images/smart_grid.png',
        vipLevel: 3,
        maxCopies: 5,
        date: '2026-06-04',
      },
      {
        name: 'Power Vault',
        price: 95000,
        dailyEarnings: 15000.0,
        validityDays: 15,
        tag: '75000-115000',
        icon: 'FaGem',
        image: '/images/battery_storage.png',
        vipLevel: 3,
        maxCopies: 5,
        date: '2026-06-04',
      },
      {
        name: 'Grid Substation',
        price: 110000,
        dailyEarnings: 18000.0,
        validityDays: 15,
        tag: '75000-115000',
        icon: 'FaGem',
        image: '/images/substation.png',
        vipLevel: 3,
        maxCopies: 5,
        date: '2026-06-04',
      },
      {
        name: 'Smart City Grid',
        price: 115000,
        dailyEarnings: 25000.0,
        validityDays: 15,
        tag: '75000-115000',
        icon: 'FaGem',
        image: '/images/smart_city.png',
        vipLevel: 3,
        maxCopies: 5,
        date: '2026-06-04',
      },
      {
        name: 'Deepwater Power Grid',
        price: 250000,
        dailyEarnings: 40000.0,
        validityDays: 15,
        tag: '250000-999999',
        icon: 'FaShieldAlt',
        image: '/images/submarine.png',
        vipLevel: 4,
        maxCopies: 3,
        date: '2026-06-04',
      },
      {
        name: 'Apex Nuclear Station',
        price: 400000,
        dailyEarnings: 65000.0,
        validityDays: 15,
        tag: '250000-999999',
        icon: 'FaShieldAlt',
        image: '/images/nuclear_plant.png',
        vipLevel: 4,
        maxCopies: 3,
        date: '2026-06-04',
      },
      {
        name: 'Metropolis Mega Grid',
        price: 999999,
        dailyEarnings: 150000.0,
        validityDays: 15,
        tag: '250000-999999',
        icon: 'FaShieldAlt',
        image: '/images/smart_city.png',
        vipLevel: 4,
        maxCopies: 2,
        date: '2026-06-04',
      }
    ]);
    console.log('Packages seeded.');

    // 4. Force creation of empty collections by inserting and deleting a mock document in other collections
    console.log('Ensuring all project collections exist in database...');
    
    // Transaction Collection
    const mockTx = await Transaction.create({
      userId: new mongoose.Types.ObjectId(),
      amount: 0,
      type: 'reward',
      status: 'completed',
      description: 'init database'
    });
    await Transaction.deleteOne({ _id: mockTx._id });

    // UserPackage Collection
    const mockUserPkg = await UserPackage.create({
      userId: new mongoose.Types.ObjectId(),
      packageId: new mongoose.Types.ObjectId(),
      name: 'init',
      price: 0,
      dailyEarnings: 0,
      validityDays: 30,
      expiresAt: new Date(),
      lastCollectedAt: new Date()
    });
    await UserPackage.deleteOne({ _id: mockUserPkg._id });

    // Announcement Collection
    const mockAnn = await Announcement.create({
      title: 'init',
      message: 'init message',
      priority: 'Low',
      status: 'Inactive'
    });
    await Announcement.deleteOne({ _id: mockAnn._id });

    console.log('All project collections initialized and stored in database successfully!');

  } catch (err) {
    console.error('Error during database initialization:', err.message);
  } finally {
    process.exit(0);
  }
};

run();
