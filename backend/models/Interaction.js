const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
  session_id: {
    type: String,
    required: true,
    index: true,
  },
  ad_id: {
    type: String,
    required: true,
    index: true,
  },
  event_type: {
    type: String,
    enum: ['impression', 'click'],
    required: true,
  },
  session_features: {
    pages_visited: Number,
    time_spent: Number,
    intent_score: Number,
    intent_stage: String,
    intent_velocity: Number,
    comparison_count: Number,
    product_views: Number,
    scroll_depth: Number,
    max_scroll_depth: Number,
    reread_score: Number,
    engagement_depth: Number,
    hover_rate: Number,
    category_affinity: { type: Map, of: Number },
    categories_viewed: [String],
    tags_viewed: [String],
    publisher_id: String,
  },
  ad_features: {
    category: String,
    target_intent: String,
    keywords: [String],
    brand: String,
    price_range: String,
  },
  clicked: {
    type: Boolean,
    default: false,
  },
  relevance_score: {
    type: Number,
    default: 0,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Interaction', interactionSchema);
