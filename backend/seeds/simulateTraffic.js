/**
 * Simulate Traffic Script — Generates realistic high-volume traffic for analytics
 */
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const connectDB = require('../config/db');
const Ad = require('../models/Ad');
const AdMetric = require('../models/AdMetric');
const Session = require('../models/Session');
const Interaction = require('../models/Interaction');

// Configuration for traffic simulation
const NUM_DAYS = 14;
const BASE_DAILY_SESSIONS = 150; // Average sessions per day
const SESSION_VARIANCE = 50; // Random variance per day
const INTENT_STAGES = ['browsing', 'exploring', 'comparison shopper', 'potential buyer'];
const CATEGORIES = ['tech', 'finance', 'travel', 'health', 'education', 'ecommerce'];

// Helpers
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => Math.random() * (max - min) + min;
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Generate a realistic trend over 14 days (e.g. a recent marketing campaign peak)
function getDailyTrafficMultiplier(dayIndex, totalDays) {
  // Peak around day 10 (4 days ago)
  const peakDay = totalDays - 4;
  const distance = Math.abs(dayIndex - peakDay);
  if (distance === 0) return 3.5;
  if (distance === 1) return 2.8;
  if (distance === 2) return 1.8;
  return 1.0 + Math.random() * 0.3; // Baseline with noise
}

async function simulate() {
  await connectDB();
  console.log('[INFO] Connected to DB.');

  // Clean only analytics data, keep Ads and Users
  await AdMetric.deleteMany({});
  await Session.deleteMany({});
  await Interaction.deleteMany({});
  console.log('[INFO] Cleared previous analytics data (Metrics, Sessions, Interactions).');

  const ads = await Ad.find({ status: 'active' });
  if (ads.length === 0) {
    console.error('No active ads found. Please run seedAds.js first.');
    process.exit(1);
  }

  // Pre-calculate daily metrics to batch insert later
  const dailyMetricsMap = {}; // key: "YYYY-MM-DD_adId" -> { impressions, clicks, intent_stages }

  let totalSessions = 0;
  let totalImpressions = 0;
  let totalClicks = 0;

  for (let dayOffset = NUM_DAYS; dayOffset >= 0; dayOffset--) {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - dayOffset);
    
    // Randomize time for this date
    const dateStr = currentDate.toISOString().split('T')[0];

    const multiplier = getDailyTrafficMultiplier(NUM_DAYS - dayOffset, NUM_DAYS);
    const numSessions = Math.floor((BASE_DAILY_SESSIONS + randomInt(-SESSION_VARIANCE, SESSION_VARIANCE)) * multiplier);

    for (let s = 0; s < numSessions; s++) {
      totalSessions++;
      
      // Determine session characteristics
      const primaryCategory = pickRandom(CATEGORIES);
      
      // Intent distribution: heavily weighted towards browsing/exploring
      const r = Math.random();
      let intentStage;
      let intentScore;
      if (r < 0.5) { intentStage = 'browsing'; intentScore = randomFloat(0.05, 0.25); }
      else if (r < 0.8) { intentStage = 'exploring'; intentScore = randomFloat(0.25, 0.45); }
      else if (r < 0.92) { intentStage = 'comparison shopper'; intentScore = randomFloat(0.45, 0.70); }
      else { intentStage = 'potential buyer'; intentScore = randomFloat(0.70, 0.95); }

      const pagesVisitedCount = randomInt(1, intentStage === 'browsing' ? 3 : 12);
      const timeSpent = pagesVisitedCount * randomInt(20, 150);
      const avgScroll = randomFloat(0.2, 0.95);
      
      const sessionDate = new Date(currentDate);
      sessionDate.setHours(randomInt(0, 23), randomInt(0, 59), randomInt(0, 59));

      // Create Session
      const session = new Session({
        session_id: 'sim_' + uuidv4().substring(0, 10),
        pages_visited: Array.from({ length: pagesVisitedCount }, (_, i) => ({
          url: `https://topicdrill.blog/article-${randomInt(1, 100)}`,
          title: `Article about ${primaryCategory} ${randomInt(1, 100)}`,
          category: Math.random() > 0.8 ? pickRandom(CATEGORIES) : primaryCategory,
          page_type: ['blog', 'comparison', 'product'][randomInt(0, 2)],
          time_spent: Math.floor(timeSpent / pagesVisitedCount),
          scroll_depth: avgScroll + randomFloat(-0.1, 0.1),
        })),
        total_time_spent: timeSpent,
        total_clicks: randomInt(0, 15),
        avg_scroll_depth: avgScroll,
        max_scroll_depth: Math.min(avgScroll + randomFloat(0, 0.2), 1),
        intent_score: intentScore,
        intent_stage: intentStage,
        categories_viewed: [primaryCategory],
        comparison_count: intentStage === 'comparison shopper' ? randomInt(2, 5) : randomInt(0, 1),
        product_views: intentStage === 'potential buyer' ? randomInt(2, 6) : randomInt(0, 1),
        reread_score: randomFloat(0, intentStage === 'browsing' ? 0.3 : 0.8),
        interaction_depth: randomFloat(0.1, 0.9),
        created_at: sessionDate,
        last_active: sessionDate,
      });

      await session.save();

      // Generate Ad Impressions/Clicks for this session
      const numAdsShown = randomInt(0, Math.min(pagesVisitedCount * 2, 5));
      for (let a = 0; a < numAdsShown; a++) {
        // Find an ad that matches category mostly
        const eligibleAds = ads.filter(ad => ad.category === primaryCategory || Math.random() > 0.7);
        if (eligibleAds.length === 0) continue;
        
        const selectedAd = pickRandom(eligibleAds);
        
        // Base CTR around 2%, but higher for intent
        let clickProb = 0.02;
        if (intentStage === 'exploring') clickProb = 0.04;
        if (intentStage === 'comparison shopper') clickProb = 0.08;
        if (intentStage === 'potential buyer') clickProb = 0.15;
        
        // Bonus if category perfectly matches
        if (selectedAd.category === primaryCategory) clickProb *= 1.5;
        
        const clicked = Math.random() < clickProb;
        
        // Record Impression
        await Interaction.create({
          session_id: session.session_id,
          ad_id: selectedAd.ad_id,
          event_type: 'impression',
          session_features: {
            intent_stage: intentStage,
            intent_score: intentScore,
            publisher_id: 'pub_demo_001',
            scroll_depth: avgScroll,
            reread_score: session.reread_score,
            time_spent: timeSpent,
          },
          ad_features: {
            category: selectedAd.category,
            target_intent: selectedAd.extracted_features?.target_intent,
          },
          clicked: clicked,
          timestamp: sessionDate,
        });

        totalImpressions++;

        if (clicked) {
          totalClicks++;
          await Interaction.create({
            session_id: session.session_id,
            ad_id: selectedAd.ad_id,
            event_type: 'click',
            session_features: {
              intent_stage: intentStage,
              intent_score: intentScore,
              publisher_id: 'pub_demo_001',
              scroll_depth: avgScroll,
              reread_score: session.reread_score,
              time_spent: timeSpent,
            },
            ad_features: {
              category: selectedAd.category,
              target_intent: selectedAd.extracted_features?.target_intent,
            },
            clicked: true,
            timestamp: sessionDate,
          });
        }

        // Aggregate AdMetrics
        const metricKey = `${dateStr}_${selectedAd.ad_id}`;
        if (!dailyMetricsMap[metricKey]) {
          dailyMetricsMap[metricKey] = {
            ad_id: selectedAd.ad_id,
            date: new Date(dateStr),
            impressions: 0,
            clicks: 0,
            intent_stages: { browsing: 0, exploring: 0, comparison_shopper: 0, potential_buyer: 0 }
          };
        }
        
        dailyMetricsMap[metricKey].impressions++;
        if (clicked) {
          dailyMetricsMap[metricKey].clicks++;
          
          // Use the underscore version for the schema key
          const stageKey = intentStage.replace(' ', '_');
          dailyMetricsMap[metricKey].intent_stages[stageKey]++;
        }
      }
    }
    console.log(`[INFO] Day ${dateStr}: generated ${numSessions} sessions.`);
  }

  // Bulk insert AdMetrics
  console.log('[INFO] Saving AdMetrics...');
  const metricDocs = Object.values(dailyMetricsMap).map(m => ({
    ...m,
    ctr: m.impressions > 0 ? m.clicks / m.impressions : 0
  }));
  
  await AdMetric.insertMany(metricDocs);

  console.log('\n--- Simulation Complete ---');
  console.log(`Total Sessions:    ${totalSessions.toLocaleString()}`);
  console.log(`Total Impressions: ${totalImpressions.toLocaleString()}`);
  console.log(`Total Clicks:      ${totalClicks.toLocaleString()}`);
  const overallCtr = (totalClicks / totalImpressions * 100).toFixed(2);
  console.log(`Overall CTR:       ${overallCtr}%`);
  process.exit(0);
}

simulate().catch(err => {
  console.error('Error during simulation:', err);
  process.exit(1);
});
