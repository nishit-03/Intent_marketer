require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  credentials: true,
}));
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve SDK as static file
app.use('/sdk.js', express.static(path.join(__dirname, 'sdk', 'sdk.js')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/track', require('./routes/track'));
app.use('/api/ads', require('./routes/ads'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/publisher', require('./routes/publisher'));
app.use('/api/advertiser', require('./routes/advertiser'));
app.use('/api/retrain', require('./routes/retrain'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'IntentMarketer',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Auto-seed if database is empty
async function autoSeed() {
  const Ad = require('./models/Ad');
  const count = await Ad.countDocuments();
  if (count === 0) {
    console.log('[INFO] Empty database detected, auto-seeding...');
    try {
      const seedFn = require('./seeds/seedAds');
      await seedFn(true);
    } catch (err) {
      console.log('[WARN] Auto-seed failed:', err.message);
    }
  } else {
    console.log(`[OK] Database has ${count} ads`);
  }
}

// Start server
async function start() {
  await connectDB();
  setTimeout(autoSeed, 1000);

  app.listen(PORT, () => {
    console.log(`
    ===========================================
      IntentMarketer Backend v2.0
      Privacy-First Ad Intelligence
    -------------------------------------------
      Server:    http://localhost:${PORT}
      SDK:       http://localhost:${PORT}/sdk.js
      Health:    http://localhost:${PORT}/api/health
      Auth:      http://localhost:${PORT}/api/auth
    ===========================================
    `);
  });
}

start();
