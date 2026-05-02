import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
const STATUS_COLORS = { active: '#22c55e', processing: '#f59e0b', paused: '#94a3b8', failed: '#ef4444' };

export default function AdvDashboard() {
  const { authFetch, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [topAds, setTopAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('14d');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  async function loadData() {
    const days = timeRange.replace('d', '');
    try {
      const [statsRes, timelineRes, topAdsRes] = await Promise.all([
        authFetch('/api/advertiser/stats'),
        authFetch(`/api/advertiser/timeline?days=${days}`),
        authFetch('/api/advertiser/top-ads'),
      ]);
      setStats(await statsRes.json());
      setTimeline(await timelineRes.json());
      setTopAds(await topAdsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 space-y-8 animate-pulse">
        <div className="h-48 bg-gray-100 rounded-3xl" />
        <div className="grid grid-cols-3 gap-6">
          <div className="h-64 bg-gray-100 rounded-3xl col-span-2" />
          <div className="h-64 bg-gray-100 rounded-3xl" />
        </div>
      </div>
    );
  }

  const MiniStat = ({ label, value, accent }) => (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3">
      <p className={`text-2xl font-bold ${accent || ''}`}>{value}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 px-4 py-3 rounded-2xl shadow-2xl">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">{label}</p>
          {payload.map((p, i) => (
            <p key={i} className="text-sm font-bold" style={{ color: p.color }}>
              {p.name}: {p.value?.toLocaleString?.() ?? p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Status pie chart data
  const statusData = stats?.statusCounts
    ? Object.entries(stats.statusCounts).filter(([, v]) => v > 0).map(([k, v]) => ({ name: k, value: v, fill: STATUS_COLORS[k] }))
    : [];

  // Category bar chart data
  const categoryData = stats?.categoryCounts
    ? Object.entries(stats.categoryCounts).map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), count: v }))
    : [];

  // Trend calc
  const recentDays = timeline.slice(-7);
  const priorDays = timeline.slice(-14, -7);
  const recentImp = recentDays.reduce((s, d) => s + d.impressions, 0);
  const priorImp = priorDays.reduce((s, d) => s + d.impressions, 0);
  const impTrend = priorImp > 0 ? Math.round(((recentImp - priorImp) / priorImp) * 100) : 0;

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-[#fafafa] min-h-screen">
      {/* Welcome Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-[32px] p-8 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0a0e17 0%, #0f1428 50%, #1a0a28 100%)' }}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/8 blur-[100px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[80px] -ml-32 -mb-32" />
        <div className="relative">
          <h1 className="text-2xl font-bold mb-1">Welcome back, {user?.name}</h1>
          <p className="text-indigo-400 text-sm font-medium">{stats?.advertiserName || user?.company_name} — Advertiser Dashboard</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <MiniStat label="Total Ads" value={stats?.totalAds || 0} />
            <MiniStat label="Impressions" value={(stats?.totalImpressions || 0).toLocaleString()} />
            <MiniStat label="Clicks" value={(stats?.totalClicks || 0).toLocaleString()} />
            <MiniStat label="Avg CTR" value={`${stats?.ctr || 0}%`} />
            <MiniStat label="Est. Spend" value={`$${stats?.estimatedSpend?.toFixed(2) || '0.00'}`} accent="text-indigo-400" />
          </div>
        </div>
      </motion.div>

      {/* Performance Chart + Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Performance Overview</h3>
              <p className="text-sm text-gray-400">Impressions and clicks trend</p>
            </div>
            <div className="flex bg-gray-50 p-1 rounded-xl">
              {['7d', '14d', '30d'].map(range => (
                <button key={range} onClick={() => setTimeRange(range)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timeRange === range ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="colorImpAdv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorClkAdv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => v.slice(5)} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="impressions" name="Impressions" stroke="#6366f1" strokeWidth={2.5} fill="url(#colorImpAdv)" dot={false} />
                <Area type="monotone" dataKey="clicks" name="Clicks" stroke="#3b82f6" strokeWidth={2.5} fill="url(#colorClkAdv)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-6 mt-4 justify-center">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500" /><span className="text-xs text-gray-500">Impressions</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /><span className="text-xs text-gray-500">Clicks</span></div>
            {impTrend !== 0 && <span className={`text-xs font-semibold ${impTrend > 0 ? 'text-green-600' : 'text-red-500'}`}>{impTrend > 0 ? '+' : ''}{impTrend}% vs prior</span>}
          </div>
        </motion.div>

        {/* Status Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Ad Status</h3>
          <p className="text-sm text-gray-400 mb-6">Current ad states</p>
          {statusData.length > 0 ? (
            <>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" animationBegin={0} animationDuration={800}>
                      {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} stroke="none" />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {statusData.map(s => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.fill }} />
                      <span className="text-sm text-gray-600 capitalize">{s.name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm">No ads yet</p>
            </div>
          )}
          <button onClick={() => navigate('/adv/create')}
            className="w-full mt-6 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all">
            + Create New Ad
          </button>
        </motion.div>
      </div>

      {/* Category Distribution + Top Performing Ads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Category Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Category Distribution</h3>
          <p className="text-sm text-gray-400 mb-6">Your ads by category</p>
          {categoryData.length > 0 ? (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Ads" radius={[0, 8, 8, 0]} barSize={20}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">No data available</div>
          )}
        </motion.div>

        {/* Top Performing Ads */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Top Performing Ads</h3>
              <p className="text-sm text-gray-400">Ranked by click-through rate</p>
            </div>
            <button onClick={() => navigate('/adv/analytics')} className="text-indigo-600 text-xs font-semibold hover:underline">See All →</button>
          </div>
          <div className="space-y-3">
            {topAds.slice(0, 5).map((ad, i) => (
              <div key={ad.ad_id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <span className="text-xs text-gray-400 w-6 font-bold">{i + 1}</span>
                {ad.image_url && <img src={ad.image_url} alt="" className="w-12 h-9 rounded-lg object-cover" />}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">{ad.title}</h4>
                  <p className="text-[10px] text-gray-400 capitalize">{ad.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{ad.ctr}%</p>
                  <p className="text-[10px] text-gray-400">{ad.impressions.toLocaleString()} imp</p>
                </div>
                <div className={`w-2 h-2 rounded-full ${ad.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
              </div>
            ))}
            {topAds.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p className="text-3xl mb-2">📊</p>
                <p className="text-sm">No performance data yet. Create ads to start tracking!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          onClick={() => navigate('/adv/create')}
          className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-[24px] p-6 text-white cursor-pointer hover:shadow-xl transition-all">
          <p className="text-2xl mb-2">➕</p>
          <h4 className="font-bold">Create New Ad</h4>
          <p className="text-xs text-indigo-200 mt-1">AI-powered feature extraction</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          onClick={() => navigate('/adv/analytics')}
          className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-[24px] p-6 text-white cursor-pointer hover:shadow-xl transition-all">
          <p className="text-2xl mb-2">📈</p>
          <h4 className="font-bold">View Analytics</h4>
          <p className="text-xs text-blue-200 mt-1">Per-ad performance & intent analysis</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm">
          <p className="text-2xl mb-2">🤖</p>
          <h4 className="font-bold text-gray-900">AI Analysis</h4>
          <p className="text-xs text-gray-400 mt-1">Every ad is analyzed by Groq LLaMA for optimal targeting</p>
        </motion.div>
      </div>
    </div>
  );
}
