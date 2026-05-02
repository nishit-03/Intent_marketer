const mongoose = require('mongoose');

const adMetricSchema = new mongoose.Schema({
  ad_id: {
    type: String,
    required: true,
    index: true,
  },
  date: {
    type: Date,
    required: true,
  },
  impressions: {
    type: Number,
    default: 0,
  },
  clicks: {
    type: Number,
    default: 0,
  },
  ctr: {
    type: Number,
    default: 0,
  },
  intent_stages: {
    browsing: { type: Number, default: 0 },
    exploring: { type: Number, default: 0 },
    comparison_shopper: { type: Number, default: 0 },
    potential_buyer: { type: Number, default: 0 },
  },
});

adMetricSchema.index({ ad_id: 1, date: 1 }, { unique: true });

adMetricSchema.pre('save', function (next) {
  this.ctr = this.impressions > 0 ? (this.clicks / this.impressions) : 0;
  next();
});

module.exports = mongoose.model('AdMetric', adMetricSchema);
