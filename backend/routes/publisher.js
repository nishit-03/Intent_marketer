const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const Interaction = require('../models/Interaction');
const AdMetric = require('../models/AdMetric');
const Ad = require('../models/Ad');
const User = require('../models/User');

// All publisher routes require auth
router.use(authMiddleware);
router.use(requireRole('publisher'));

// Revenue rates
const CPM_RATE = 1.00;   // $1 per 1000 impressions
const CPC_RATE = 0.05;   // $0.05 per click

/**
 * GET /api/publisher/stats — Publisher's revenue and performance
 */
router.get('/stats', async (req, res) => {
  try {
    const publisherId = req.user.publisher_id;

    // Get interactions on this publisher's site
    const impressions = await Interaction.countDocuments({
      event_type: 'impression',
      'session_features.publisher_id': publisherId,
    });

    const clicks = await Interaction.countDocuments({
      event_type: 'click',
      'session_features.publisher_id': publisherId,
    });

    // If no publisher-specific data yet, show demo data from all interactions
    const totalImpressions = impressions || await Interaction.countDocuments({ event_type: 'impression' });
    const totalClicks = clicks || await Interaction.countDocuments({ event_type: 'click' });

    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0;
    const revenue = (totalImpressions / 1000 * CPM_RATE) + (totalClicks * CPC_RATE);

    res.json({
      impressions: totalImpressions,
      clicks: totalClicks,
      ctr: parseFloat(ctr.toFixed(2)),
      revenue: parseFloat(revenue.toFixed(2)),
      cpm_rate: CPM_RATE,
      cpc_rate: CPC_RATE,
      publisher_id: publisherId,
      website: req.user.website_name || req.user.website_url,
      ad_categories: req.user.ad_categories,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

/**
 * GET /api/publisher/script — Get embed script for publisher
 */
router.get('/script', async (req, res) => {
  try {
    const publisherId = req.user.publisher_id;
    const categories = (req.user.ad_categories || []).join(',');
    const backendUrl = `${req.protocol}://${req.get('host')}`;

    const script = `<!-- IntentMarketer Ad SDK -->
<script
  src="${backendUrl}/sdk.js"
  data-api="${backendUrl}"
  data-publisher-id="${publisherId}"
  data-categories="${categories}"
  data-mode="popup"
  async>
</script>
<div id="ad-slot"></div>`;

    const steps = [
      {
        step: 1,
        title: 'Copy the script tag',
        description: 'Add this script to your website HTML, ideally before the closing </body> tag.',
      },
      {
        step: 2,
        title: 'Add an ad slot div',
        description: 'Place <div id="ad-slot"></div> where you want ads to appear on your page.',
      },
      {
        step: 3,
        title: 'Configure categories',
        description: 'Update your ad category preferences to control what types of ads appear.',
      },
      {
        step: 4,
        title: 'Go live',
        description: 'Ads will automatically load and track impressions. Revenue appears in your dashboard.',
      },
    ];

    res.json({
      script,
      publisher_id: publisherId,
      steps,
      categories: req.user.ad_categories,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate script' });
  }
});

/**
 * PUT /api/publisher/categories — Update ad category preferences
 */
router.put('/categories', async (req, res) => {
  try {
    const { categories } = req.body;
    if (!Array.isArray(categories)) {
      return res.status(400).json({ error: 'categories must be an array' });
    }

    req.user.ad_categories = categories;
    await req.user.save();

    res.json({ success: true, categories: req.user.ad_categories });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update categories' });
  }
});

/**
 * GET /api/publisher/timeline — Daily revenue timeline
 */
router.get('/timeline', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 14;
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
        revenue: parseFloat(((imp / 1000 * CPM_RATE) + (clk * CPC_RATE)).toFixed(2)),
      });
      current.setDate(current.getDate() + 1);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load timeline' });
  }
});

module.exports = router;
