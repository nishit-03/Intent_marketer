import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as api from '../services/api';

const stages = ['browsing', 'exploring', 'comparing', 'buying'];
const stageDescriptions = {
  browsing: 'User is casually reading content with no specific purchase intent.',
  exploring: 'User is actively looking for information, discovering options.',
  comparing: 'User is comparing products, reading reviews and alternatives.',
  buying: 'User shows strong purchase signals — ready to convert.',
};
const stageEmoji = { browsing: '👀', exploring: '🔍', comparing: '⚖️', buying: '💰' };

export default function IntentIntelligence() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 10000);
    return () => clearInterval(interval);
  }, []);

  async function loadSessions() {
    try {
      // We'll fetch sessions from overview + individual session endpoints
      const overview = await api.getAnalyticsOverview();
      // For demo, simulate sessions from intent distribution
      const distribution = await api.getIntentDistribution();
      setSessions(distribution);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-800 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-1">Intent Intelligence Engine</h2>
          <p className="text-purple-200 text-sm">Real-time session behavior analysis — zero personal data collected</p>
          <div className="flex gap-4 mt-5">
            <div className="bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
              <p className="text-2xl font-bold">{sessions.reduce((sum, s) => sum + (s.count || 0), 0)}</p>
              <p className="text-[10px] text-purple-200">Total Sessions</p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
              <p className="text-2xl font-bold">{sessions.length}</p>
              <p className="text-[10px] text-purple-200">Intent Stages Active</p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
              <p className="text-2xl font-bold">{sessions.find(s => s._id === 'buying')?.count || 0}</p>
              <p className="text-[10px] text-purple-200">Buying Intent</p>
            </div>
          </div>
        </div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-400/10 rounded-full blur-3xl" />
      </motion.div>

      {/* How Intent Detection Works */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="text-base font-semibold text-gray-900 mb-4">🧠 How Intent Detection Works</h3>
        <p className="text-sm text-gray-500 mb-6">
          Our intent engine analyzes anonymous session behavior signals in real-time. No cookies, no personal data — just pure behavioral intelligence.
        </p>

        <div className="grid grid-cols-5 gap-3">
          {[
            { icon: '📄', label: 'Pages Visited', weight: '20%', desc: 'Number and type of pages' },
            { icon: '⏱️', label: 'Time Spent', weight: '20%', desc: 'Duration of engagement' },
            { icon: '📜', label: 'Scroll Depth', weight: '15%', desc: 'Content consumption' },
            { icon: '🔗', label: 'Page Types', weight: '25%', desc: 'Blog vs product vs comparison' },
            { icon: '🔄', label: 'Comparisons', weight: '20%', desc: 'Product comparison signals' },
          ].map((signal, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="p-4 bg-gray-50 rounded-xl text-center border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-all">
              <span className="text-2xl block mb-2">{signal.icon}</span>
              <p className="text-xs font-semibold text-gray-900 mb-1">{signal.label}</p>
              <p className="text-[10px] text-gray-400 mb-2">{signal.desc}</p>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-semibold">{signal.weight}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Intent Stages */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="text-base font-semibold text-gray-900 mb-6">🎯 Intent Stages</h3>
        <div className="grid grid-cols-4 gap-4">
          {stages.map((stage, i) => {
            const sessionData = sessions.find(s => s._id === stage);
            const count = sessionData?.count || 0;
            const avgScore = sessionData?.avg_score || 0;
            const colors = ['bg-gray-50 border-gray-200', 'bg-blue-50 border-blue-200', 'bg-amber-50 border-amber-200', 'bg-green-50 border-green-200'];
            const textColors = ['text-gray-600', 'text-blue-600', 'text-amber-600', 'text-green-600'];

            return (
              <motion.div key={stage} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className={`p-5 rounded-xl border-2 ${colors[i]} transition-all hover:shadow-md`}>
                <div className="text-center mb-4">
                  <span className="text-3xl block mb-2">{stageEmoji[stage]}</span>
                  <h4 className={`text-sm font-bold capitalize ${textColors[i]}`}>{stage}</h4>
                </div>
                <p className="text-[10px] text-gray-500 text-center mb-4">{stageDescriptions[stage]}</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-400">Sessions</span>
                    <span className="text-sm font-bold text-gray-900">{count}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-400">Avg Score</span>
                    <span className="text-sm font-bold text-gray-900">{(avgScore * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-400">Score Range</span>
                    <span className="text-[10px] text-gray-500">
                      {i === 0 ? '0-25%' : i === 1 ? '25-50%' : i === 2 ? '50-75%' : '75-100%'}
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-3 h-1.5 bg-white rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${i === 0 ? 'bg-gray-400' : i === 1 ? 'bg-blue-500' : i === 2 ? 'bg-amber-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(100, avgScore * 100 + 20)}%` }} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Privacy Guarantee */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-6 border border-green-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-2xl flex-shrink-0">🔒</div>
          <div>
            <h4 className="text-sm font-bold text-green-800 mb-1">Privacy Guarantee</h4>
            <p className="text-xs text-green-700 leading-relaxed">
              IntentMarketer processes all intent signals in real-time without storing personal data. Session IDs are randomly generated,
              expire at session end, and cannot be linked to any individual. We do not use cookies, fingerprinting, or any tracking technology.
              Our system detects intent — not identity.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
