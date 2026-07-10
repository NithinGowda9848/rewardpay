// Server entrypoint with correct DB configuration
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log('--- ENV VARIABLE CHECK ---');
console.log(`MONGODB_URI is ${process.env.MONGODB_URI ? 'SET' : 'MISSING'}`);
console.log(`JWT_SECRET is ${process.env.JWT_SECRET ? 'SET' : 'MISSING'}`);
console.log(`ADMIN_SECRET is ${process.env.ADMIN_SECRET ? 'SET' : 'MISSING'}`);
console.log(`CORS_ORIGIN is ${process.env.CORS_ORIGIN ? 'SET' : 'MISSING'}`);
console.log('--------------------------');

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const Package = require('./models/Package');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const walletRoutes = require('./routes/walletRoutes');
const teamRoutes = require('./routes/teamRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');

// Import Admin routes
const adminDashboardRoutes = require('./routes/adminDashboardRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const adminDepositRoutes = require('./routes/adminDepositRoutes');
const adminWithdrawalRoutes = require('./routes/adminWithdrawalRoutes');
const adminSettingsRoutes = require('./routes/adminSettingsRoutes');
const adminPackageRoutes = require('./routes/packageRoutes');
const adminVipRoutes = require('./routes/vipRoutes');
const adminNetworkRoutes = require('./routes/networkRoutes');
const adminTicketRoutes = require('./routes/ticketRoutes');
const adminAnnouncementRoutes = require('./routes/announcementRoutes');
const adminNotificationRoutes = require('./routes/notificationRoutes');
const adminWalletRoutes = require('./routes/adminWalletRoutes');
const adminTransactionRoutes = require('./routes/adminTransactionRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  }
});

// Connect to Database
connectDB().then(() => {
  seedPackages();
  // Initialize Database Change Streams
  const { initChangeStreams } = require('./config/changeStreams');
  initChangeStreams(io);
});

// Real-Time Events Map
io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

// Make Socket.IO available to express handlers via req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(helmet());
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 10000 : 300, // relaxed limit for development polling
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api/', limiter);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static plan images locally from backend directory
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Serve static files from the React frontend app
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// Routes
const { protect } = require('./middleware/auth');
const { deposit, withdraw } = require('./controllers/walletController');

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/purchase', purchaseRoutes);

app.post('/api/deposits', protect, deposit);
app.post('/api/withdrawals', protect, withdraw);

// Admin route mounts
app.use('/api/dashboard', adminDashboardRoutes);
app.use('/api/users', adminUserRoutes);
app.use('/api/admin/deposits', adminDepositRoutes);
app.use('/api/deposits', adminDepositRoutes);
app.use('/api/admin/withdrawals', adminWithdrawalRoutes);
app.use('/api/withdrawals', adminWithdrawalRoutes);
app.use('/api/settings', adminSettingsRoutes);
app.use('/api/packages', adminPackageRoutes);
app.use('/api/vip', adminVipRoutes);
app.use('/api/network', adminNetworkRoutes);
app.use('/api/tickets', adminTicketRoutes);
app.use('/api/announcements', adminAnnouncementRoutes);
app.use('/api/notifications', adminNotificationRoutes);
app.use('/api/wallets', adminWalletRoutes);
app.use('/api/transactions', adminTransactionRoutes);

// Base route for checkups
app.get('/', (req, res) => {
  res.json({ message: 'Earning Rewards Dashboard API running successfully' });
});

// Catch-all route to serve React's index.html for any client-side routes
app.get('*', (req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/images')) {
    return res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
      if (err) {
        next();
      }
    });
  }
  next();
});

// Seed packages if database is empty
async function seedPackages() {
  try {
    // Re-seed the collection to use INR pricing scales matching the frontend tabs
    await Package.deleteMany({});
    const defaultPackages = [
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
      },
    ];
    await Package.insertMany(defaultPackages);
    console.log('Rupee packages successfully seeded in the database!');
  } catch (error) {
    console.error('Error seeding packages:', error.message);
  }
};

// Seeding executed on DB connect

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
// Trigger nodemon retry 3