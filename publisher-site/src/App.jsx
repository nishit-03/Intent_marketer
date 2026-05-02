import { useState, useEffect, useCallback, useRef } from 'react';

const API = 'http://localhost:5000';

import { articles } from './data.js';

// ─── Ad Popup ───
function AdPopup({ ad, onClose }) {
  if (!ad) return null;

  const handleBuy = () => {
    const url = ad.cta_url && ad.cta_url !== '#' ? ad.cta_url : 'https://example.com/product';
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" style={{ animation: 'fadeIn 0.2s ease-out' }} />
      <div className="relative bg-white rounded-3xl max-w-[420px] w-full shadow-2xl overflow-hidden"
        style={{ animation: 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)' }}
        onClick={e => e.stopPropagation()}>

        {/* Image */}
        {ad.image_url && (
          <div className="relative">
            <img src={ad.image_url?.includes('1436491865332') ? 'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=400&h=250&fit=crop'.replace('1436491865332-7a61a109db05', '1437846972679-9e6e537be46e') : ad.image_url} alt={ad.title} className="w-full h-52 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <button onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-all text-sm">
              ✕
            </button>
            <div className="absolute bottom-3 left-3">
              <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md text-white rounded-full text-[10px] font-semibold uppercase tracking-wider">
                {ad.category}
              </span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">{ad.title}</h3>
          {ad.advertiser_name && (
            <p className="text-xs text-gray-400 mb-3">by {ad.advertiser_name}</p>
          )}
          <p className="text-sm text-gray-500 leading-relaxed mb-5">{ad.description}</p>

          {/* Why this ad */}
          {ad.explanation?.reasons?.length > 0 && (
            <div className="p-3.5 bg-gray-50 rounded-xl mb-5">
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Why this recommendation</p>
              {ad.explanation.reasons.slice(0, 2).map((r, i) => (
                <p key={i} className="text-xs text-gray-500 flex items-start gap-1.5 mt-0.5">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">&#x2713;</span> {r}
                </p>
              ))}
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex gap-3">
            <button onClick={handleBuy}
              className="flex-1 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-bold text-center hover:shadow-xl hover:shadow-green-200/50 transition-all active:scale-[0.98]">
              {ad.cta_text || 'Visit Website'} &rarr;
            </button>
            <button onClick={onClose}
              className="px-5 py-3.5 bg-gray-100 text-gray-500 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all">
              Maybe Later
            </button>
          </div>
          <p className="text-[8px] text-gray-300 text-center mt-4">IntentMarketer &middot; No personal data collected</p>
        </div>
      </div>
    </div>
  );
}

// ─── Behavior Tracker ───
class BehaviorTracker {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.scrollDepth = 0;
    this.maxScrollDepth = 0;
    this.hoverCount = 0;
    this.clickCount = 0;
    this.startTime = Date.now();
    this.currentUrl = '';
    this.currentTitle = '';
    this.currentCategory = '';
    this._flushTimer = null;
    this._scrollPositions = [];  // track scroll velocity
    this._lastScrollY = 0;

    this._scrollHandler = () => {
      const d = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
      this.scrollDepth = Math.max(this.scrollDepth, d);
      this.maxScrollDepth = Math.max(this.maxScrollDepth, d);
      // Track scroll direction changes (re-reading behavior = higher intent)
      this._scrollPositions.push({ y: window.scrollY, t: Date.now() });
      if (this._scrollPositions.length > 50) this._scrollPositions.shift();
    };
    window.addEventListener('scroll', this._scrollHandler, { passive: true });

    // Periodic flush every 3 seconds for real-time session updates
    this._flushTimer = setInterval(() => this.flush(), 3000);
  }

  startPage(url, title, category, tags) {
    if (this.currentUrl) this.flush();
    this.currentUrl = url;
    this.currentTitle = title || '';
    this.currentCategory = category;
    this.currentTags = tags || [];
    this.startTime = Date.now();
    this.scrollDepth = 0;
    this.hoverCount = 0;
    this.clickCount = 0;
    this._scrollPositions = [];
    this.flush(true);
  }

  trackHover() { this.hoverCount++; }
  trackClick() { this.clickCount++; }

  _computeScrollVelocity() {
    const pts = this._scrollPositions;
    if (pts.length < 2) return 0;
    let dirChanges = 0;
    for (let i = 2; i < pts.length; i++) {
      const d1 = pts[i-1].y - pts[i-2].y;
      const d2 = pts[i].y - pts[i-1].y;
      if ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) dirChanges++;
    }
    // Scroll direction changes indicate re-reading / careful analysis = higher intent
    return Math.min(dirChanges / 10, 1);
  }

  async flush(force = false) {
    const elapsed = (Date.now() - this.startTime) / 1000;
    if ((!force && elapsed < 1) || !this.currentUrl) return;

    const rereadScore = this._computeScrollVelocity();
    const depth = this.clickCount * 0.25 + this.hoverCount * 0.05 + this.scrollDepth * 0.3 + Math.min(elapsed / 120, 1) * 0.25 + rereadScore * 0.15;

    try {
      await fetch(`${API}/api/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: this.sessionId,
          url: this.currentUrl,
          title: this.currentTitle,
          category: this.currentCategory,
          tags: this.currentTags,
          time_spent: Math.round(elapsed),
          clicks: this.clickCount,
          scroll_depth: +this.scrollDepth.toFixed(2),
          hover_count: this.hoverCount,
          interaction_depth: +Math.min(depth, 1).toFixed(2),
          reread_score: +rereadScore.toFixed(2),
        }),
      });
    } catch (e) { /* silent */ }
  }

  destroy() {
    this.flush();
    window.removeEventListener('scroll', this._scrollHandler);
    if (this._flushTimer) clearInterval(this._flushTimer);
  }
}

// ─── Lazy Ad Component ───
function LazyAd({ ad, onClick, label, trackerRef }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '200px' });
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  if (!ad) return null;

  return (
    <div ref={ref} className="my-6 py-4 border-y border-gray-100"
      onMouseEnter={() => trackerRef.current?.trackHover?.()}>
      {isVisible ? (
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => onClick(ad)}>
          {ad.image_url && <img src={ad.image_url?.includes('1436491865332') ? 'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=400&h=250&fit=crop'.replace('1436491865332-7a61a109db05', '1437846972679-9e6e537be46e') : ad.image_url} alt="" className="w-24 h-[72px] rounded-xl object-cover flex-shrink-0 group-hover:shadow-md transition-shadow" />}
          <div className="flex-1 min-w-0">
            <p className="text-[9px] text-green-600 font-bold uppercase tracking-wider mb-0.5">{label}</p>
            <h4 className="text-sm font-semibold text-gray-900 group-hover:text-green-700 transition-colors leading-snug">{ad.title}</h4>
            <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{ad.description}</p>
          </div>
          <span className="text-gray-300 group-hover:text-green-500 transition-colors text-lg flex-shrink-0">&rsaquo;</span>
        </div>
      ) : (
        <div className="h-[72px] flex items-center justify-center bg-gray-50 rounded-xl animate-pulse">
          <span className="text-xs text-gray-300">Loading recommendation...</span>
        </div>
      )}
    </div>
  );
}

// ─── Main App ───
export default function App() {
  const [category, setCategory] = useState('tech');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [ads, setAds] = useState([]);
  const [popupAd, setPopupAd] = useState(null);
  const trackerRef = useRef(null);
  const browsedCategoriesRef = useRef(new Set(['tech']));
  const [sessionId] = useState(() => {
    let s = sessionStorage.getItem('im_sid');
    if (!s) { s = 'ses_' + Math.random().toString(36).slice(2, 12); sessionStorage.setItem('im_sid', s); }
    return s;
  });

  useEffect(() => {
    trackerRef.current = new BehaviorTracker(sessionId);
    trackerRef.current.startPage('/', 'Home', 'tech');
    loadAds('tech');
    return () => trackerRef.current?.destroy();
  }, []);

  const loadAds = useCallback(async (cat) => {
    try {
      if (cat) browsedCategoriesRef.current.add(cat);
      const allCats = [...browsedCategoriesRef.current].join(',');
      // Send current active category + all browsed categories so the ranker can prioritize correctly
      const res = await fetch(`${API}/api/ads/serve?session_id=${sessionId}&categories=${allCats}&current_category=${cat || 'tech'}&publisher_id=pub_demo_001`);
      const data = await res.json();
      if (data.ads) setAds(data.ads.slice(0, 3));
    } catch (e) { /* silent */ }
  }, [sessionId]);

  useEffect(() => {
    const i = setInterval(() => loadAds(category), 5000);
    return () => clearInterval(i);
  }, [loadAds, category]);

  function switchCategory(cat) {
    setCategory(cat);
    setSelectedArticle(null);
    browsedCategoriesRef.current.add(cat);
    trackerRef.current?.startPage(`/${cat}`, cat, cat);
    loadAds(cat);
  }

  function openArticle(article) {
    setSelectedArticle(article);
    trackerRef.current?.startPage(`/article/${article.id}`, article.title, category, article.tags);
    trackerRef.current?.trackClick();
    setTimeout(() => loadAds(category), 600);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function clickAd(ad) {
    setPopupAd(ad);
    trackerRef.current?.trackClick();
    try {
      await fetch(`${API}/api/ads/${ad.ad_id}/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, intent_stage: 'browsing' }),
      });
    } catch (e) { /* silent */ }
  }

  const currentArticles = articles[category] || [];
  const hero = currentArticles[0];
  const topRow = currentArticles.slice(1, 3);
  const bottomRow = currentArticles.slice(3);
  const sidebarAd = ads[0];
  const inlineAd = ads[1];
  const secondInlineAd = ads[2];

  return (
    <div className="min-h-screen" style={{ background: '#fafafa', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1120px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm">T</div>
            <span className="font-bold text-lg text-gray-900 tracking-tight">TopicDrill</span>
          </div>
          <nav className="flex items-center gap-1">
            {Object.keys(articles).map(cat => (
              <button key={cat} onClick={() => switchCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${category === cat ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </nav>
          <button className="px-5 py-2 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800">Subscribe</button>
        </div>
      </header>

      <div className="max-w-[1120px] mx-auto px-6 py-8">
        <div className="flex gap-10">
          {/* ── Main Content ── */}
          <div className="flex-1 min-w-0" style={{ animation: 'fadeIn 0.3s ease-out' }}>
            {selectedArticle ? (
              <article>
                <button onClick={() => { setSelectedArticle(null); loadAds(category); }}
                  className="text-sm text-gray-400 hover:text-gray-600 mb-5 inline-flex items-center gap-1 transition-colors">
                  &larr; Back to articles
                </button>
                <img src={selectedArticle.image} alt="" className="w-full h-80 object-cover rounded-2xl mb-6" />
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs capitalize">{category}</span>
                  <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-xs capitalize">{selectedArticle.type}</span>
                  <span className="text-xs text-gray-400">{selectedArticle.date} &middot; {selectedArticle.time} read</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-4">{selectedArticle.title}</h1>
                <p className="text-gray-600 text-lg leading-relaxed mb-6">{selectedArticle.excerpt}</p>
                <div className="text-gray-500 text-[15px] leading-[1.8] space-y-5">
                  {selectedArticle.content ? selectedArticle.content.map((section, index) => (
                    <div key={index}>
                      {index === 1 && inlineAd && (
                        <div className="my-6 py-4 border-y border-gray-100"
                          onMouseEnter={() => trackerRef.current?.trackHover()}>
                          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => clickAd(inlineAd)}>
                            {inlineAd.image_url && <img src={inlineAd.image_url?.includes('1436491865332') ? 'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=400&h=250&fit=crop'.replace('1436491865332-7a61a109db05', '1437846972679-9e6e537be46e') : inlineAd.image_url} alt="" className="w-24 h-[72px] rounded-xl object-cover flex-shrink-0 group-hover:shadow-md transition-shadow" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-[9px] text-green-600 font-bold uppercase tracking-wider mb-0.5">Recommended for you</p>
                              <h4 className="text-sm font-semibold text-gray-900 group-hover:text-green-700 transition-colors leading-snug">{inlineAd.title}</h4>
                              <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{inlineAd.description}</p>
                            </div>
                            <span className="text-gray-300 group-hover:text-green-500 transition-colors text-lg flex-shrink-0">&rsaquo;</span>
                          </div>
                        </div>
                      )}
                      
                      {index === 2 && secondInlineAd && (
                        <LazyAd ad={secondInlineAd} onClick={clickAd} label="You might also like" trackerRef={trackerRef} />
                      )}

                      {section.title && <h2 className="text-xl font-bold text-gray-900 mt-8 mb-2">{section.title}</h2>}
                      {section.paragraphs.map((p, i) => (
                        <p key={i} className="mb-5">{p}</p>
                      ))}
                    </div>
                  )) : (
                    <p>{selectedArticle.excerpt}</p>
                  )}
                </div>
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {(selectedArticle.tags || []).map(tag => <span key={tag} className="px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-xs">{tag}</span>)}
                  </div>
                </div>
              </article>
            ) : (
              <>
                {/* Hero */}
                {hero && (
                  <div className="mb-8 cursor-pointer group" onClick={() => openArticle(hero)}
                    onMouseEnter={() => trackerRef.current?.trackHover()}>
                    <div className="relative rounded-2xl overflow-hidden">
                      <img src={hero.image} alt="" className="w-full h-[400px] object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-8 left-8 right-8">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-sm text-white rounded-full text-[11px] capitalize">{category}</span>
                          <span className="px-2.5 py-0.5 bg-rose-500/80 text-white rounded-full text-[11px]">{hero.type}</span>
                          <span className="text-white/50 text-[11px]">{hero.date} &middot; {hero.time} read</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2 leading-tight">{hero.title}</h2>
                        <p className="text-sm text-white/70 max-w-xl">{hero.excerpt}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Top row */}
                <div className="grid grid-cols-2 gap-7 mb-7">
                  {topRow.map(a => (
                    <div key={a.id} className="cursor-pointer group" onClick={() => openArticle(a)}
                      onMouseEnter={() => trackerRef.current?.trackHover()}>
                      <div className="rounded-xl overflow-hidden mb-3">
                        <img src={a.image} alt="" className="w-full h-44 object-cover transition-transform duration-300 group-hover:scale-105" />
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[10px] capitalize">{a.type}</span>
                        <span className="text-[10px] text-gray-400">{a.date} &middot; {a.time}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-rose-600 transition-colors leading-snug">{a.title}</h3>
                      <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{a.excerpt}</p>
                    </div>
                  ))}
                </div>

                {/* Inline ad — looks like "You might also like" */}
                {inlineAd && (
                  <div className="mb-7 py-4 border-y border-gray-100" onMouseEnter={() => trackerRef.current?.trackHover()}>
                    <div className="flex items-center gap-4 cursor-pointer group" onClick={() => clickAd(inlineAd)}>
                      {inlineAd.image_url && <img src={inlineAd.image_url?.includes('1436491865332') ? 'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=400&h=250&fit=crop'.replace('1436491865332-7a61a109db05', '1437846972679-9e6e537be46e') : inlineAd.image_url} alt="" className="w-28 h-20 rounded-xl object-cover flex-shrink-0 group-hover:shadow-lg transition-shadow" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] text-green-600 font-bold uppercase tracking-wider mb-0.5">Recommended</p>
                        <h4 className="text-[15px] font-semibold text-gray-900 group-hover:text-green-700 transition-colors leading-snug">{inlineAd.title}</h4>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">{inlineAd.description}</p>
                      </div>
                      <span className="text-gray-300 group-hover:text-green-500 transition-colors text-2xl flex-shrink-0">&rsaquo;</span>
                    </div>
                  </div>
                )}

                {/* Bottom row */}
                {bottomRow.length > 0 && (
                  <div className="grid grid-cols-2 gap-7">
                    {bottomRow.map(a => (
                      <div key={a.id} className="cursor-pointer group" onClick={() => openArticle(a)}
                        onMouseEnter={() => trackerRef.current?.trackHover()}>
                        <div className="rounded-xl overflow-hidden mb-3">
                          <img src={a.image} alt="" className="w-full h-44 object-cover transition-transform duration-300 group-hover:scale-105" />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[10px] capitalize">{a.type}</span>
                          <span className="text-[10px] text-gray-400">{a.date} &middot; {a.time}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-rose-600 transition-colors leading-snug">{a.title}</h3>
                        <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{a.excerpt}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside className="w-[260px] flex-shrink-0 hidden lg:block sticky top-24 h-fit">
            <div className="space-y-6">
              {/* Newsletter — real content */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h4 className="text-sm font-bold text-gray-900 mb-1">Stay Updated</h4>
                <p className="text-[11px] text-gray-400 mb-3">Get the best articles delivered weekly.</p>
                <input type="email" placeholder="you@email.com"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs mb-2 focus:outline-none focus:ring-1 focus:ring-rose-300" />
                <button className="w-full py-2 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors">Subscribe Free</button>
              </div>

              {/* Native ad — looks like an editorial recommendation */}
              {sidebarAd && (
                <div className="cursor-pointer group" onClick={() => clickAd(sidebarAd)}
                  onMouseEnter={() => trackerRef.current?.trackHover()}
                  style={{ animation: 'fadeIn 0.5s ease-out' }}>
                  <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                    {sidebarAd.image_url && (
                      <div className="overflow-hidden">
                        <img src={sidebarAd.image_url?.includes('1436491865332') ? 'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=400&h=250&fit=crop'.replace('1436491865332-7a61a109db05', '1437846972679-9e6e537be46e') : sidebarAd.image_url} alt=""
                          className="w-full h-36 object-cover transition-transform duration-500 group-hover:scale-110" />
                      </div>
                    )}
                    <div className="p-4">
                      <h4 className="text-[13px] font-bold text-gray-900 leading-snug mb-1.5 group-hover:text-green-700 transition-colors">{sidebarAd.title}</h4>
                      <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2 mb-3">{sidebarAd.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-gray-300">{sidebarAd.advertiser_name || 'Sponsored'}</span>
                        <span className="px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-gray-900 text-white group-hover:bg-green-600 transition-colors">
                          {sidebarAd.cta_text || 'Learn More'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Trending — real content */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h4 className="text-sm font-bold text-gray-900 mb-3">Trending</h4>
                <div className="space-y-3">
                  {['AI & Machine Learning', 'Web3 & Blockchain', 'Remote Work', 'Climate Tech'].map((t, i) => (
                    <div key={t} className="flex items-center gap-3 cursor-pointer hover:text-rose-600 transition-colors"
                      onMouseEnter={() => trackerRef.current?.trackHover()}>
                      <span className="text-[10px] text-gray-300 font-bold w-4">{i+1}</span>
                      <span className="text-xs text-gray-600">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-16 py-8">
        <div className="max-w-[1120px] mx-auto px-6 flex justify-between items-center">
          <p className="text-xs text-gray-400">&copy; 2025 TopicDrill. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="text-[10px] text-gray-300 cursor-pointer hover:text-gray-500">About</span>
            <span className="text-[10px] text-gray-300 cursor-pointer hover:text-gray-500">Contact</span>
            <span className="text-[10px] text-gray-300 cursor-pointer hover:text-gray-500">Privacy</span>
          </div>
        </div>
      </footer>

      {/* Ad Popup */}
      {popupAd && <AdPopup ad={popupAd} onClose={() => setPopupAd(null)} />}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  );
}
