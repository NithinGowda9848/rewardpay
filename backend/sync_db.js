require('dotenv').config();
const { MongoClient } = require('mongodb');

// Get arguments: 'test-to-mongodb' (default) or 'mongodb-to-test'
const direction = process.argv[2] || 'test-to-mongodb';

const run = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('Error: MONGODB_URI is not defined in your env file.');
    process.exit(1);
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    console.log('Connecting to MongoDB Atlas Cluster...');
    await client.connect();
    console.log('Connected successfully.');

    let sourceDbName, targetDbName;
    if (direction === 'mongodb-to-test') {
      sourceDbName = 'mongodb';
      targetDbName = 'test';
    } else {
      sourceDbName = 'test';
      targetDbName = 'mongodb';
    }

    console.log(`\n--- Starting Sync: ${sourceDbName} ==> ${targetDbName} ---`);

    const sourceDb = client.db(sourceDbName);
    const targetDb = client.db(targetDbName);

    // List all collections in the source database
    const collections = await sourceDb.listCollections().toArray();
    console.log(`Found ${collections.length} collections in source database '${sourceDbName}'.`);

    for (let colInfo of collections) {
      const colName = colInfo.name;
      console.log(`\nSyncing collection: [${colName}]`);

      // 1. Fetch all documents from source collection
      const docs = await sourceDb.collection(colName).find({}).toArray();
      console.log(`Fetched ${docs.length} documents from ${sourceDbName}.${colName}`);

      if (docs.length === 0) {
        console.log(`Collection ${colName} is empty, skipping insert.`);
        continue;
      }

      // Backfill missing usernames for legacy users to prevent index errors
      if (colName === 'users') {
        const usernames = new Set();
        docs.forEach((doc, idx) => {
          if (!doc.username) {
            let base = (doc.email ? doc.email.split('@')[0] : doc.name ? doc.name.replace(/\s+/g, '') : 'user')
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '');
            if (!base) base = 'user';
            
            let checked = base;
            let counter = 1;
            while (usernames.has(checked)) {
              checked = `${base}${counter}`;
              counter++;
            }
            doc.username = checked;
          }
          usernames.add(doc.username);
        });
      }

      // Backfill missing/null transactionId for legacy transactions to prevent index errors
      if (colName === 'transactions') {
        docs.forEach((doc, idx) => {
          if (!doc.transactionId) {
            const prefix = doc.type ? doc.type.substring(0, 3).toUpperCase() : 'TX';
            const dateStr = doc.createdAt ? new Date(doc.createdAt).getTime() : Date.now();
            doc.transactionId = `${prefix}${dateStr}${idx}${Math.floor(100 + Math.random() * 900)}`;
          }
        });
      }

      // 2. Clear target collection to avoid duplicate key errors
      console.log(`Clearing target collection ${targetDbName}.${colName}...`);
      await targetDb.collection(colName).deleteMany({});

      // 3. Insert documents into target collection
      const insertResult = await targetDb.collection(colName).insertMany(docs);
      console.log(`Successfully copied ${insertResult.insertedCount} documents to ${targetDbName}.${colName}`);
    }

    console.log(`\n--- Synchronization Finished: ${sourceDbName} ==> ${targetDbName} completed successfully! ---`);

  } catch (err) {
    console.error('\nError during database synchronization:', err.message);
  } finally {
    await client.close();
    process.exit(0);
  }
};

run();
