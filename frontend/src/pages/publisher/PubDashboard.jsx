import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

export default function PubDashboard() {
  const { authFetch, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [scriptData, setScriptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showIntegration, setShowIntegration] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const [statsRes, timelineRes, scriptRes] = await Promise.all([
        authFetch('/api/publisher/stats'),
        authFetch('/api/publisher/timeline?days=14'),
        authFetch('/api/publisher/script'),
      ]);
      setStats(await statsRes.json());
      setTimeline(await timelineRes.json());
      setScriptData(await scriptRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function copyScript() {
    if (scriptData?.script) {
      navigator.clipboard.writeText(scriptData.script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return <div className="space-y-6">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-8 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0a0e17 0%, #0f2419 100%)' }}>
        <h1 className="text-2xl font-bold mb-1">Welcome back, {user?.name}</h1>
        <p className="text-green-300 text-sm">{stats?.website || user?.website_name} — Publisher Dashboard</p>
        <div className="flex gap-4 mt-5">
          <div className="bg-white/10 rounded-xl px-5 py-3 backdrop-blur-sm">
            <p className="text-2xl font-bold text-green-400">${stats?.revenue?.toFixed(2) || '0.00'}</p>
            <p className="text-[10px] text-gray-400">Total Revenue</p>
          </div>
          <div className="bg-white/10 rounded-xl px-5 py-3 backdrop-blur-sm">
            <p className="text-2xl font-bold">{stats?.impressions?.toLocaleString() || 0}</p>
            <p className="text-[10px] text-gray-400">Impressions</p>
          </div>
          <div className="bg-white/10 rounded-xl px-5 py-3 backdrop-blur-sm">
            <p className="text-2xl font-bold">{stats?.clicks?.toLocaleString() || 0}</p>
            <p className="text-[10px] text-gray-400">Clicks</p>
          </div>
          <div className="bg-white/10 rounded-xl px-5 py-3 backdrop-blur-sm">
            <p className="text-2xl font-bold">{stats?.ctr || 0}%</p>
            <p className="text-[10px] text-gray-400">CTR</p>
          </div>
        </div>
      </motion.div>

      {/* Revenue Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Revenue Timeline</h3>
        <p className="text-xs text-gray-400 mb-4">Daily revenue from ad impressions and clicks</p>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={timeline}>
            <defs>
              <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={v => v.slice(5)} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} unit="$" />
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(val) => `$${val}`} />
            <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} fill="url(#gradRev)" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Integration Script */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Integration Script</h3>
            <p className="text-xs text-gray-400">Add this to your website to start showing ads</p>
          </div>
          <button onClick={() => setShowIntegration(!showIntegration)}
            className="text-xs text-green-600 font-medium hover:underline">
            {showIntegration ? 'Hide Steps' : 'Show Setup Guide'}
          </button>
        </div>

        <div className="relative">
          <pre className="bg-gray-900 text-green-400 rounded-xl p-4 text-xs overflow-x-auto font-mono">
            {scriptData?.script || 'Loading...'}
          </pre>
          <button onClick={copyScript}
            className="absolute top-3 right-3 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors">
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {showIntegration && scriptData?.steps && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 space-y-3">
            {scriptData.steps.map((step) => (
              <div key={step.step} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-7 h-7 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {step.step}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{step.title}</p>
                  <p className="text-xs text-gray-400">{step.description}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Rate Card */}
      <div className="grid grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue Rates</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
              <span className="text-xs text-gray-600">CPM (per 1000 impressions)</span>
              <span className="text-sm font-bold text-green-600">${stats?.cpm_rate?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
              <span className="text-xs text-gray-600">CPC (per click)</span>
              <span className="text-sm font-bold text-blue-600">${stats?.cpc_rate?.toFixed(2)}</span>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Active Ad Categories</h3>
          <div className="flex flex-wrap gap-2">
            {(stats?.ad_categories || []).map(cat => (
              <span key={cat} className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-medium capitalize">{cat}</span>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-3">Update categories in Settings to control which ads appear on your site.</p>
        </motion.div>
      </div>
    </div>
  );
}
