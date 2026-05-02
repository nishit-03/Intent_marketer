const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const { processSessionUpdate } = require('../services/intentEngine');

/**
 * POST /api/track - Receive session behavior data from SDK
 */
router.post('/', async (req, res) => {
  try {
    const { session_id, url, title, category, time_spent, clicks, scroll_depth, hover_count, interaction_depth, reread_score, tags } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' });
    }

    // Find or create session
    let session = await Session.findOne({ session_id });

    if (!session) {
      session = new Session({
        session_id,
        pages_visited: [],
        categories_viewed: [],
        tags_viewed: [],
      });
    }

    // Process update through intent engine
    session = processSessionUpdate(session, {
      url,
      title,
      category,
      time_spent: time_spent || 0,
      clicks: clicks || 0,
      scroll_depth: scroll_depth || 0,
      hover_count: hover_count || 0,
      interaction_depth: interaction_depth || 0,
      reread_score: reread_score || 0,
      tags: tags || [],
    });

    await session.save();

    res.json({
      success: true,
      intent: {
        score: session.intent_score,
        stage: session.intent_stage,
        pages_count: session.pages_visited.length,
        categories: session.categories_viewed,
      },
    });
  } catch (error) {
    console.error('Track error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/track/:sessionId - Get session details
 */
router.get('/:sessionId', async (req, res) => {
  try {
    const session = await Session.findOne({ session_id: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
