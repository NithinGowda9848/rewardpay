const User = require('../models/User');
const Deposit = require('../models/Deposit');
const Withdrawal = require('../models/Withdrawal');
const Transaction = require('../models/Transaction');
const UserPackage = require('../models/UserPackage');

const initChangeStreams = (io) => {
  const collectionsToWatch = [
    { model: User, event: 'user_change' },
    { model: Deposit, event: 'deposit_change' },
    { model: Withdrawal, event: 'withdrawal_change' },
    { model: Transaction, event: 'transaction_change' },
    { model: UserPackage, event: 'userpackage_change' }
  ];

  collectionsToWatch.forEach(({ model, event }) => {
    try {
      const stream = model.watch();

      stream.on('change', (change) => {
        console.log(`[ChangeStream] Change detected on ${model.modelName}:`, change.operationType);
        
        // Broadcast the specific change
        io.emit(event, change);
        
        // Also trigger general dashboard update
        io.emit('dashboard_update');
      });

      stream.on('error', (err) => {
        console.warn(`[ChangeStream] Active error in stream for ${model.modelName}:`, err.message);
      });

      console.log(`[ChangeStream] Started watching ${model.modelName} collection.`);
    } catch (error) {
      console.warn(`[ChangeStream] Failed to start change stream watch for ${model.modelName}:`, error.message);
    }
  });
};

module.exports = { initChangeStreams };
