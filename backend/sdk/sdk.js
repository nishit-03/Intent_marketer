/**
 * IntentMarketer Publisher SDK v1.0
 * Privacy-First Ad Intelligence
 *
 * Usage:
 *   <script src="http://localhost:5000/sdk.js" data-api="http://localhost:5000" async></script>
 *   <div id="ad-slot"></div>
 *
 * Debug mode:
 *   window.AD_DEBUG = true;
 */
(function () {
  'use strict';

  const SDK_VERSION = '1.0.0';
  const TRACK_INTERVAL = 5000; // 5 seconds
  const AD_REFRESH_INTERVAL = 15000; // 15 seconds

  // Detect API base URL from script tag
  const scriptTag = document.currentScript || document.querySelector('script[data-api]');
  const API_BASE = (scriptTag && scriptTag.getAttribute('data-api')) || 'http://localhost:5000';

  function log(...args) {
    if (window.AD_DEBUG) {
      console.log('%c[IntentMarketer SDK]', 'color: #22c55e; font-weight: bold;', ...args);
    }
  }

  // Generate anonymous session ID (pure random, no fingerprinting)
  function getSessionId() {
    let sid = sessionStorage.getItem('im_session_id');
    if (!sid) {
      sid = 'ses_' + crypto.randomUUID();
      sessionStorage.setItem('im_session_id', sid);
    }
    return sid;
  }

  // Session tracking state
  const state = {
    sessionId: getSessionId(),
    pageLoadTime: Date.now(),
    scrollDepth: 0,
    clicks: 0,
    lastTrackTime: 0,
    currentAds: [],
  };

  log('Initialized', { sessionId: state.sessionId, apiBase: API_BASE });

  // Track scroll depth
  let maxScroll = 0;
  window.addEventListener('scroll', function () {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight > 0) {
      maxScroll = Math.max(maxScroll, window.scrollY / scrollHeight);
      state.scrollDepth = Math.round(maxScroll * 100) / 100;
    }
  }, { passive: true });

  // Track clicks
  document.addEventListener('click', function () {
    state.clicks++;
  });

  // Detect page category from meta tags or content
  function detectCategory() {
    const meta = document.querySelector('meta[name="category"]');
    if (meta) return meta.content;

    const text = (document.title + ' ' + window.location.pathname).toLowerCase();
    const categories = {
      tech: ['tech', 'software', 'app', 'computer', 'code', 'developer', 'programming', 'ai', 'gadget'],
      finance: ['finance', 'money', 'invest', 'bank', 'stock', 'crypto', 'trading', 'budget'],
      travel: ['travel', 'trip', 'hotel', 'flight', 'vacation', 'destination', 'tour'],
      health: ['health', 'fitness', 'wellness', 'medical', 'diet', 'nutrition'],
      education: ['education', 'course', 'learn', 'tutorial', 'study', 'training'],
    };

    for (const [cat, words] of Object.entries(categories)) {
      if (words.some(w => text.includes(w))) return cat;
    }
    return 'other';
  }

  // Send tracking data
  async function sendTrackingData() {
    const timeSpent = Math.round((Date.now() - state.pageLoadTime) / 1000);

    const data = {
      session_id: state.sessionId,
      url: window.location.href,
      title: document.title,
      category: detectCategory(),
      time_spent: timeSpent,
      clicks: state.clicks,
      scroll_depth: state.scrollDepth,
    };

    try {
      const res = await fetch(`${API_BASE}/api/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      log('Tracked:', data, 'Intent:', result.intent);

      // Dispatch custom event for frontend integration
      window.dispatchEvent(new CustomEvent('im:intent-update', { detail: result.intent }));

      return result;
    } catch (err) {
      log('Track error:', err.message);
    }
  }

  // Fetch and render ads
  async function fetchAds() {
    try {
      const res = await fetch(`${API_BASE}/api/ads/serve?session_id=${state.sessionId}`);
      const result = await res.json();

      if (result.ads && result.ads.length > 0) {
        state.currentAds = result.ads;
        renderAds(result.ads);
        log('Ads served:', result.ads.length, 'Intent:', result.intent);

        // Dispatch custom event with ad data
        window.dispatchEvent(new CustomEvent('im:ads-update', {
          detail: { ads: result.ads, intent: result.intent },
        }));
      }
    } catch (err) {
      log('Ad fetch error:', err.message);
    }
  }

  // Render ads into ad-slot
  function renderAds(ads) {
    const slot = document.getElementById('ad-slot');
    if (!slot) return;

    slot.innerHTML = ads.map((ad, i) => `
      <div class="im-ad-card ${ad.is_best_match ? 'im-ad-best' : ''}"
           data-ad-id="${ad.ad_id}"
           style="
             border: 1px solid ${ad.is_best_match ? '#22c55e' : '#e5e7eb'};
             border-radius: 12px;
             padding: 16px;
             margin-bottom: 12px;
             background: ${ad.is_best_match ? 'linear-gradient(135deg, #f0fdf4, #ffffff)' : '#ffffff'};
             font-family: 'Inter', system-ui, sans-serif;
             transition: all 0.2s ease;
             cursor: pointer;
             position: relative;
             overflow: hidden;
           "
           onmouseover="this.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'"
           onmouseout="this.style.boxShadow='none'"
      >
        ${ad.is_best_match ? '<div style="position:absolute;top:0;right:0;background:#22c55e;color:white;font-size:10px;padding:2px 8px;border-radius:0 12px 0 8px;font-weight:600;">BEST MATCH</div>' : ''}
        ${ad.image_url ? `<img src="${ad.image_url}" alt="${ad.title}" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />` : ''}
        <div style="font-size:14px;font-weight:600;color:#111;margin-bottom:4px;">${ad.title}</div>
        <div style="font-size:12px;color:#6b7280;margin-bottom:8px;line-height:1.4;">${ad.description?.substring(0, 100)}...</div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:10px;color:#22c55e;font-weight:600;text-transform:uppercase;">${ad.category}</span>
          <span style="font-size:10px;color:#9ca3af;">Score: ${(ad.relevance_score * 100).toFixed(0)}%</span>
        </div>
        <div style="font-size:10px;color:#9ca3af;margin-top:6px;border-top:1px solid #f3f4f6;padding-top:6px;">
          ℹ️ ${ad.explanation?.reasons?.[0] || 'Recommended for you'}
        </div>
        <div style="text-align:center;margin-top:8px;">
          <a href="${ad.cta_url || '#'}" 
             style="display:inline-block;padding:6px 16px;background:#111;color:#fff;border-radius:6px;font-size:12px;text-decoration:none;font-weight:500;"
             onclick="window.__imClickAd && window.__imClickAd('${ad.ad_id}')"
          >${ad.cta_text || 'Learn More'}</a>
        </div>
        <div style="text-align:center;margin-top:4px;">
          <span style="font-size:9px;color:#d1d5db;">Ad · IntentMarketer</span>
        </div>
      </div>
    `).join('');

    // Setup click tracking
    slot.querySelectorAll('.im-ad-card').forEach(card => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            log('Impression tracked:', card.dataset.adId);
            observer.unobserve(card);
          }
        });
      }, { threshold: 0.5 });
      observer.observe(card);

      card.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') return; // Let CTA handle its own click
        trackClick(card.dataset.adId);
      });
    });
  }

  // Track ad click
  window.__imClickAd = function (adId) {
    trackClick(adId);
  };

  async function trackClick(adId) {
    log('Click tracked:', adId);
    try {
      await fetch(`${API_BASE}/api/ads/${adId}/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: state.sessionId,
          intent_stage: 'browsing',
        }),
      });
    } catch (err) {
      log('Click tracking error:', err.message);
    }
  }

  // Public API
  window.IntentMarketer = {
    getSessionId: () => state.sessionId,
    getCurrentAds: () => state.currentAds,
    refreshAds: fetchAds,
    getState: () => ({ ...state }),
    version: SDK_VERSION,
  };

  // Start tracking loop
  setInterval(sendTrackingData, TRACK_INTERVAL);
  sendTrackingData(); // Initial track

  // Start ad refresh loop
  setTimeout(fetchAds, 1000); // Initial fetch (slight delay for tracking to settle)
  setInterval(fetchAds, AD_REFRESH_INTERVAL);

  log('SDK v' + SDK_VERSION + ' ready');
})();
