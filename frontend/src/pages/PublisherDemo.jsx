import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as api from '../services/api';

const blogArticles = {
  tech: [
    { id: 't1', title: 'The Future of AI in Software Development', excerpt: 'How large language models are revolutionizing the way we write code, from GitHub Copilot to autonomous agents.', image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop', readTime: '8 min', page_type: 'blog' },
    { id: 't2', title: 'MacBook Pro vs Dell XPS: 2025 Comparison', excerpt: 'An in-depth comparison of the two most popular premium laptops for developers and creators.', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=400&fit=crop', readTime: '12 min', page_type: 'comparison' },
    { id: 't3', title: 'Best Gaming Laptops Under $1500', excerpt: 'We tested 15 gaming laptops to find the best value options for serious gamers on a budget.', image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&h=400&fit=crop', readTime: '10 min', page_type: 'product' },
    { id: 't4', title: 'Cloud Computing Trends to Watch in 2025', excerpt: 'From edge computing to serverless architectures, here are the trends shaping cloud infrastructure.', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop', readTime: '6 min', page_type: 'blog' },
    { id: 't5', title: 'Next.js vs Remix: Which Framework Should You Choose?', excerpt: 'A detailed comparison of the two leading React frameworks for building web applications.', image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=400&fit=crop', readTime: '15 min', page_type: 'comparison' },
    { id: 't6', title: 'Samsung Galaxy S25 Ultra Review: The AI Phone', excerpt: 'Hands-on review of Samsung\'s latest flagship with Galaxy AI features and titanium design.', image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600&h=400&fit=crop', readTime: '9 min', page_type: 'product' },
  ],
  finance: [
    { id: 'f1', title: 'How to Start Investing with Just $500', excerpt: 'A beginner\'s guide to building wealth through smart investing strategies and automated portfolios.', image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop', readTime: '7 min', page_type: 'blog' },
    { id: 'f2', title: 'Robinhood vs Wealthfront vs M1 Finance', excerpt: 'Comparing the top three investment platforms for millennials and first-time investors.', image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&h=400&fit=crop', readTime: '11 min', page_type: 'comparison' },
    { id: 'f3', title: 'Best High-Yield Savings Accounts 2025', excerpt: 'Find the best savings accounts offering up to 5.5% APY to maximize your cash holdings.', image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop', readTime: '5 min', page_type: 'product' },
    { id: 'f4', title: 'Crypto Market Analysis: What Comes Next', excerpt: 'Bitcoin ETFs are approved, but what does the future of cryptocurrency regulation look like?', image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=600&h=400&fit=crop', readTime: '8 min', page_type: 'blog' },
  ],
  travel: [
    { id: 'tr1', title: '10 Hidden Gems in Southeast Asia', excerpt: 'Discover breathtaking destinations beyond the tourist trails in Thailand, Vietnam, and Indonesia.', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop', readTime: '9 min', page_type: 'blog' },
    { id: 'tr2', title: 'Bali vs Phuket: Which Paradise is Right for You?', excerpt: 'A comprehensive comparison of two of Southeast Asia\'s most popular beach destinations.', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=400&fit=crop', readTime: '13 min', page_type: 'comparison' },
    { id: 'tr3', title: 'Best Travel Credit Cards for 2025', excerpt: 'Maximize your travel rewards with these top credit cards offering points, miles, and perks.', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=600&h=400&fit=crop', readTime: '7 min', page_type: 'product' },
    { id: 'tr4', title: 'How to Plan a Digital Nomad Trip to Europe', excerpt: 'Everything you need to know about working remotely across Europe\'s most beautiful cities.', image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&h=400&fit=crop', readTime: '11 min', page_type: 'blog' },
  ],
};

function IntentPanel({ intent, session }) {
  const stageColors = {
    browsing: { bg: 'bg-gray-100', text: 'text-gray-600', fill: 'bg-gray-400' },
    exploring: { bg: 'bg-blue-100', text: 'text-blue-600', fill: 'bg-blue-500' },
    comparing: { bg: 'bg-amber-100', text: 'text-amber-600', fill: 'bg-amber-500' },
    buying: { bg: 'bg-green-100', text: 'text-green-600', fill: 'bg-green-500' },
  };
  const stages = ['browsing', 'exploring', 'comparing', 'buying'];
  const currentStage = intent?.stage || 'browsing';
  const currentIdx = stages.indexOf(currentStage);
  const sc = stageColors[currentStage];

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 sticky top-20">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">🧠 Intent Intelligence</h3>

      {/* Score */}
      <div className="text-center mb-5">
        <div className="relative w-28 h-28 mx-auto">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" strokeWidth="8" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#22c55e" strokeWidth="8"
              strokeDasharray={`${(intent?.score || 0) * 264} 264`}
              strokeLinecap="round" className="transition-all duration-1000" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{((intent?.score || 0) * 100).toFixed(0)}</span>
            <span className="text-[10px] text-gray-400">Intent Score</span>
          </div>
        </div>
      </div>

      {/* Stage Progress */}
      <div className="mb-5">
        <div className="flex justify-between mb-2">
          {stages.map((stage, i) => (
            <div key={stage} className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold transition-all duration-500 ${i <= currentIdx ? `${sc.fill} text-white` : 'bg-gray-100 text-gray-400'}`}>
                {i + 1}
              </div>
              <span className={`text-[9px] mt-1 capitalize ${i <= currentIdx ? sc.text : 'text-gray-400'}`}>{stage}</span>
            </div>
          ))}
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div className="h-full bg-green-500 rounded-full" animate={{ width: `${((currentIdx + 1) / stages.length) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }} />
        </div>
      </div>

      {/* Session Stats */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-500">Pages Visited</span>
          <span className="text-xs font-semibold">{session?.pages_count || intent?.pages_count || 0}</span>
        </div>
        <div className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-500">Time Spent</span>
          <span className="text-xs font-semibold">{Math.round(session?.time_spent || intent?.time_spent || 0)}s</span>
        </div>
        <div className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-500">Categories</span>
          <span className="text-xs font-semibold">{(session?.categories || intent?.categories || []).join(', ') || 'None'}</span>
        </div>
      </div>

      <div className={`px-3 py-2 rounded-lg text-center ${sc.bg}`}>
        <span className={`text-xs font-semibold capitalize ${sc.text}`}>Stage: {currentStage}</span>
      </div>
    </div>
  );
}

function AdSlot({ ads, intent, onAdClick }) {
  if (!ads || ads.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-900">📣 Personalized Ads</h4>
      {ads.map((ad, i) => (
        <motion.div key={ad.ad_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${ad.is_best_match ? 'border-green-300 bg-green-50/30' : 'border-gray-100 bg-white'}`}
          onClick={() => onAdClick(ad)}>
          {ad.is_best_match && (
            <span className="px-2 py-0.5 bg-green-500 text-white text-[9px] font-bold rounded-full mb-2 inline-block">BEST MATCH</span>
          )}
          {ad.image_url && <img src={ad.image_url} alt="" className="w-full h-28 object-cover rounded-lg mb-2" />}
          <h5 className="text-sm font-semibold text-gray-900 mb-1">{ad.title}</h5>
          <p className="text-xs text-gray-400 mb-2 line-clamp-2">{ad.description}</p>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-green-600 font-semibold uppercase">{ad.category}</span>
            <span className="text-[10px] text-gray-400">Score: {(ad.relevance_score * 100).toFixed(0)}%</span>
          </div>
          {/* Explainability */}
          <div className="mt-2 p-2 bg-gray-50 rounded-lg">
            <p className="text-[10px] text-gray-500 font-medium mb-1">💡 Why this ad?</p>
            <ul className="space-y-0.5">
              {(ad.explanation?.reasons || []).slice(0, 2).map((r, j) => (
                <li key={j} className="text-[10px] text-gray-400">• {r}</li>
              ))}
            </ul>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function PublisherDemo() {
  const [activeCategory, setActiveCategory] = useState('tech');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [intent, setIntent] = useState({ score: 0, stage: 'browsing', pages_count: 0 });
  const [ads, setAds] = useState([]);
  const [sessionId] = useState(() => 'ses_demo_' + Math.random().toString(36).substring(2, 10));

  const trackPage = useCallback(async (article) => {
    try {
      const result = await api.trackSession({
        session_id: sessionId,
        url: `/blog/${article.id}`,
        title: article.title,
        category: activeCategory,
        time_spent: Math.floor(Math.random() * 60) + 10,
        clicks: 1,
        scroll_depth: Math.random() * 0.5 + 0.3,
      });
      if (result.intent) setIntent(result.intent);
    } catch (err) {
      console.error('Track error:', err);
    }
  }, [sessionId, activeCategory]);

  const loadAds = useCallback(async () => {
    try {
      const result = await api.serveAds(sessionId);
      if (result.ads) setAds(result.ads);
      if (result.intent) setIntent(result.intent);
    } catch (err) {
      console.error('Ad load error:', err);
    }
  }, [sessionId]);

  useEffect(() => {
    loadAds();
    const interval = setInterval(loadAds, 15000);
    return () => clearInterval(interval);
  }, [loadAds]);

  const handleArticleClick = (article) => {
    setSelectedArticle(article);
    trackPage(article);
    loadAds();
  };

  const handleAdClick = async (ad) => {
    try {
      await api.clickAd(ad.ad_id, sessionId, intent.stage);
      loadAds();
    } catch (err) {
      console.error('Click error:', err);
    }
  };

  const articles = blogArticles[activeCategory] || [];
  const heroArticle = articles[0];
  const gridArticles = articles.slice(1);

  return (
    <div className="min-h-screen bg-white">
      {/* Publisher Header */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">T</div>
            <span className="font-bold text-lg text-gray-900">TopicDrill</span>
          </div>
          <nav className="flex items-center gap-1">
            {Object.keys(blogArticles).map(cat => (
              <button key={cat} onClick={() => { setActiveCategory(cat); setSelectedArticle(null); }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === cat ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs text-gray-400 hover:text-green-500 transition-colors">← Back to Platform</Link>
            <button className="px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">Subscribe</button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="col-span-8">
            {selectedArticle ? (
              <motion.article initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <button onClick={() => setSelectedArticle(null)} className="text-sm text-gray-400 hover:text-gray-600">← Back to articles</button>
                <img src={selectedArticle.image} alt={selectedArticle.title} className="w-full h-80 object-cover rounded-2xl" />
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs capitalize">{activeCategory}</span>
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs capitalize">{selectedArticle.page_type}</span>
                  <span className="text-xs text-gray-400">📖 {selectedArticle.readTime} read</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 leading-tight">{selectedArticle.title}</h1>
                <p className="text-gray-600 leading-relaxed">{selectedArticle.excerpt}</p>
                <div className="prose text-gray-500 text-sm leading-relaxed space-y-4">
                  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                  <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                  <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>
                </div>
              </motion.article>
            ) : (
              <>
                {/* Hero */}
                {heroArticle && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-8 cursor-pointer group" onClick={() => handleArticleClick(heroArticle)}>
                    <div className="relative rounded-2xl overflow-hidden">
                      <img src={heroArticle.image} alt={heroArticle.title} className="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-6 left-6 right-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white rounded-full text-[10px] capitalize">{activeCategory}</span>
                          <span className="px-2 py-0.5 bg-green-500/80 text-white rounded-full text-[10px]">{heroArticle.page_type}</span>
                          <span className="text-white/60 text-[10px]">📖 {heroArticle.readTime}</span>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-1">{heroArticle.title}</h2>
                        <p className="text-sm text-white/70">{heroArticle.excerpt}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Article Grid */}
                <div className="grid grid-cols-2 gap-6">
                  {gridArticles.map((article, i) => (
                    <motion.div key={article.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }} onClick={() => handleArticleClick(article)}
                      className="cursor-pointer group">
                      <div className="rounded-xl overflow-hidden mb-3">
                        <img src={article.image} alt={article.title}
                          className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105" />
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[10px] capitalize">{article.page_type}</span>
                        <span className="text-[10px] text-gray-400">{article.readTime}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-green-600 transition-colors leading-snug">{article.title}</h3>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{article.excerpt}</p>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="col-span-4 space-y-6">
            <IntentPanel intent={intent} session={intent} />
            <AdSlot ads={ads} intent={intent} onAdClick={handleAdClick} />
          </div>
        </div>
      </div>
    </div>
  );
}
