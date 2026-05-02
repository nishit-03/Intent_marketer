const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { generateToken, authMiddleware } = require('../middleware/auth');

/**
 * POST /api/auth/signup — Register new user
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, role, website_url, website_name, ad_categories, company_name } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'email, password, name, and role are required' });
    }

    if (!['publisher', 'advertiser'].includes(role)) {
      return res.status(400).json({ error: 'role must be publisher or advertiser' });
    }

    // Check if email exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const userData = { email, password, name, role };

    if (role === 'publisher') {
      userData.website_url = website_url || '';
      userData.website_name = website_name || '';
      userData.ad_categories = ad_categories || ['tech', 'finance', 'travel', 'health', 'education', 'ecommerce'];
      userData.publisher_id = 'pub_' + uuidv4().substring(0, 12);
    }

    if (role === 'advertiser') {
      userData.company_name = company_name || '';
    }

    const user = new User(userData);
    await user.save();

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Signup error:', error.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login — Login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /api/auth/me — Get current user
 */
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user.toJSON() });
});

module.exports = router;
