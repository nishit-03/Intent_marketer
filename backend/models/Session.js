const mongoose = require('mongoose');

const pageVisitSchema = new mongoose.Schema({
  url: String,
  title: String,
  category: String,
  page_type: {
    type: String,
    enum: ['blog', 'comparison', 'product', 'landing', 'other'],
    default: 'other',
  },
  time_spent: { type: Number, default: 0 },
  scroll_depth: { type: Number, default: 0 },
  visit_count: { type: Number, default: 1 },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  session_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  pages_visited: [pageVisitSchema],
  total_time_spent: { type: Number, default: 0 },
  total_clicks: { type: Number, default: 0 },
  avg_scroll_depth: { type: Number, default: 0 },
  max_scroll_depth: { type: Number, default: 0 },
  intent_score: { type: Number, default: 0, min: 0, max: 1 },
  intent_stage: {
    type: String,
    enum: ['browsing', 'exploring', 'comparing', 'buying'],
    default: 'browsing',
  },
  categories_viewed: [{ type: String }],
  // Category affinity: how much time/engagement per category
  category_affinity: {
    type: Map,
    of: Number,
    default: {},
  },
  // Accumulated article tags for keyword matching
  tags_viewed: [{ type: String }],
  comparison_count: { type: Number, default: 0 },
  product_views: { type: Number, default: 0 },
  total_hovers: { type: Number, default: 0 },
  interaction_depth: { type: Number, default: 0 },
  reread_score: { type: Number, default: 0 },
  // Session velocity: how quickly intent is changing
  intent_velocity: { type: Number, default: 0 },
  prev_intent_score: { type: Number, default: 0 },
  // Ad interaction history within session
  ads_clicked: [{ type: String }],
  ads_dismissed: [{ type: String }],
  created_at: { type: Date, default: Date.now },
  last_active: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Session', sessionSchema);
