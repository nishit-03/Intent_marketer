const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Ad = require('../models/Ad');
const Session = require('../models/Session');
const { extractAdFeatures } = require('../services/llmService');
const { rankAds } = require('../services/adRanker');
const { recordImpression, recordClick } = require('../services/feedbackLoop');
const { authMiddleware, optionalAuth, requireRole } = require('../middleware/auth');

/**
 * POST /api/ads - Create a new ad (advertiser only)
 */
router.post('/', authMiddleware, requireRole('advertiser', 'admin'), async (req, res) => {
  try {
    const { title, description, image_url, category, advertiser_name, cta_text, cta_url } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ error: 'title, description, and category are required' });
    }

    const ad = new Ad({
      ad_id: uuidv4(),
      title,
      description,
      image_url: image_url || '',
      category,
      advertiser_name: advertiser_name || req.user.company_name || req.user.name,
      advertiser_id: req.user._id.toString(),
      cta_text: cta_text || 'Learn More',
      cta_url: cta_url || '#',
      status: 'processing',
    });

    await ad.save();

    // Extract features using LLM (async)
    extractAdFeatures(title, description)
      .then(async (features) => {
        ad.extracted_features = features;
        ad.status = 'active';
        await ad.save();
        console.log(`[OK] Ad ${ad.ad_id} features extracted`);
      })
      .catch(async (err) => {
        console.error(`[ERR] Feature extraction failed for ad ${ad.ad_id}:`, err.message);
        ad.status = 'failed';
        await ad.save();
      });

    res.status(201).json({
      success: true,
      ad: { ad_id: ad.ad_id, title: ad.title, category: ad.category, status: ad.status },
      message: 'Ad created. LLM feature extraction in progress...',
    });
  } catch (error) {
    console.error('Create ad error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/ads - List ads (filtered by role)
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    // If advertiser, only show their ads
    if (req.user && req.user.role === 'advertiser') {
      filter.advertiser_id = req.user._id.toString();
    }

    const ads = await Ad.find(filter).sort({ created_at: -1 });
    res.json(ads);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/ads/serve - Serve top ranked ads for a session (public)
 */
router.get('/serve', async (req, res) => {
  try {
    const { session_id, categories, current_category } = req.query;

    if (!session_id) {
      return res.status(400).json({ error: 'session_id query param required' });
    }

    let session = await Session.findOne({ session_id });
    if (!session) {
      session = {
        session_id,
        pages_visited: [],
        categories_viewed: [],
        tags_viewed: [],
        intent_score: 0,
        intent_stage: 'browsing',
        total_time_spent: 0,
        comparison_count: 0,
        product_views: 0,
        avg_scroll_depth: 0,
      };
    }

    // Inject current active category into session for the ranker
    if (current_category) {
      session._currentCategory = current_category;
    }

    // Get active ads, optionally filtered by publisher's category preferences
    const adFilter = { status: 'active' };
    if (categories) {
      const catList = categories.split(',').map(c => c.trim()).filter(Boolean);
      if (catList.length > 0) {
        adFilter.category = { $in: catList };
      }
    }

    const ads = await Ad.find(adFilter);

    if (ads.length === 0) {
      return res.json({
        ads: [],
        intent: { score: session.intent_score, stage: session.intent_stage },
        message: 'No active ads available',
      });
    }

    const rankedAds = await rankAds(ads, session, 3);

    // Record impressions with full session context for ML training
    const catAffinity = session.category_affinity instanceof Map
      ? Object.fromEntries(session.category_affinity)
      : (session.category_affinity || {});

    for (const rankedAd of rankedAds) {
      const adFeatures = rankedAd.explanation?.matched_keywords || [];
      const adObj = await Ad.findOne({ ad_id: rankedAd.ad_id });
      const extractedFeatures = adObj?.extracted_features || {};

      await recordImpression(
        session_id, rankedAd.ad_id,
        {
          pages_visited: (session.pages_visited || []).length,
          time_spent: session.total_time_spent || 0,
          intent_score: session.intent_score || 0,
          intent_stage: session.intent_stage || 'browsing',
          intent_velocity: session.intent_velocity || 0,
          comparison_count: session.comparison_count || 0,
          product_views: session.product_views || 0,
          scroll_depth: session.avg_scroll_depth || 0,
          max_scroll_depth: session.max_scroll_depth || 0,
          reread_score: session.reread_score || 0,
          engagement_depth: session.interaction_depth || 0,
          hover_rate: (session.total_hovers || 0) / Math.max((session.pages_visited || []).length, 1),
          category_affinity: catAffinity,
          categories_viewed: session.categories_viewed || [],
          tags_viewed: session.tags_viewed || [],
          publisher_id: req.query.publisher_id || '',
        },
        {
          category: rankedAd.category,
          keywords: adFeatures,
          brand: extractedFeatures.brand || '',
          price_range: extractedFeatures.price_range || '',
          target_intent: extractedFeatures.target_intent || '',
        },
        rankedAd.relevance_score
      );
    }

    res.json({
      ads: rankedAds,
      intent: {
        score: session.intent_score,
        stage: session.intent_stage,
        pages_count: (session.pages_visited || []).length,
        time_spent: session.total_time_spent,
        categories: session.categories_viewed,
      },
    });
  } catch (error) {
    console.error('Serve ads error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/ads/:id/click - Record ad click (public)
 */
router.post('/:id/click', async (req, res) => {
  try {
    const { session_id, intent_stage } = req.body;
    await recordClick(session_id, req.params.id, intent_stage);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/ads/:id - Get single ad (public for ad popup)
 */
router.get('/:id', async (req, res) => {
  try {
    const ad = await Ad.findOne({ ad_id: req.params.id });
    if (!ad) return res.status(404).json({ error: 'Ad not found' });
    res.json(ad);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/ads/:id - Update ad (advertiser owner or admin)
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const filter = { ad_id: req.params.id };
    if (req.user.role === 'advertiser') {
      filter.advertiser_id = req.user._id.toString();
    }
    const ad = await Ad.findOneAndUpdate(filter, { ...req.body, updated_at: new Date() }, { new: true });
    if (!ad) return res.status(404).json({ error: 'Ad not found' });
    res.json(ad);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/ads/:id - Delete ad
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const filter = { ad_id: req.params.id };
    if (req.user.role === 'advertiser') {
      filter.advertiser_id = req.user._id.toString();
    }
    await Ad.findOneAndDelete(filter);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
