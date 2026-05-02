/**
 * Ad Ranker v2 — Enhanced hybrid ranking engine
 * 
 * Phase 1: Contextual filtering (category affinity + keyword + intent alignment)
 * Phase 2: ML scoring (click probability prediction with richer features)
 * Phase 3: Statistical adjustments (CTR history, fatigue, velocity boost, exploration)
 */

const fs = require('fs');
const path = require('path');
const Interaction = require('../models/Interaction');
const AdMetric = require('../models/AdMetric');

let modelWeights = null;

function loadModel() {
  try {
    const modelPath = path.join(__dirname, '..', 'ml', 'model.json');
    if (fs.existsSync(modelPath)) {
      modelWeights = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
      console.log('✅ ML model loaded successfully');
      return true;
    }
  } catch (error) {
    console.warn('⚠️  ML model not found, using heuristic ranking');
  }
  return false;
}

/**
 * Phase 1: Contextual filtering using session behavior + ad features
 */
function filterAds(ads, session) {
  const sessionCategories = session.categories_viewed || [];
  const sessionPageTypes = (session.pages_visited || []).map(p => p.page_type);
  const intentScore = session.intent_score || 0;
  const intentStage = session.intent_stage || 'browsing';
  const currentCategory = session._currentCategory || sessionCategories[sessionCategories.length - 1] || '';

  // Get category affinity map
  const catAffinity = session.category_affinity instanceof Map
    ? Object.fromEntries(session.category_affinity)
    : (session.category_affinity || {});

  // Build page text for keyword matching (recency-weighted: last 5 pages matter most)
  const recentPages = (session.pages_visited || []).slice(-5);
  const allPages = session.pages_visited || [];
  const recentText = recentPages.map(p => `${(p.title || '')} ${(p.url || '')}`).join(' ').toLowerCase();
  const allText = allPages.map(p => `${(p.title || '')} ${(p.url || '')}`).join(' ').toLowerCase();

  // Accumulated article tags
  const sessionTags = (session.tags_viewed || []).map(t => t.toLowerCase());

  return ads
    .filter(ad => ad.status === 'active')
    .map(ad => {
      let relevance = 0;
      const reasons = [];
      const features = ad.extracted_features || {};
      const adCategory = features.category || ad.category;

      // ── CURRENT CATEGORY BOOST (strongest signal) ──
      const isCurrentCategory = adCategory === currentCategory;
      if (isCurrentCategory) {
        relevance += 0.50;
        reasons.push(`Active category match: ${adCategory}`);
      }

      // ── Historical category affinity (weaker for non-current categories) ──
      const affinity = catAffinity[adCategory] || 0;
      if (!isCurrentCategory && affinity > 0) {
        // Historical categories get a small boost, but much less than current
        relevance += Math.min(affinity * 0.15, 0.12);
        reasons.push(`Past affinity: ${adCategory} (${(affinity * 100).toFixed(0)}%)`);
      } else if (isCurrentCategory && affinity > 0) {
        // Current category + high affinity = even stronger
        relevance += affinity * 0.10;
        reasons.push(`Category affinity: ${(affinity * 100).toFixed(0)}%`);
      }

      // ── Cross-category discovery (only at very high intent, small bonus) ──
      if (!sessionCategories.includes(adCategory) && intentScore >= 0.6) {
        const crossBonus = 0.03;
        relevance += crossBonus;
        reasons.push(`Cross-category (high intent: ${intentScore.toFixed(2)})`);
      }

      // ── Intent stage alignment ──
      const adTargetIntent = features.target_intent || 'browsing';
      const stageOrder = ['browsing', 'exploring', 'comparing', 'buying'];
      const sessionStageIdx = stageOrder.indexOf(intentStage);
      const adStageIdx = stageOrder.indexOf(adTargetIntent);

      if (intentStage === adTargetIntent) {
        relevance += 0.20;
        reasons.push(`Exact intent match: ${intentStage}`);
      } else if (sessionStageIdx >= adStageIdx) {
        relevance += 0.08;
        reasons.push(`Intent aligned: user ${intentStage}, ad targets ${adTargetIntent}`);
      }

      // ── Keyword matching (stemmed: 'investing' matches 'invest') ──
      const keywords = features.keywords || [];

      const stemMatch = (kw, text) => {
        const kwLower = kw.toLowerCase();
        if (text.includes(kwLower)) return true;
        // Stem matching: check if keyword is a prefix of any word in text (3+ chars)
        if (kwLower.length >= 3) {
          const words = text.split(/\s+/);
          return words.some(w => w.startsWith(kwLower) || kwLower.startsWith(w.slice(0, 3)));
        }
        return false;
      };

      const tagStemMatch = (kw) => {
        const kwLower = kw.toLowerCase();
        return sessionTags.some(tag =>
          tag === kwLower ||
          tag.startsWith(kwLower) ||
          kwLower.startsWith(tag) ||
          (tag.length >= 4 && kwLower.length >= 4 && (tag.startsWith(kwLower.slice(0, 4)) || kwLower.startsWith(tag.slice(0, 4))))
        );
      };

      const recentMatches = keywords.filter(kw => stemMatch(kw, recentText));
      const allMatches = keywords.filter(kw => stemMatch(kw, allText));
      const tagMatches = keywords.filter(kw => tagStemMatch(kw));

      const uniqueMatches = [...new Set([...recentMatches, ...allMatches, ...tagMatches])];

      if (uniqueMatches.length > 0) {
        const tagBonus = tagMatches.length * 0.08;
        const recentBonus = recentMatches.length * 0.05;
        const totalBonus = allMatches.length * 0.02;
        relevance += Math.min(tagBonus + recentBonus + totalBonus, 0.35);
        reasons.push(`Keywords: ${uniqueMatches.slice(0, 4).join(', ')}${uniqueMatches.length > 4 ? ` +${uniqueMatches.length - 4}` : ''}`);
      }

      // ── Page type alignment ──
      if (sessionPageTypes.includes('product') && adTargetIntent === 'buying') {
        relevance += 0.06;
        reasons.push('User on product pages');
      }
      if (sessionPageTypes.includes('comparison') && (adTargetIntent === 'comparing' || adTargetIntent === 'buying')) {
        relevance += 0.06;
        reasons.push('User comparing products');
      }

      // ── Re-read bonus ──
      if ((session.reread_score || 0) > 0.3 && isCurrentCategory) {
        relevance += 0.05;
        reasons.push('Deep reading detected');
      }

      return { ad, relevance: Math.round(relevance * 100) / 100, reasons, matchedKeywords: uniqueMatches };
    })
    .filter(item => item.relevance > 0.05)
    .sort((a, b) => b.relevance - a.relevance);
}

/**
 * Phase 2: ML-based ranking with enriched feature vector
 */
function mlRank(filteredAds, session) {
  if (!modelWeights) loadModel();

  return filteredAds.map(item => {
    const features = buildFeatureVector(session, item.ad);

    // Pass keyword match count so heuristic can differentiate within-category
    features._keywordMatchCount = (item.matchedKeywords || []).length;

    let mlScore;

    if (modelWeights) {
      mlScore = predictClickProbability(features);
    } else {
      mlScore = heuristicScore(features);
    }

    // Contextual relevance (keywords, tags, category) should DOMINATE over ML
    // because the ML model can't differentiate within-category ads
    const keywordBoost = Math.min((item.matchedKeywords || []).length * 0.03, 0.15);
    const finalScore = 0.60 * item.relevance + 0.25 * mlScore + 0.15 * heuristicScore(features) + keywordBoost;

    return {
      ...item,
      mlScore: Math.round(mlScore * 100) / 100,
      finalScore: Math.round(finalScore * 100) / 100,
    };
  });
}

/**
 * Build enriched feature vector for ML model
 */
function buildFeatureVector(session, ad) {
  const features = ad.extracted_features || {};
  const adCategory = features.category || ad.category;

  const catAffinity = session.category_affinity instanceof Map
    ? Object.fromEntries(session.category_affinity)
    : (session.category_affinity || {});
  const affinity = catAffinity[adCategory] || 0;

  return {
    pages_visited: Math.min((session.pages_visited || []).length, 20),
    time_spent: Math.min(session.total_time_spent || 0, 600),
    scroll_depth: session.avg_scroll_depth || 0,
    category_match: affinity > 0 ? 1 : 0,
    intent_score: session.intent_score || 0,
    comparison_count: Math.min(session.comparison_count || 0, 10),
    product_views: Math.min(session.product_views || 0, 10),
    intent_velocity: session.intent_velocity || 0,
    reread_score: session.reread_score || 0,
    engagement_depth: session.interaction_depth || 0,
    hover_rate: (session.total_hovers || 0) / Math.max((session.pages_visited || []).length, 1),
    max_scroll_depth: session.max_scroll_depth || 0,
    category_affinity_strength: affinity,
  };
}

function predictClickProbability(features) {
  if (!modelWeights || !modelWeights.coefficients) return heuristicScore(features);

  const coefs = modelWeights.coefficients;
  const intercept = modelWeights.intercept || 0;
  const featureNames = modelWeights.feature_names || [];
  const scaler = modelWeights.scaler || null;

  let z = intercept;
  for (let i = 0; i < featureNames.length; i++) {
    let val = features[featureNames[i]] || 0;
    if (scaler && scaler.mean && scaler.scale) {
      val = (val - (scaler.mean[i] || 0)) / (scaler.scale[i] || 1);
    }
    z += (coefs[i] || 0) * val;
  }

  return 1 / (1 + Math.exp(-z));
}

/**
 * Enhanced heuristic scoring with all session signals
 */
function heuristicScore(features) {
  let score = 0.08;
  score += (features.category_affinity_strength || features.category_match) * 0.20;
  score += features.intent_score * 0.22;
  score += Math.min(features.pages_visited / 10, 1) * 0.08;
  score += Math.min(features.time_spent / 300, 1) * 0.10;
  score += Math.min(features.comparison_count / 3, 1) * 0.12;
  score += features.scroll_depth * 0.08;
  score += (features.reread_score || 0) * 0.06;
  score += Math.min((features.hover_rate || 0) / 5, 1) * 0.06;
  score += (features.engagement_depth || 0) * 0.08;
  return Math.min(score, 1);
}

/**
 * Main ranking function with statistical adjustments
 */
async function rankAds(ads, session, topN = 3) {
  // Phase 1: Contextual filtering
  let filtered = filterAds(ads, session);

  if (filtered.length === 0) {
    filtered = ads
      .filter(ad => ad.status === 'active')
      .map(ad => ({
        ad,
        relevance: 0.1,
        reasons: ['General audience ad'],
        matchedKeywords: [],
      }));
  }

  // Phase 2: ML-based ranking
  const ranked = mlRank(filtered, session);

  // Phase 3: Statistical adjustments
  const sessionId = session.session_id;
  const MAX_IMPRESSIONS_PER_AD = 3; // Hard frequency cap — forces rotation

  // 3a. Fetch impression counts for fatigue + frequency capping
  let impressionCounts = {};
  if (sessionId) {
    try {
      const impressions = await Interaction.find({
        session_id: sessionId,
        event_type: 'impression',
      }).select('ad_id');
      for (const imp of impressions) {
        impressionCounts[imp.ad_id] = (impressionCounts[imp.ad_id] || 0) + 1;
      }
    } catch (e) { /* silent */ }
  }

  // Hard frequency cap: remove ads shown too many times
  const cappedRanked = ranked.filter(item => {
    const seen = impressionCounts[item.ad.ad_id] || 0;
    if (seen >= MAX_IMPRESSIONS_PER_AD) {
      return false; // completely exclude
    }
    return true;
  });

  // Fall back to full list if everything is capped
  const finalPool = cappedRanked.length > 0 ? cappedRanked : ranked;

  // 3b. Fetch historical CTR for each ad (last 7 days)
  let ctrMap = {};
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const metrics = await AdMetric.find({ date: { $gte: sevenDaysAgo } });
    const adStats = {};
    for (const m of metrics) {
      if (!adStats[m.ad_id]) adStats[m.ad_id] = { impressions: 0, clicks: 0 };
      adStats[m.ad_id].impressions += m.impressions || 0;
      adStats[m.ad_id].clicks += m.clicks || 0;
    }
    for (const [adId, stats] of Object.entries(adStats)) {
      ctrMap[adId] = stats.impressions > 10 ? stats.clicks / stats.impressions : 0;
    }
  } catch (e) { /* silent */ }

  // 3c. Apply adjustments to each ad
  const intentVelocity = session.intent_velocity || 0;

  for (const item of finalPool) {
    const adId = item.ad.ad_id;

    // Impression fatigue penalty (aggressive: forces rotation)
    const seen = impressionCounts[adId] || 0;
    if (seen > 0) {
      const fatiguePenalty = Math.min(seen * 0.08, 0.30);
      item.finalScore -= fatiguePenalty;
      item.reasons.push(`Fatigue: ${seen}/${MAX_IMPRESSIONS_PER_AD} (-${fatiguePenalty.toFixed(2)})`);
    }

    // Historical CTR boost (ads that perform well get a small boost)
    const ctr = ctrMap[adId] || 0;
    if (ctr > 0.02) {
      const ctrBoost = Math.min(ctr * 2, 0.15);
      item.finalScore += ctrBoost;
      item.reasons.push(`CTR boost: ${(ctr * 100).toFixed(1)}% (+${ctrBoost.toFixed(2)})`);
    }

    // Intent velocity boost (rapidly increasing intent = show more action-oriented ads)
    if (intentVelocity > 0.05) {
      const adTarget = item.ad.extracted_features?.target_intent || 'browsing';
      if (adTarget === 'buying' || adTarget === 'comparing') {
        const velocityBoost = Math.min(intentVelocity * 0.5, 0.10);
        item.finalScore += velocityBoost;
        item.reasons.push(`Velocity boost (+${velocityBoost.toFixed(2)})`);
      }
    }

    // Exploration noise (±5% — enough to shake up rankings)
    item.finalScore += (Math.random() * 0.10 - 0.05);
    item.finalScore = Math.round(Math.max(item.finalScore, 0.01) * 100) / 100;
  }

  // Sort and return top N
  finalPool.sort((a, b) => b.finalScore - a.finalScore);

  return finalPool.slice(0, topN).map((item, index) => ({
    rank: index + 1,
    ad_id: item.ad.ad_id,
    title: item.ad.title,
    description: item.ad.description,
    image_url: item.ad.image_url,
    category: item.ad.category,
    cta_text: item.ad.cta_text,
    cta_url: item.ad.cta_url,
    advertiser_name: item.ad.advertiser_name,
    relevance_score: item.finalScore,
    ml_score: item.mlScore,
    llm_relevance: item.relevance,
    explanation: {
      reasons: item.reasons,
      matched_keywords: item.matchedKeywords,
      intent_alignment: `Session: ${session.intent_stage} (score: ${session.intent_score}, velocity: ${session.intent_velocity || 0})`,
    },
    is_best_match: index === 0,
  }));
}

loadModel();

module.exports = { rankAds, loadModel, filterAds, buildFeatureVector };
