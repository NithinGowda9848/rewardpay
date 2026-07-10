const Transaction = require('../models/Transaction');

exports.getTransactions = async (req, res) => {
  const { type, search, startDate, endDate, sort } = req.query;

  try {
    let query = {};

    if (type && type !== 'All') {
      // Handle both lowercase and capitalized type
      query.type = { $in: [type, type.toLowerCase()] };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Sort definition
    let sortOptions = { createdAt: -1 };
    if (sort === 'oldest') {
      sortOptions = { createdAt: 1 };
    } else if (sort === 'amount-asc') {
      sortOptions = { amount: 1 };
    } else if (sort === 'amount-desc') {
      sortOptions = { amount: -1 };
    }

    let transactions = await Transaction.find(query)
      .populate('userId', 'name email mobile referralCode')
      .sort(sortOptions);

    if (search) {
      const searchLower = search.toLowerCase();
      transactions = transactions.filter(t => 
        (t.transactionId && t.transactionId.toLowerCase().includes(searchLower)) ||
        t.userId?.name?.toLowerCase().includes(searchLower) ||
        t.userId?.email?.toLowerCase().includes(searchLower) ||
        (t.description && t.description.toLowerCase().includes(searchLower))
      );
    }

    // Duplicate userId as user for Admin frontend compatibility
    const responseData = transactions.map(t => {
      const obj = t.toObject ? t.toObject() : t;
      obj.user = obj.userId;
      obj.date = obj.createdAt; // Duplicate createdAt as date for frontend compatibility
      return obj;
    });

    res.json(responseData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
