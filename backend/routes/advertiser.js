const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const Ad = require('../models/Ad');
const AdMetric = require('../models/AdMetric');
const Interaction = require('../models/Interaction');

router.use(authMiddleware);
router.use(requireRole('advertiser'));

/**
 * GET /api/advertiser/stats — Aggregate KPIs for this advertiser
 */
router.get('/stats', async (req, res) => {
  try {
    const advertiserId = req.user._id.toString();
    const ads = await Ad.find({ advertiser_id: advertiserId });
    const adIds = ads.map(a => a.ad_id);

    const [totalImpressions, totalClicks] = await Promise.all([
      Interaction.countDocuments({ ad_id: { $in: adIds }, event_type: 'impression' }),
      Interaction.countDocuments({ ad_id: { $in: adIds }, event_type: 'click' }),
    ]);

    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0;
    const CPM_RATE = 1.00;
    const CPC_RATE = 0.05;
    const estimatedSpend = (totalImpressions / 1000 * CPM_RATE) + (totalClicks * CPC_RATE);

    const statusCounts = { active: 0, processing: 0, paused: 0, failed: 0 };
    ads.forEach(a => { statusCounts[a.status] = (statusCounts[a.status] || 0) + 1; });

    const categoryCounts = {};
    ads.forEach(a => { categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1; });

    res.json({
      totalAds: ads.length,
      totalImpressions,
      totalClicks,
      ctr: parseFloat(ctr.toFixed(2)),
      estimatedSpend: parseFloat(estimatedSpend.toFixed(2)),
      statusCounts,
      categoryCounts,
      advertiserName: req.user.company_name || req.user.name,
    });
  } catch (error) {
    console.error('Advertiser stats error:', error);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

/**
 * GET /api/advertiser/timeline — Daily impressions/clicks for advertiser's ads
 */
router.get('/timeline', async (req, res) => {
  try {
    const advertiserId = req.user._id.toString();
    const days = parseInt(req.query.days) || 14;
    const ads = await Ad.find({ advertiser_id: advertiserId });
    const adIds = ads.map(a => a.ad_id);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const metrics = await AdMetric.aggregate([
      { $match: { ad_id: { $in: adIds }, date: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          impressions: { $sum: '$impressions' },
          clicks: { $sum: '$clicks' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const result = [];
    const current = new Date(startDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    while (current <= today) {
      const dateStr = current.toISOString().split('T')[0];
      const existing = metrics.find(m => m._id === dateStr);
      const imp = existing?.impressions || 0;
      const clk = existing?.clicks || 0;
      result.push({
        date: dateStr,
        impressions: imp,
        clicks: clk,
        ctr: imp > 0 ? parseFloat((clk / imp * 100).toFixed(2)) : 0,
      });
      current.setDate(current.getDate() + 1);
    }

    res.json(result);
  } catch (error) {
    console.error('Advertiser timeline error:', error);
    res.status(500).json({ error: 'Failed to load timeline' });
  }
});

/**
 * GET /api/advertiser/ads/:adId/analytics — Per-ad analytics
 */
router.get('/ads/:adId/analytics', async (req, res) => {
  try {
    const advertiserId = req.user._id.toString();
    const ad = await Ad.findOne({ ad_id: req.params.adId, advertiser_id: advertiserId });
    if (!ad) return res.status(404).json({ error: 'Ad not found' });

    // Aggregate metrics
    const metrics = await AdMetric.find({ ad_id: ad.ad_id }).sort({ date: 1 });

    let totalImpressions = 0, totalClicks = 0;
    const intentStages = { browsing: 0, exploring: 0, comparison_shopper: 0, potential_buyer: 0 };
    const dailyData = [];

    for (const m of metrics) {
      totalImpressions += m.impressions || 0;
      totalClicks += m.clicks || 0;

      if (m.intent_stages) {
        for (const [stage, count] of Object.entries(m.intent_stages.toJSON ? m.intent_stages.toJSON() : m.intent_stages)) {
          intentStages[stage] = (intentStages[stage] || 0) + count;
        }
      }

      dailyData.push({
        date: m.date.toISOString().split('T')[0],
        impressions: m.impressions || 0,
        clicks: m.clicks || 0,
        ctr: m.impressions > 0 ? parseFloat((m.clicks / m.impressions * 100).toFixed(2)) : 0,
      });
    }

    // Get top-performing intent stages
    const intentDistribution = Object.entries(intentStages)
      .filter(([, v]) => v > 0)
      .map(([stage, count]) => ({
        stage: stage.replace('_', ' '),
        count,
        percentage: totalClicks > 0 ? parseFloat((count / totalClicks * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    res.json({
      ad: {
        ad_id: ad.ad_id,
        title: ad.title,
        description: ad.description,
        category: ad.category,
        status: ad.status,
        image_url: ad.image_url,
        cta_text: ad.cta_text,
        extracted_features: ad.extracted_features,
        created_at: ad.created_at,
      },
      metrics: {
        totalImpressions,
        totalClicks,
        ctr: totalImpressions > 0 ? parseFloat((totalClicks / totalImpressions * 100).toFixed(2)) : 0,
      },
      intentDistribution,
      dailyData,
    });
  } catch (error) {
    console.error('Ad analytics error:', error);
    res.status(500).json({ error: 'Failed to load ad analytics' });
  }
});

/**
 * GET /api/advertiser/top-ads — Best performing ads by CTR
 */
router.get('/top-ads', async (req, res) => {
  try {
    const advertiserId = req.user._id.toString();
    const ads = await Ad.find({ advertiser_id: advertiserId });
    const adIds = ads.map(a => a.ad_id);

    const aggregated = await AdMetric.aggregate([
      { $match: { ad_id: { $in: adIds } } },
      {
        $group: {
          _id: '$ad_id',
          totalImpressions: { $sum: '$impressions' },
          totalClicks: { $sum: '$clicks' },
        },
      },
      { $sort: { totalClicks: -1 } },
    ]);

    const enriched = aggregated.map(item => {
      const ad = ads.find(a => a.ad_id === item._id);
      return {
        ad_id: item._id,
        title: ad?.title || 'Unknown',
        category: ad?.category || 'other',
        status: ad?.status || 'unknown',
        image_url: ad?.image_url || '',
        impressions: item.totalImpressions,
        clicks: item.totalClicks,
        ctr: item.totalImpressions > 0
          ? parseFloat((item.totalClicks / item.totalImpressions * 100).toFixed(2))
          : 0,
      };
    });

    res.json(enriched);
  } catch (error) {
    console.error('Top ads error:', error);
    res.status(500).json({ error: 'Failed to load top ads' });
  }
});

module.exports = router;
