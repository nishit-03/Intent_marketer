import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import * as api from '../services/api';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

function MetricCard({ label, value, change, icon, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: `${color}15` }}>
          {icon}
        </div>
        {change && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${change > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {change > 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </motion.div>
  );
}

function ChartCard({ title, subtitle, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white rounded-2xl p-6 border border-gray-100"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </motion.div>
  );
}

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [intentCTR, setIntentCTR] = useState([]);
  const [topAds, setTopAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [ov, tl, cs, ic, ta] = await Promise.all([
          api.getAnalyticsOverview(),
          api.getTimeline(14),
          api.getCategoryStats(),
          api.getIntentCTR(),
          api.getTopAds(5),
        ]);
        setOverview(ov);
        setTimeline(tl);
        setCategoryStats(cs);
        setIntentCTR(ic);
        setTopAds(ta);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => <div key={i} className="skeleton h-80 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-8 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0a0e17 0%, #1a2332 50%, #0f2419 100%)' }}
      >
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-1">Complete overview of your</h1>
          <h1 className="text-2xl font-light text-green-300">advertising intelligence</h1>
          <div className="flex items-center gap-6 mt-5">
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <span className="text-xs text-gray-300">Privacy Score</span>
              <span className="text-sm font-bold text-green-400">100%</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <span className="text-xs text-gray-300">Zero Cookies</span>
              <span className="text-green-400">✓</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <span className="text-xs text-gray-300">Intent-Based</span>
              <span className="text-green-400">✓</span>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10"
          style={{ background: 'radial-gradient(circle, #22c55e, transparent 70%)' }} />
      </motion.div>

      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-6">
        <MetricCard label="Total Impressions" value={overview?.totalImpressions || 0} icon="👁️" color="#3b82f6" change={12.5} delay={0.1} />
        <MetricCard label="Total Clicks" value={overview?.totalClicks || 0} icon="🖱️" color="#22c55e" change={8.3} delay={0.15} />
        <MetricCard label="Click-Through Rate" value={`${overview?.ctr || 0}%`} icon="📈" color="#f59e0b" change={3.2} delay={0.2} />
        <MetricCard label="Active Sessions" value={overview?.activeSessions || 0} icon="👤" color="#8b5cf6" change={15.7} delay={0.25} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <ChartCard title="Performance Trend" subtitle="Impressions & Clicks over time" delay={0.3}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="gradImpressions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Area type="monotone" dataKey="impressions" stroke="#22c55e" strokeWidth={2} fill="url(#gradImpressions)" />
                <Area type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={2} fill="url(#gradClicks)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard title="Intent Distribution" subtitle="User intent stages" delay={0.35}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={intentCTR.map(d => ({ name: d.stage, value: d.impressions || 1 }))}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={90}
                paddingAngle={4}
                dataKey="value"
              >
                {intentCTR.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {intentCTR.map((d, i) => (
              <div key={d.stage} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                <span className="text-[10px] text-gray-500 capitalize">{d.stage}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-2 gap-6">
        <ChartCard title="Performance by Category" subtitle="Impressions per ad category" delay={0.4}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={categoryStats} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="impressions" fill="#22c55e" radius={[6, 6, 0, 0]} />
              <Bar dataKey="clicks" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Intent Stage vs CTR" subtitle="Click-through rate by user intent" delay={0.45}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={intentCTR} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} unit="%" />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="ctr" radius={[6, 6, 0, 0]}>
                {intentCTR.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top Ads Table */}
      <ChartCard title="Top Performing Ads" subtitle="Ranked by total clicks" delay={0.5}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left py-3 font-medium">#</th>
                <th className="text-left py-3 font-medium">Ad Title</th>
                <th className="text-left py-3 font-medium">Category</th>
                <th className="text-right py-3 font-medium">Impressions</th>
                <th className="text-right py-3 font-medium">Clicks</th>
                <th className="text-right py-3 font-medium">CTR</th>
              </tr>
            </thead>
            <tbody>
              {topAds.map((ad, i) => (
                <tr key={ad.ad_id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-gray-200 text-gray-500'}`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-3 font-medium text-gray-900">{ad.title}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs capitalize">{ad.category}</span>
                  </td>
                  <td className="py-3 text-right text-gray-600">{ad.impressions?.toLocaleString()}</td>
                  <td className="py-3 text-right text-gray-600">{ad.clicks?.toLocaleString()}</td>
                  <td className="py-3 text-right">
                    <span className="font-semibold text-green-600">{ad.ctr}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* AI Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-2xl p-6 border border-gray-100"
      >
        <h3 className="text-sm font-semibold text-gray-900 mb-4">🤖 AI Intelligence Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-xl border border-green-100">
            <p className="text-xs text-green-600 font-medium mb-1">Privacy Status</p>
            <p className="text-sm text-gray-700">Zero personal data collected. All {overview?.activeSessions || 0} sessions are anonymous.</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-600 font-medium mb-1">Top Insight</p>
            <p className="text-sm text-gray-700">
              {categoryStats[0] ? `${categoryStats[0].category} category leads with ${categoryStats[0].impressions} impressions` : 'Collecting data...'}
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
            <p className="text-xs text-purple-600 font-medium mb-1">Recommendation</p>
            <p className="text-sm text-gray-700">
              {intentCTR.find(d => d.stage === 'potential buyer')?.ctr > 0
                ? `Buying intent shows ${intentCTR.find(d => d.stage === 'potential buyer')?.ctr}% CTR — optimize ads for purchase intent.`
                : 'Enable more session tracking to unlock insights.'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
