import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from '../services/api';

export default function AdRankingPanel() {
  const [ads, setAds] = useState([]);
  const [rankedAds, setRankedAds] = useState([]);
  const [intent, setIntent] = useState({ score: 0, stage: 'browsing', pages_count: 0 });
  const [sessionId] = useState(() => 'ses_rank_' + Math.random().toString(36).substring(2, 10));
  const [simulating, setSimulating] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [message, setMessage] = useState('');

  // Simulation controls
  const [simConfig, setSimConfig] = useState({
    category: 'tech',
    pageType: 'blog',
    pages: 3,
    timeSpent: 60,
    scrollDepth: 0.5,
  });

  const loadRanking = useCallback(async () => {
    try {
      const result = await api.serveAds(sessionId);
      if (result.ads) setRankedAds(result.ads);
      if (result.intent) setIntent(result.intent);
    } catch (err) {
      console.error(err);
    }
  }, [sessionId]);

  useEffect(() => {
    loadRanking();
  }, [loadRanking]);

  async function simulateSession() {
    setSimulating(true);
    try {
      // Simulate multiple page visits
      for (let i = 0; i < simConfig.pages; i++) {
        await api.trackSession({
          session_id: sessionId,
          url: `/simulated/${simConfig.category}/${simConfig.pageType}-${i + 1}`,
          title: `${simConfig.category} ${simConfig.pageType} page ${i + 1}`,
          category: simConfig.category,
          time_spent: simConfig.timeSpent / simConfig.pages,
          clicks: Math.floor(Math.random() * 3),
          scroll_depth: simConfig.scrollDepth,
        });
      }
      await loadRanking();
      setMessage('Session simulated! Ad ranking updated.');
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally {
      setSimulating(false);
      setTimeout(() => setMessage(''), 3000);
    }
  }

  async function handleRetrain() {
    setRetraining(true);
    try {
      const result = await api.triggerRetrain();
      setMessage(result.message || 'Retraining complete!');
    } catch (err) {
      setMessage('Retrain error: ' + err.message);
    } finally {
      setRetraining(false);
      setTimeout(() => setMessage(''), 5000);
    }
  }

  const rankColors = ['from-yellow-400 to-amber-500', 'from-gray-300 to-gray-400', 'from-amber-600 to-amber-700'];
  const rankLabels = ['🥇 #1', '🥈 #2', '🥉 #3'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-1">Hybrid Ad Ranking Engine</h2>
          <p className="text-gray-400 text-sm">Phase 1: LLM Filtering → Phase 2: ML Scoring → Top 3 Results</p>
          <div className="flex gap-4 mt-5">
            <div className="bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
              <p className="text-lg font-bold text-green-400">{((intent.score || 0) * 100).toFixed(0)}%</p>
              <p className="text-[10px] text-gray-400">Intent Score</p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
              <p className="text-lg font-bold capitalize text-blue-400">{intent.stage}</p>
              <p className="text-[10px] text-gray-400">Current Stage</p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
              <p className="text-lg font-bold text-purple-400">{rankedAds.length}</p>
              <p className="text-[10px] text-gray-400">Ranked Ads</p>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-green-500/5 rounded-full blur-3xl" />
      </motion.div>

      <div className="grid grid-cols-3 gap-6">
        {/* Simulation Controls */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">🎮 Session Simulator</h3>
          <p className="text-xs text-gray-400 mb-5">Simulate user behavior to see how ad ranking changes in real-time.</p>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Category</label>
              <select value={simConfig.category} onChange={e => setSimConfig({ ...simConfig, category: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-400 focus:border-transparent">
                {['tech', 'finance', 'travel', 'health', 'education', 'ecommerce'].map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Page Type</label>
              <select value={simConfig.pageType} onChange={e => setSimConfig({ ...simConfig, pageType: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-400 focus:border-transparent">
                {['blog', 'comparison', 'product', 'landing'].map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Pages to Visit: {simConfig.pages}</label>
              <input type="range" min="1" max="15" value={simConfig.pages}
                onChange={e => setSimConfig({ ...simConfig, pages: parseInt(e.target.value) })}
                className="w-full mt-1 accent-green-500" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Time Spent: {simConfig.timeSpent}s</label>
              <input type="range" min="10" max="600" step="10" value={simConfig.timeSpent}
                onChange={e => setSimConfig({ ...simConfig, timeSpent: parseInt(e.target.value) })}
                className="w-full mt-1 accent-green-500" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Scroll Depth: {(simConfig.scrollDepth * 100).toFixed(0)}%</label>
              <input type="range" min="0" max="100" value={simConfig.scrollDepth * 100}
                onChange={e => setSimConfig({ ...simConfig, scrollDepth: parseInt(e.target.value) / 100 })}
                className="w-full mt-1 accent-green-500" />
            </div>

            <button onClick={simulateSession} disabled={simulating}
              className="w-full py-2.5 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-green-200 transition-all disabled:opacity-50">
              {simulating ? '⏳ Simulating...' : '▶️ Run Simulation'}
            </button>

            <button onClick={handleRetrain} disabled={retraining}
              className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all disabled:opacity-50">
              {retraining ? '⏳ Retraining...' : '🔄 Retrain ML Model'}
            </button>
          </div>

          <AnimatePresence>
            {message && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="mt-3 text-xs text-green-600 text-center">{message}</motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Ranked Ads */}
        <div className="col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">🏆 Top Ranked Ads</h3>

          {rankedAds.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-sm text-gray-400">No ranked ads yet. Run a session simulation or seed the database.</p>
            </div>
          ) : (
            rankedAds.map((ad, i) => (
              <motion.div key={ad.ad_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`bg-white rounded-2xl p-6 border-2 transition-all hover:shadow-lg ${i === 0 ? 'border-green-300 shadow-md' : 'border-gray-100'}`}>
                <div className="flex items-start gap-5">
                  {/* Rank Badge */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${rankColors[i] || 'from-gray-200 to-gray-300'} flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg`}>
                    {rankLabels[i] || `#${i + 1}`}
                  </div>

                  {/* Ad Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-base font-semibold text-gray-900">{ad.title}</h4>
                      {i === 0 && <span className="px-2 py-0.5 bg-green-100 text-green-600 text-[10px] font-bold rounded-full">BEST MATCH</span>}
                    </div>
                    <p className="text-xs text-gray-400 mb-3 line-clamp-2">{ad.description}</p>

                    {/* Score Bars */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-gray-400">Final Score</span>
                          <span className="text-xs font-bold text-green-600">{(ad.relevance_score * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                            initial={{ width: 0 }} animate={{ width: `${ad.relevance_score * 100}%` }}
                            transition={{ duration: 1, delay: i * 0.2 }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-gray-400">ML Score</span>
                          <span className="text-xs font-bold text-blue-600">{((ad.ml_score || 0) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"
                            initial={{ width: 0 }} animate={{ width: `${(ad.ml_score || 0) * 100}%` }}
                            transition={{ duration: 1, delay: i * 0.2 + 0.1 }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-gray-400">LLM Relevance</span>
                          <span className="text-xs font-bold text-purple-600">{((ad.llm_relevance || 0) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div className="h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-full"
                            initial={{ width: 0 }} animate={{ width: `${(ad.llm_relevance || 0) * 100}%` }}
                            transition={{ duration: 1, delay: i * 0.2 + 0.2 }} />
                        </div>
                      </div>
                    </div>

                    {/* Explainability */}
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-[10px] text-gray-500 font-semibold mb-2">💡 Why this ad?</p>
                      <ul className="space-y-1">
                        {(ad.explanation?.reasons || []).map((r, j) => (
                          <li key={j} className="text-xs text-gray-500 flex items-start gap-1.5">
                            <span className="text-green-500 mt-0.5">✓</span>
                            <span>{r}</span>
                          </li>
                        ))}
                        {ad.explanation?.intent_alignment && (
                          <li className="text-xs text-blue-500 flex items-start gap-1.5">
                            <span className="mt-0.5">🎯</span>
                            <span>{ad.explanation.intent_alignment}</span>
                          </li>
                        )}
                      </ul>
                      {ad.explanation?.matched_keywords?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {ad.explanation.matched_keywords.map(kw => (
                            <span key={kw} className="px-1.5 py-0.5 bg-green-50 text-green-600 rounded text-[9px]">{kw}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Category + Image */}
                  <div className="flex-shrink-0 text-right">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px] capitalize">{ad.category}</span>
                    {ad.image_url && (
                      <img src={ad.image_url} alt="" className="w-24 h-16 object-cover rounded-lg mt-2" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Pipeline Visualization */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 mb-5">⚡ Ranking Pipeline</h3>
        <div className="flex items-center justify-between">
          {[
            { label: 'Session Data', icon: '📱', desc: 'Anonymous behavior signals', color: 'bg-gray-100' },
            { label: 'Intent Engine', icon: '🧠', desc: 'Score + stage calculation', color: 'bg-purple-50' },
            { label: 'LLM Filter', icon: '🤖', desc: 'Category + keyword matching', color: 'bg-blue-50' },
            { label: 'ML Ranker', icon: '📊', desc: 'Click probability prediction', color: 'bg-green-50' },
            { label: 'Top 3 Ads', icon: '🏆', desc: 'Best matched ads served', color: 'bg-yellow-50' },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`p-4 ${step.color} rounded-xl text-center min-w-[120px]`}>
                <span className="text-2xl block mb-1">{step.icon}</span>
                <p className="text-xs font-semibold text-gray-900">{step.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{step.desc}</p>
              </div>
              {i < 4 && <span className="text-gray-300 text-lg">→</span>}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
