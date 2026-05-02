import { useState, useEffect, useCallback, useRef } from 'react';

const API = 'http://localhost:5000';

const articles = {
  tech: [
    { id: 't1', title: 'The Future of AI in Software Development', excerpt: 'How large language models are revolutionizing the way we write code, from GitHub Copilot to autonomous agents that can build entire applications.', image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=500&fit=crop', time: '8 min', type: 'blog', date: 'Apr 18, 2025', tags: ['ai', 'developer', 'computer', 'performance', 'framework'] },
    { id: 't2', title: 'MacBook Pro vs Dell XPS: 2025 Comparison', excerpt: 'An in-depth comparison of the two most popular premium laptops for developers and creators.', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=500&fit=crop', time: '12 min', type: 'comparison', date: 'Apr 16, 2025', tags: ['macbook', 'laptop', 'apple', 'computer', 'developer', 'pro'] },
    { id: 't3', title: 'Best Gaming Laptops Under $1500', excerpt: 'We tested 15 gaming laptops to find the best value options for serious gamers on a budget.', image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&h=500&fit=crop', time: '10 min', type: 'product', date: 'Apr 14, 2025', tags: ['gaming', 'laptop', 'asus', 'rog', 'gpu', 'rtx', 'game', 'computer'] },
    { id: 't4', title: 'Cloud Computing Trends to Watch', excerpt: 'From edge computing to serverless architectures, here are the trends shaping cloud infrastructure in 2025.', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=500&fit=crop', time: '6 min', type: 'blog', date: 'Apr 12, 2025', tags: ['serverless', 'deploy', 'edge', 'hosting', 'developer', 'vercel'] },
    { id: 't5', title: 'Next.js vs Remix: Framework Battle', excerpt: 'A detailed comparison of the two leading React frameworks for building modern web applications.', image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=500&fit=crop', time: '15 min', type: 'comparison', date: 'Apr 10, 2025', tags: ['nextjs', 'react', 'framework', 'developer', 'deploy', 'vercel'] },
    { id: 't6', title: 'Samsung Galaxy S25 Ultra Review', excerpt: 'Hands-on review of Samsung\'s latest flagship with Galaxy AI features and titanium design.', image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&h=500&fit=crop', time: '9 min', type: 'product', date: 'Apr 8, 2025', tags: ['samsung', 'galaxy', 'phone', 'smartphone', 'mobile', 'android', 'camera'] },
    { id: 't7', title: 'Rust vs Go: Systems Programming in 2025', excerpt: 'Which systems language should you learn? We compare memory safety, performance, ecosystem, and developer experience.', image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&h=500&fit=crop', time: '14 min', type: 'comparison', date: 'Apr 6, 2025', tags: ['developer', 'performance', 'computer', 'api', 'saas'] },
    { id: 't8', title: 'The Rise of Edge AI: Processing at the Source', excerpt: 'Why running AI models directly on devices is changing everything from self-driving cars to smart homes.', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=500&fit=crop', time: '11 min', type: 'blog', date: 'Apr 4, 2025', tags: ['ai', 'edge', 'performance', 'computer', 'deploy'] },
    { id: 't9', title: 'Top 10 VS Code Extensions for 2025', excerpt: 'Supercharge your development workflow with these must-have extensions covering AI, testing, and productivity.', image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=500&fit=crop', time: '7 min', type: 'product', date: 'Apr 2, 2025', tags: ['developer', 'productivity', 'workspace', 'notion', 'project', 'notes'] },
    { id: 't10', title: 'Building a SaaS in 2025: Complete Guide', excerpt: 'From idea validation to launch — a comprehensive guide to building and scaling a SaaS product with modern tools.', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop', time: '20 min', type: 'blog', date: 'Mar 30, 2025', tags: ['saas', 'stripe', 'payment', 'api', 'developer', 'business'] },
  ],
  finance: [
    { id: 'f1', title: 'How to Start Investing with Just $500', excerpt: 'A beginner\'s guide to building wealth through smart investing strategies that anyone can follow.', image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=500&fit=crop', time: '7 min', type: 'blog', date: 'Apr 17, 2025', tags: ['invest', 'portfolio', 'wealth', 'money', 'finance', 'stock'] },
    { id: 'f2', title: 'Robinhood vs Wealthfront vs M1 Finance', excerpt: 'Comparing the top three investment platforms for millennials — fees, features, and performance.', image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=500&fit=crop', time: '11 min', type: 'comparison', date: 'Apr 15, 2025', tags: ['wealthfront', 'invest', 'portfolio', 'finance', 'automated', 'wealth'] },
    { id: 'f3', title: 'Best High-Yield Savings Accounts 2025', excerpt: 'Find the best savings accounts offering up to 5.5% APY with no minimum balance requirements.', image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=500&fit=crop', time: '5 min', type: 'product', date: 'Apr 13, 2025', tags: ['savings', 'bank', 'money', 'finance', 'budget', 'credit'] },
    { id: 'f4', title: 'Crypto Market: What Comes Next?', excerpt: 'Bitcoin ETFs are approved, institutional money is flowing in, but what does the future really look like?', image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&h=500&fit=crop', time: '8 min', type: 'blog', date: 'Apr 11, 2025', tags: ['crypto', 'bitcoin', 'ethereum', 'trading', 'exchange', 'blockchain', 'coinbase'] },
    { id: 'f5', title: 'Tax Optimization Strategies for Freelancers', excerpt: 'Maximize your deductions and minimize your tax burden with these legal strategies for self-employed professionals.', image: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=800&h=500&fit=crop', time: '10 min', type: 'blog', date: 'Apr 9, 2025', tags: ['finance', 'savings', 'money', 'expense', 'budget', 'spending'] },
    { id: 'f6', title: 'Best Credit Cards for Cash Back in 2025', excerpt: 'Our picks for the top cash-back credit cards with no annual fee, ranked by rewards rate and perks.', image: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=800&h=500&fit=crop', time: '6 min', type: 'product', date: 'Apr 7, 2025', tags: ['credit', 'bank', 'money', 'finance', 'spending', 'budget'] },
    { id: 'f7', title: 'Index Funds vs ETFs: Which Is Better?', excerpt: 'Breaking down the differences, tax implications, and performance of passive investment vehicles.', image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=500&fit=crop', time: '13 min', type: 'comparison', date: 'Apr 5, 2025', tags: ['invest', 'portfolio', 'stock', 'finance', 'wealth', 'money'] },
    { id: 'f8', title: 'How to Build an Emergency Fund Fast', excerpt: 'Practical steps to save 3-6 months of expenses even on a tight budget, with automation tips.', image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=500&fit=crop', time: '5 min', type: 'blog', date: 'Apr 3, 2025', tags: ['savings', 'budget', 'money', 'expense', 'finance', 'bank'] },
  ],
  travel: [
    { id: 'tr1', title: '10 Hidden Gems in Southeast Asia', excerpt: 'Discover breathtaking destinations beyond the tourist trails — from remote islands to mountain villages.', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=500&fit=crop', time: '9 min', type: 'blog', date: 'Apr 18, 2025', tags: ['travel', 'destination', 'trip', 'vacation', 'booking'] },
    { id: 'tr2', title: 'Bali vs Phuket: Which Paradise?', excerpt: 'A comprehensive comparison of Southeast Asia\'s most popular beach destinations for every budget.', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=500&fit=crop', time: '13 min', type: 'comparison', date: 'Apr 15, 2025', tags: ['bali', 'vacation', 'resort', 'beach', 'travel', 'trip', 'booking'] },
    { id: 'tr3', title: 'Best Travel Credit Cards for 2025', excerpt: 'Maximize your travel rewards with these top credit cards — from sign-up bonuses to lounge access.', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=800&h=500&fit=crop', time: '7 min', type: 'product', date: 'Apr 12, 2025', tags: ['travel', 'flight', 'booking', 'airline', 'deal'] },
    { id: 'tr4', title: 'Digital Nomad Guide to Europe', excerpt: 'Everything you need to know about working remotely across Europe — visas, coworking, and cost of living.', image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=500&fit=crop', time: '11 min', type: 'blog', date: 'Apr 9, 2025', tags: ['travel', 'destination', 'stay', 'experience', 'airbnb'] },
    { id: 'tr5', title: 'Japan on a Budget: 2-Week Itinerary', excerpt: 'How to experience Tokyo, Kyoto, Osaka, and Hiroshima without breaking the bank — including rail pass tips.', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=500&fit=crop', time: '16 min', type: 'blog', date: 'Apr 7, 2025', tags: ['japan', 'tokyo', 'kyoto', 'rail', 'train', 'travel', 'trip', 'pass'] },
    { id: 'tr6', title: 'Airbnb vs Hotels: The Real Cost Comparison', excerpt: 'We booked 50 trips both ways to find out which option actually saves you money in different destinations.', image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=500&fit=crop', time: '10 min', type: 'comparison', date: 'Apr 5, 2025', tags: ['airbnb', 'hotel', 'stay', 'booking', 'travel', 'vacation'] },
    { id: 'tr7', title: 'Solo Travel Safety Guide for 2025', excerpt: 'Essential safety tips, apps, and gear for solo travelers — from first-timers to seasoned adventurers.', image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=500&fit=crop', time: '8 min', type: 'blog', date: 'Apr 3, 2025', tags: ['travel', 'trip', 'destination', 'booking', 'flight'] },
    { id: 'tr8', title: 'Best Travel Backpacks: Carry-On Approved', excerpt: 'Our top picks for travel backpacks that fit airline carry-on requirements while maximizing packing space.', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=500&fit=crop', time: '7 min', type: 'product', date: 'Apr 1, 2025', tags: ['travel', 'flight', 'airline', 'trip'] },
  ],
};

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
            <img src={ad.image_url} alt={ad.title} className="w-full h-52 object-cover" />
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

  async flush() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    if (elapsed < 1 || !this.currentUrl) return;

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
      if (data.ads) setAds(data.ads.slice(0, 2));
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
    setTimeout(() => loadAds(category), 400);
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
                  <p>The landscape of technology and innovation continues to evolve at a breakneck pace. What was once considered cutting-edge just a few years ago is now commonplace, and the boundaries of what's possible are being pushed further every single day. In this deep dive, we explore the forces shaping the current moment and what they mean for professionals, consumers, and the broader industry.</p>

                  <h2 className="text-xl font-bold text-gray-900 mt-8 mb-2">The Current State of the Industry</h2>
                  <p>Over the past decade, we've witnessed a fundamental shift in how people interact with technology, manage their finances, and plan their lives. The convergence of artificial intelligence, cloud computing, and mobile-first design has created an ecosystem where information flows freely and decisions can be made in real time. This has profound implications for every sector, from healthcare to education to commerce.</p>
                  <p>Industry analysts predict that spending in this area will exceed $4.5 trillion globally by 2026, driven by enterprise adoption, consumer demand, and regulatory frameworks that are finally catching up with the pace of innovation. The companies that position themselves at the intersection of these trends stand to capture enormous value.</p>

                  <h2 className="text-xl font-bold text-gray-900 mt-8 mb-2">Key Trends to Watch</h2>
                  <p>Several macro trends are converging to reshape the competitive landscape. First, the democratization of advanced tools means that smaller players can now compete with established giants. Second, the shift toward subscription-based models has fundamentally altered how businesses generate and predict revenue. Third, the increasing importance of data privacy is forcing companies to rethink their entire approach to customer relationships.</p>
                  <p>Perhaps most importantly, the rise of AI-powered automation is eliminating repetitive tasks and freeing professionals to focus on higher-value work. Studies show that teams using AI-assisted tools report 40% higher productivity and significantly lower burnout rates. This isn't about replacing humans — it's about augmenting human capabilities in ways we couldn't have imagined five years ago.</p>

                  <blockquote className="border-l-4 border-rose-400 pl-5 py-2 italic text-gray-600 my-6">"The next wave of innovation won't come from a single breakthrough, but from the intelligent combination of existing technologies applied to real human problems." — Industry Report 2025</blockquote>

                  {/* First inline ad */}
                  {inlineAd && (
                    <div className="my-1 py-4 border-y border-gray-100"
                      onMouseEnter={() => trackerRef.current?.trackHover()}>
                      <div className="flex items-center gap-4 cursor-pointer group" onClick={() => clickAd(inlineAd)}>
                        {inlineAd.image_url && <img src={inlineAd.image_url} alt="" className="w-24 h-[72px] rounded-xl object-cover flex-shrink-0 group-hover:shadow-md transition-shadow" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] text-green-600 font-bold uppercase tracking-wider mb-0.5">Recommended for you</p>
                          <h4 className="text-sm font-semibold text-gray-900 group-hover:text-green-700 transition-colors leading-snug">{inlineAd.title}</h4>
                          <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{inlineAd.description}</p>
                        </div>
                        <span className="text-gray-300 group-hover:text-green-500 transition-colors text-lg flex-shrink-0">&rsaquo;</span>
                      </div>
                    </div>
                  )}

                  <h2 className="text-xl font-bold text-gray-900 mt-8 mb-2">Deep Dive: What the Data Tells Us</h2>
                  <p>When we examine the data more closely, several fascinating patterns emerge. User engagement metrics have shifted dramatically over the past two years, with average session durations increasing by 35% while bounce rates have decreased across the board. This suggests that content quality and personalization are driving deeper interactions.</p>
                  <p>The most successful platforms are those that have invested heavily in understanding user intent rather than simply tracking demographics. By analyzing behavioral signals — what users click, how long they read, what they compare — these platforms can deliver experiences that feel almost prescient. This approach respects user privacy while still providing tremendous value.</p>
                  <p>Mobile usage continues to dominate, accounting for 72% of all web traffic in the first quarter of 2025. However, desktop usage for high-intent activities like purchasing, investing, and booking has actually increased, suggesting that users still prefer larger screens for decisions that require careful consideration. Smart companies are optimizing for this cross-device journey.</p>

                  <h2 className="text-xl font-bold text-gray-900 mt-8 mb-2">Expert Perspectives</h2>
                  <p>We spoke with dozens of industry leaders to get their take on where things are headed. The consensus view is remarkably aligned: the next 18 months will see a consolidation phase where the strongest products and platforms pull ahead, while weaker offerings are either acquired or fade from relevance.</p>
                  <p>"What we're seeing is a maturation of the market," explains one senior product leader at a major tech firm. "Early adopters have already made their choices, and now we're entering the mass-market phase where ease of use, reliability, and integration capabilities matter more than raw feature count."</p>

                  <blockquote className="border-l-4 border-blue-400 pl-5 py-2 italic text-gray-600 my-6">"The companies winning today aren't necessarily the ones with the most features — they're the ones that solve a specific problem exceptionally well and make it effortless for users to get started."</blockquote>

                  <h2 className="text-xl font-bold text-gray-900 mt-8 mb-2">Practical Takeaways</h2>
                  <p>So what does all of this mean for you? Whether you're a professional looking to stay competitive, a consumer trying to make smart decisions, or an entrepreneur seeking opportunities, here are the key takeaways from our research:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Start experimenting with AI-powered tools in your workflow — the learning curve is shorter than you think</li>
                    <li>Diversify your approach and don't put all your eggs in one basket, whether that's investments, platforms, or strategies</li>
                    <li>Pay attention to privacy-first solutions, as regulatory pressure will only increase</li>
                    <li>Invest in continuous learning — the half-life of technical skills is shrinking rapidly</li>
                    <li>Look for platforms that integrate well with your existing tools rather than trying to replace everything at once</li>
                  </ul>

                  {/* Second inline ad — deeper in the article for high-engagement readers */}
                  {sidebarAd && (
                    <div className="my-1 py-4 border-y border-gray-100"
                      onMouseEnter={() => trackerRef.current?.trackHover()}>
                      <div className="flex items-center gap-4 cursor-pointer group" onClick={() => clickAd(sidebarAd)}>
                        {sidebarAd.image_url && <img src={sidebarAd.image_url} alt="" className="w-24 h-[72px] rounded-xl object-cover flex-shrink-0 group-hover:shadow-md transition-shadow" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] text-green-600 font-bold uppercase tracking-wider mb-0.5">You might also like</p>
                          <h4 className="text-sm font-semibold text-gray-900 group-hover:text-green-700 transition-colors leading-snug">{sidebarAd.title}</h4>
                          <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{sidebarAd.description}</p>
                        </div>
                        <span className="text-gray-300 group-hover:text-green-500 transition-colors text-lg flex-shrink-0">&rsaquo;</span>
                      </div>
                    </div>
                  )}

                  <h2 className="text-xl font-bold text-gray-900 mt-8 mb-2">Looking Ahead</h2>
                  <p>The future is being written right now by the decisions we make today. As barriers to entry continue to fall and powerful tools become accessible to everyone, the differentiator will increasingly be vision, execution speed, and the ability to truly understand what users need before they even articulate it.</p>
                  <p>We'll continue to monitor these trends and provide in-depth analysis as the landscape evolves. Make sure to subscribe to our newsletter to stay ahead of the curve, and don't hesitate to share your own perspectives in the comments below.</p>
                  <p>The pace of change shows no signs of slowing down. If anything, the feedback loops between innovation, adoption, and new innovation are accelerating. The most exciting developments often come from unexpected intersections — when an idea from one field is applied creatively to solve a problem in another. Keep your eyes open, stay curious, and never stop learning.</p>
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
                      {inlineAd.image_url && <img src={inlineAd.image_url} alt="" className="w-28 h-20 rounded-xl object-cover flex-shrink-0 group-hover:shadow-lg transition-shadow" />}
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
          <aside className="w-[260px] flex-shrink-0 hidden lg:block">
            <div className="sticky top-24 space-y-6">
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
                        <img src={sidebarAd.image_url} alt=""
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
