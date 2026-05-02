const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
  ad_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  image_url: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    required: true,
    enum: ['tech', 'finance', 'travel', 'health', 'education', 'ecommerce', 'other'],
  },
  advertiser_name: {
    type: String,
    default: 'Anonymous Advertiser',
  },
  cta_text: {
    type: String,
    default: 'Learn More',
  },
  cta_url: {
    type: String,
    default: '#',
  },
  advertiser_id: {
    type: String,
    default: '',
    index: true,
  },
  extracted_features: {
    product: { type: String, default: '' },
    category: { type: String, default: '' },
    brand: { type: String, default: '' },
    price_range: { type: String, default: '' },
    attributes: [{ type: String }],
    target_intent: {
      type: String,
      enum: ['browsing', 'exploring', 'comparing', 'buying', 'comparison shopper', 'potential buyer', ''],
      default: '',
    },
    keywords: [{ type: String }],
    summary: { type: String, default: '' },
  },
  status: {
    type: String,
    enum: ['processing', 'active', 'paused', 'failed'],
    default: 'processing',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

adSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('Ad', adSchema);
