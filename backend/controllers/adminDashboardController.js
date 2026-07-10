const User = require('../models/User');
const Deposit = require('../models/Deposit');
const Withdrawal = require('../models/Withdrawal');
const UserPackage = require('../models/UserPackage');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');

const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      activePackagesCount,
      pendingWithdrawals,
      pendingDeposits,
      vipMembersCount
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'Active' }),
      User.countDocuments({ joinDate: { $gte: today } }),
      UserPackage.countDocuments({ expiresAt: { $gt: new Date() } }),
      Withdrawal.countDocuments({ status: 'Pending' }),
      Deposit.countDocuments({ status: 'Pending' }),
      User.countDocuments({ vipLevel: { $ne: 'Starter' } })
    ]);

    // Aggregate Deposits
    const approvedDeposits = await Deposit.aggregate([
      { $match: { status: 'Approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalDeposits = approvedDeposits[0]?.total || 0;

    // Aggregate Withdrawals
    const approvedWithdrawals = await Withdrawal.aggregate([
      { $match: { status: { $in: ['Approved', 'Paid'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalWithdrawals = approvedWithdrawals[0]?.total || 0;

    // Investments
    const investments = await UserPackage.aggregate([
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    const totalInvestments = investments[0]?.total || 0;

    // Referral Commissions
    const referralComms = await Transaction.aggregate([
      { $match: { type: { $in: ['referral', 'Referral Commission'] }, status: { $in: ['completed', 'Completed'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalReferralCommissions = referralComms[0]?.total || 0;

    const totalRevenue = totalDeposits - totalWithdrawals;

    // Aggregate Registrations over last 7 days
    const regChartData = await User.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$joinDate" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 7 }
    ]);

    // Aggregate Deposit vs Withdrawal over last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      last7Days.push(dateStr);
    }

    const txStats = await Transaction.aggregate([
      {
        $match: {
          type: { $in: ['deposit', 'Deposit', 'withdraw', 'Withdrawal', 'withdrawal'] },
          status: { $in: ['completed', 'Completed', 'Approved', 'Paid'] }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            type: { $toLower: "$type" }
          },
          total: { $sum: "$amount" }
        }
      }
    ]);

    const depVsWithChart = last7Days.map(date => {
      const dep = txStats.find(t => t._id.date === date && (t._id.type === 'deposit' || t._id.type === 'deposit'))?.total || 0;
      const withdr = txStats.find(t => t._id.date === date && (t._id.type === 'withdrawal' || t._id.type === 'withdraw'))?.total || 0;
      return { date, deposit: dep, withdrawal: withdr };
    });

    // Package Sales Chart
    const packageSales = await UserPackage.aggregate([
      {
        $lookup: {
          from: 'packages',
          localField: 'packageId',
          foreignField: '_id',
          as: 'pkg'
        }
      },
      { $unwind: '$pkg' },
      {
        $group: {
          _id: '$pkg.name',
          salesCount: { $sum: 1 },
          revenue: { $sum: '$price' }
        }
      }
    ]);

    // Revenue Chart (Deposits - Withdrawals monthly or daily)
    const revenueChart = last7Days.map(date => {
      const dep = txStats.find(t => t._id.date === date && (t._id.type === 'deposit' || t._id.type === 'deposit'))?.total || 0;
      const withdr = txStats.find(t => t._id.date === date && (t._id.type === 'withdrawal' || t._id.type === 'withdraw'))?.total || 0;
      return { date, revenue: dep - withdr };
    });

    // Calculate live Sparkline trends
    const usersSpark = last7Days.map(date => {
      const match = regChartData.find(r => r._id === date);
      return match ? match.count : 0;
    });

    const depositsSpark = last7Days.map(date => {
      return txStats.find(t => t._id.date === date && (t._id.type === 'deposit' || t._id.type === 'deposit'))?.total || 0;
    });

    const withdrawalsSpark = last7Days.map(date => {
      return txStats.find(t => t._id.date === date && (t._id.type === 'withdrawal' || t._id.type === 'withdraw'))?.total || 0;
    });

    const revenueSpark = last7Days.map((date, idx) => {
      return depositsSpark[idx] - withdrawalsSpark[idx];
    });

    const liveSparklines = {
      users: usersSpark,
      activeUsers: usersSpark.map(u => Math.round(u * 0.8)),
      newUsers: usersSpark,
      deposits: depositsSpark,
      withdrawals: withdrawalsSpark,
      revenue: revenueSpark,
      investments: [0, 0, 0, 0, 0, 0, 0],
      activePackages: [0, 0, 0, 0, 0, 0, 0],
      pendingWithdrawals: [0, 0, 0, 0, 0, 0, 0],
      pendingDeposits: [0, 0, 0, 0, 0, 0, 0]
    };

    // Recent activities feed
    const recentTransactions = await Transaction.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    const activityFeed = recentTransactions.map(tx => {
      let desc = tx.description || '';
      if (!desc) {
        if (tx.type === 'Deposit') desc = `Deposit of ₹${tx.amount} processed`;
        else if (tx.type === 'Withdrawal') desc = `Withdrawal of ₹${tx.amount} disbursed`;
        else desc = `${tx.type} request of ₹${tx.amount}`;
      }
      return {
        id: tx._id,
        user: tx.user?.name || 'User',
        email: tx.user?.email || 'N/A',
        action: tx.type,
        details: desc,
        timestamp: tx.createdAt
      };
    });

    res.json({
      summary: {
        totalUsers,
        activeUsers,
        newUsersToday,
        totalDeposits,
        totalWithdrawals,
        totalRevenue,
        totalInvestments,
        activePackages: activePackagesCount,
        pendingWithdrawals,
        pendingDeposits,
        vipMembersCount,
        totalReferralCommissions
      },
      sparklines: liveSparklines,
      charts: {
        revenue: revenueChart,
        registrations: last7Days.map(date => {
          const count = regChartData.find(r => r._id === date)?.count || 0;
          return { date, count };
        }),
        depositVsWithdrawal: depVsWithChart,
        packageSales: packageSales.map(p => ({
          name: p._id,
          value: p.salesCount,
          revenue: p.revenue
        }))
      },
      activityFeed
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSystemLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getSystemLogs
};
