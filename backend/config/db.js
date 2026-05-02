const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer = null;

const connectDB = async () => {
  // Try local MongoDB first, fallback to in-memory
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/intentmarketer';

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log(`[OK] MongoDB connected: ${mongoose.connection.host}`);
    return mongoose.connection;
  } catch (err) {
    console.log('[INFO] Local MongoDB unavailable, starting in-memory server...');
  }

  // Fallback: in-memory MongoDB
  try {
    mongoServer = await MongoMemoryServer.create();
    const memUri = mongoServer.getUri();
    await mongoose.connect(memUri);
    console.log(`[OK] In-memory MongoDB started: ${memUri}`);
    return mongoose.connection;
  } catch (error) {
    console.error('[ERROR] Failed to start any MongoDB instance:', error.message);
    process.exit(1);
  }
};

const closeDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
};

module.exports = connectDB;
module.exports.closeDB = closeDB;
