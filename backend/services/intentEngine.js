/**
 * Intent Engine v2 — Advanced intent scoring from real session behavior
 * 
 * Improvements over v1:
 *  - Category affinity scoring (weighted by time + scroll depth per category)
 *  - Intent velocity tracking (how fast intent is changing)
 *  - Recency weighting (recent pages matter more)
 *  - Re-read detection (scroll direction reversals = careful analysis)
 *  - Session momentum (accelerating engagement = higher score)
 */

/**
 * Calculate category affinity map: category -> affinity score (0-1)
 * Based on time spent, scroll depth, and visit count per category
 */
function computeCategoryAffinity(pages) {
  const catStats = {};
  for (const page of pages) {
    const cat = page.category || 'other';
    if (!catStats[cat]) catStats[cat] = { time: 0, scrollSum: 0, visits: 0 };
    catStats[cat].time += (page.time_spent || 0);
    catStats[cat].scrollSum += (page.scroll_depth || 0);
    catStats[cat].visits += (page.visit_count || 1);
  }

  const affinity = {};
  const maxTime = Math.max(...Object.values(catStats).map(s => s.time), 1);

  for (const [cat, stats] of Object.entries(catStats)) {
    const timeWeight = stats.time / maxTime;
    const avgScroll = stats.visits > 0 ? stats.scrollSum / stats.visits : 0;
    const visitWeight = Math.min(stats.visits / 5, 1);
    affinity[cat] = Math.round((timeWeight * 0.5 + avgScroll * 0.3 + visitWeight * 0.2) * 100) / 100;
  }

  return affinity;
}

/**
 * Apply recency weighting: recent pages contribute more to the score
 * Uses exponential decay based on page position (last = most recent)
 */
function recencyWeightedPageTypeScore(pages) {
  if (pages.length === 0) return 0;

  const typeWeights = { blog: 0.2, other: 0.2, landing: 0.3, comparison: 0.7, product: 0.9 };
  let weightedSum = 0;
  let totalWeight = 0;

  for (let i = 0; i < pages.length; i++) {
    // Exponential recency: most recent page gets weight ~1.0, oldest gets ~0.3
    const recency = 0.3 + 0.7 * (i / Math.max(pages.length - 1, 1));
    const typeScore = typeWeights[pages[i].page_type] || 0.2;
    weightedSum += typeScore * recency;
    totalWeight += recency;
  }

  return totalWeight > 0 ? Math.min(weightedSum / totalWeight, 1) : 0;
}

function calculateIntentScore(session) {
  const pages = session.pages_visited || [];
  
  // ── Signal 1: Pages visited (0-1) ──
  const pagesScore = Math.min(pages.length, 15) / 15;

  // ── Signal 2: Time spent (0-1), with diminishing returns ──
  const totalTime = session.total_time_spent || 0;
  const timeScore = 1 - Math.exp(-totalTime / 180); // ~63% at 3min, ~86% at 6min

  // ── Signal 3: Scroll depth (weighted by recency) ──
  const scrollScore = Math.min(session.avg_scroll_depth || 0, 1);
  const maxScrollBonus = (session.max_scroll_depth || 0) > 0.9 ? 0.1 : 0; // bonus for reading to bottom

  // ── Signal 4: Page type scoring (recency-weighted) ──
  const pageTypeScore = recencyWeightedPageTypeScore(pages);

  // ── Signal 5: Comparison + product signals ──
  const comparisonScore = Math.min(
    ((session.comparison_count || 0) * 0.6 + (session.product_views || 0) * 0.4),
    5
  ) / 5;

  // ── Signal 6: Engagement (hovers, clicks, interaction depth) ──
  const hoverScore = Math.min((session.total_hovers || 0) / 15, 1);
  const clickScore = Math.min((session.total_clicks || 0) / 8, 1);
  const interactionScore = Math.min(session.interaction_depth || 0, 1);
  const engagementScore = (hoverScore * 0.25 + clickScore * 0.4 + interactionScore * 0.35);

  // ── Signal 7: Re-read behavior (scroll reversals = careful analysis) ──
  const rereadScore = Math.min(session.reread_score || 0, 1);

  // ── Signal 8: Category focus (concentrated browsing = clearer intent) ──
  const catAffinity = session.category_affinity instanceof Map 
    ? Object.fromEntries(session.category_affinity) 
    : (session.category_affinity || {});
  const affinityValues = Object.values(catAffinity);
  const maxAffinity = affinityValues.length > 0 ? Math.max(...affinityValues) : 0;
  // High affinity to one category = focused browsing = higher intent
  const focusScore = maxAffinity;

  // ── Weighted combination ──
  const weights = {
    pages: 0.10,
    time: 0.12,
    scroll: 0.10,
    pageTypes: 0.18,
    comparison: 0.12,
    engagement: 0.20,
    reread: 0.08,
    focus: 0.10,
  };

  let intentScore =
    weights.pages * pagesScore +
    weights.time * timeScore +
    weights.scroll * (scrollScore + maxScrollBonus) +
    weights.pageTypes * pageTypeScore +
    weights.comparison * comparisonScore +
    weights.engagement * engagementScore +
    weights.reread * rereadScore +
    weights.focus * focusScore;

  return Math.round(Math.min(Math.max(intentScore, 0), 1) * 100) / 100;
}

function determineIntentStage(score, session) {
  // Use both score AND behavioral signals for stage determination
  const hasComparisons = (session.comparison_count || 0) >= 2;
  const hasProducts = (session.product_views || 0) >= 2;
  const highEngagement = (session.interaction_depth || 0) > 0.6;

  // Override: if user is actively comparing products, bump to 'comparison shopper' even with lower score
  if (hasComparisons && score >= 0.35) return 'comparison shopper';
  if (hasProducts && highEngagement && score >= 0.45) return 'potential buyer';

  if (score >= 0.70) return 'potential buyer';
  if (score >= 0.45) return 'comparison shopper';
  if (score >= 0.20) return 'exploring';
  return 'browsing';
}

function detectPageType(url, title) {
  const text = `${url} ${title}`.toLowerCase();
  if (text.includes('compare') || text.includes('vs') || text.includes('versus') || text.includes('best') || text.includes('top')) {
    return 'comparison';
  }
  if (text.includes('product') || text.includes('buy') || text.includes('price') || text.includes('deal') || text.includes('shop') || text.includes('review')) {
    return 'product';
  }
  if (text.includes('blog') || text.includes('article') || text.includes('post') || text.includes('news') || text.includes('guide') || text.includes('how')) {
    return 'blog';
  }
  if (text.includes('landing') || text.includes('home') || text.includes('welcome')) {
    return 'landing';
  }
  return 'other';
}

function processSessionUpdate(existingSession, newData) {
  // Store previous intent score for velocity calculation
  existingSession.prev_intent_score = existingSession.intent_score || 0;

  // Merge new page visit
  if (newData.url) {
    const pageType = detectPageType(newData.url, newData.title || '');
    const existingPage = existingSession.pages_visited.find(p => p.url === newData.url);

    if (existingPage) {
      existingPage.time_spent = Math.max(existingPage.time_spent || 0, newData.time_spent || 0);
      existingPage.scroll_depth = Math.max(existingPage.scroll_depth || 0, newData.scroll_depth || 0);
      existingPage.visit_count = (existingPage.visit_count || 1) + 1;
    } else {
      existingSession.pages_visited.push({
        url: newData.url,
        title: newData.title || '',
        category: newData.category || '',
        page_type: pageType,
        time_spent: newData.time_spent || 0,
        scroll_depth: newData.scroll_depth || 0,
        visit_count: 1,
        timestamp: new Date(),
      });

      if (pageType === 'comparison') existingSession.comparison_count = (existingSession.comparison_count || 0) + 1;
      if (pageType === 'product') existingSession.product_views = (existingSession.product_views || 0) + 1;
    }

    // Update category tracking
    if (newData.category && !existingSession.categories_viewed.includes(newData.category)) {
      existingSession.categories_viewed.push(newData.category);
    }

    // Accumulate article tags for keyword matching
    if (newData.tags && newData.tags.length > 0) {
      const existingTags = existingSession.tags_viewed || [];
      for (const tag of newData.tags) {
        if (!existingTags.includes(tag)) {
          existingTags.push(tag);
        }
      }
      existingSession.tags_viewed = existingTags;
    }
  }

  // Update aggregate stats
  existingSession.total_time_spent = existingSession.pages_visited.reduce((sum, p) => sum + (p.time_spent || 0), 0);
  existingSession.total_clicks = (existingSession.total_clicks || 0) + (newData.clicks || 0);
  existingSession.total_hovers = (existingSession.total_hovers || 0) + (newData.hover_count || 0);
  existingSession.interaction_depth = Math.max(existingSession.interaction_depth || 0, newData.interaction_depth || 0);
  existingSession.reread_score = Math.max(existingSession.reread_score || 0, newData.reread_score || 0);

  const scrollDepths = existingSession.pages_visited.map(p => p.scroll_depth || 0);
  existingSession.avg_scroll_depth = scrollDepths.length > 0
    ? scrollDepths.reduce((a, b) => a + b, 0) / scrollDepths.length
    : 0;
  existingSession.max_scroll_depth = scrollDepths.length > 0
    ? Math.max(...scrollDepths)
    : 0;

  // Compute category affinity
  const affinity = computeCategoryAffinity(existingSession.pages_visited);
  existingSession.category_affinity = affinity;

  // Recalculate intent
  existingSession.intent_score = calculateIntentScore(existingSession);
  existingSession.intent_stage = determineIntentStage(existingSession.intent_score, existingSession);

  // Calculate intent velocity (rate of change)
  const scoreDelta = existingSession.intent_score - existingSession.prev_intent_score;
  existingSession.intent_velocity = Math.round(scoreDelta * 100) / 100;

  existingSession.last_active = new Date();

  return existingSession;
}

module.exports = {
  calculateIntentScore,
  determineIntentStage,
  detectPageType,
  processSessionUpdate,
  computeCategoryAffinity,
};
