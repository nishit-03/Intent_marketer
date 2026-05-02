/**
 * Feedback Loop — records impressions and clicks, aggregates metrics
 */

const Interaction = require('../models/Interaction');
const AdMetric = require('../models/AdMetric');

async function recordImpression(sessionId, adId, sessionFeatures, adFeatures, relevanceScore) {
  try {
    await Interaction.create({
      session_id: sessionId,
      ad_id: adId,
      event_type: 'impression',
      session_features: sessionFeatures,
      ad_features: adFeatures,
      clicked: false,
      relevance_score: relevanceScore,
    });

    // Update daily metric
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await AdMetric.findOneAndUpdate(
      { ad_id: adId, date: today },
      {
        $inc: { impressions: 1 },
        $setOnInsert: { ad_id: adId, date: today },
      },
      { upsert: true, new: true }
    ).then(doc => {
      doc.ctr = doc.impressions > 0 ? doc.clicks / doc.impressions : 0;
      return doc.save();
    });

    return true;
  } catch (error) {
    console.error('Error recording impression:', error.message);
    return false;
  }
}

async function recordClick(sessionId, adId, intentStage) {
  try {
    // Update the most recent impression to clicked
    await Interaction.findOneAndUpdate(
      { session_id: sessionId, ad_id: adId, event_type: 'impression' },
      { clicked: true },
      { sort: { timestamp: -1 } }
    );

    // Also create a click event
    await Interaction.create({
      session_id: sessionId,
      ad_id: adId,
      event_type: 'click',
      clicked: true,
    });

    // Update daily metric
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const metric = await AdMetric.findOneAndUpdate(
      { ad_id: adId, date: today },
      {
        $inc: {
          clicks: 1,
          [`intent_stages.${(intentStage || 'browsing').replace(' ', '_')}`]: 1,
        },
        $setOnInsert: { ad_id: adId, date: today },
      },
      { upsert: true, new: true }
    );

    metric.ctr = metric.impressions > 0 ? metric.clicks / metric.impressions : 0;
    await metric.save();

    return true;
  } catch (error) {
    console.error('Error recording click:', error.message);
    return false;
  }
}

module.exports = { recordImpression, recordClick };
