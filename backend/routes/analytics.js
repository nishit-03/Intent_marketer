const express = require('express');
const router = express.Router();
const AdMetric = require('../models/AdMetric');
const Interaction = require('../models/Interaction');
const Ad = require('../models/Ad');
const Session = require('../models/Session');

/**
 * GET /api/analytics/overview - Overall platform metrics
 */
router.get('/overview', async (req, res) => {
  try {
    const [totalImpressions, totalClicks, activeSessions, totalAds] = await Promise.all([
      Interaction.countDocuments({ event_type: 'impression' }),
      Interaction.countDocuments({ event_type: 'click' }),
      Session.countDocuments({ last_active: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      Ad.countDocuments({ status: 'active' }),
    ]);

    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : 0;

    res.json({
      totalImpressions,
      totalClicks,
      ctr: parseFloat(ctr),
      activeSessions,
      totalAds,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/analytics/timeline - Time-series metrics
 */
router.get('/timeline', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const metrics = await AdMetric.aggregate([
      { $match: { date: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          impressions: { $sum: '$impressions' },
          clicks: { $sum: '$clicks' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing dates
    const result = [];
    const current = new Date(startDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    while (current <= today) {
      const dateStr = current.toISOString().split('T')[0];
      const existing = metrics.find(m => m._id === dateStr);
      result.push({
        date: dateStr,
        impressions: existing?.impressions || 0,
        clicks: existing?.clicks || 0,
        ctr: existing?.impressions > 0
          ? parseFloat((existing.clicks / existing.impressions * 100).toFixed(2))
          : 0,
      });
      current.setDate(current.getDate() + 1);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/analytics/by-category - Metrics grouped by ad category
 */
router.get('/by-category', async (req, res) => {
  try {
    const adMap = {};
    const ads = await Ad.find();
    ads.forEach(ad => { adMap[ad.ad_id] = ad.category; });

    const interactions = await Interaction.aggregate([
      {
        $group: {
          _id: { ad_id: '$ad_id', event_type: '$event_type' },
          count: { $sum: 1 },
        },
      },
    ]);

    const categoryStats = {};
    interactions.forEach(item => {
      const category = adMap[item._id.ad_id] || 'other';
      if (!categoryStats[category]) {
        categoryStats[category] = { impressions: 0, clicks: 0 };
      }
      if (item._id.event_type === 'impression') {
        categoryStats[category].impressions += item.count;
      } else if (item._id.event_type === 'click') {
        categoryStats[category].clicks += item.count;
      }
    });

    const result = Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      impressions: stats.impressions,
      clicks: stats.clicks,
      ctr: stats.impressions > 0
        ? parseFloat((stats.clicks / stats.impressions * 100).toFixed(2))
        : 0,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/analytics/intent-ctr - Intent stage vs CTR correlation
 */
router.get('/intent-ctr', async (req, res) => {
  try {
    const stages = ['browsing', 'exploring', 'comparing', 'buying'];
    const result = [];

    for (const stage of stages) {
      const impressions = await Interaction.countDocuments({
        event_type: 'impression',
        'session_features.intent_stage': stage,
      });
      const clicks = await Interaction.countDocuments({
        event_type: 'click',
        'session_features.intent_stage': stage,
      });

      result.push({
        stage,
        impressions,
        clicks,
        ctr: impressions > 0
          ? parseFloat((clicks / impressions * 100).toFixed(2))
          : 0,
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/analytics/top-ads - Best performing ads
 */
router.get('/top-ads', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const topAds = await AdMetric.aggregate([
      {
        $group: {
          _id: '$ad_id',
          totalImpressions: { $sum: '$impressions' },
          totalClicks: { $sum: '$clicks' },
        },
      },
      { $sort: { totalClicks: -1 } },
      { $limit: limit },
    ]);

    // Enrich with ad details
    const enriched = await Promise.all(
      topAds.map(async (item) => {
        const ad = await Ad.findOne({ ad_id: item._id });
        return {
          ad_id: item._id,
          title: ad?.title || 'Unknown',
          category: ad?.category || 'other',
          impressions: item.totalImpressions,
          clicks: item.totalClicks,
          ctr: item.totalImpressions > 0
            ? parseFloat((item.totalClicks / item.totalImpressions * 100).toFixed(2))
            : 0,
        };
      })
    );

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/analytics/intent-distribution - Distribution of user intent stages
 */
router.get('/intent-distribution', async (req, res) => {
  try {
    const distribution = await Session.aggregate([
      {
        $group: {
          _id: '$intent_stage',
          count: { $sum: 1 },
          avg_score: { $avg: '$intent_score' },
        },
      },
    ]);

    res.json(distribution);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
