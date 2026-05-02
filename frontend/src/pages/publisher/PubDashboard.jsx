import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useAuth } from '../../context/AuthContext';

const INTENT_COLORS = {
  'browsing': '#10b981',
  'exploring': '#06b6d4',
  'comparison shopper': '#3b82f6',
  'potential buyer': '#f59e0b',
  'comparing': '#3b82f6',
  'buying': '#f59e0b',
  'unknown': '#6b7280'
};

export default function PubDashboard() {
  const { authFetch, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [analytics, setAnalytics] = useState(null);
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
      const [statsRes, timelineRes, analyticsRes] = await Promise.all([
        authFetch('/api/publisher/stats'),
        authFetch(`/api/publisher/timeline?days=${days}`),
        authFetch('/api/publisher/analytics'),
      ]);
      setStats(await statsRes.json());
      setTimeline(await timelineRes.json());
      setAnalytics(await analyticsRes.json());
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

  const engagement = analytics?.engagement || {};
  const scrollPct = Math.round((engagement.avgScrollDepth || 0) * 100);
  const avgTime = Math.round(engagement.avgTimeSpent || 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 px-4 py-3 rounded-2xl shadow-2xl">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">{label}</p>
          {payload.map((p, i) => (
            <p key={i} className="text-sm font-bold" style={{ color: p.color }}>
              {p.name}: {p.name === 'Revenue' ? `$${p.value}` : p.value?.toLocaleString?.() ?? p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Revenue trend (compare last 7 days vs prior 7)
  const recentDays = timeline.slice(-7);
  const priorDays = timeline.slice(-14, -7);
  const recentRev = recentDays.reduce((s, d) => s + d.revenue, 0);
  const priorRev = priorDays.reduce((s, d) => s + d.revenue, 0);
  const revTrend = priorRev > 0 ? Math.round(((recentRev - priorRev) / priorRev) * 100) : 0;

  const intentData = (analytics?.intentDistribution || []).map(item => ({
    ...item,
    fill: INTENT_COLORS[item.stage] || '#6b7280'
  }));

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-[#fafafa] min-h-screen">
      {/* Welcome Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-[32px] p-8 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0a0e17 0%, #0f2419 50%, #0a1628 100%)' }}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/8 blur-[100px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[80px] -ml-32 -mb-32" />
        <div className="relative">
          <h1 className="text-2xl font-bold mb-1">Welcome back, {user?.name}</h1>
          <p className="text-emerald-400 text-sm font-medium">{stats?.website || user?.website_name} — Publisher Dashboard</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <MiniStat label="Revenue" value={`$${stats?.revenue?.toFixed(2) || '0.00'}`} trend={revTrend} />
            <MiniStat label="Impressions" value={stats?.impressions?.toLocaleString() || '0'} />
            <MiniStat label="Clicks" value={stats?.clicks?.toLocaleString() || '0'} />
            <MiniStat label="CTR" value={`${stats?.ctr || 0}%`} />
            <MiniStat label="RPM" value={`$${((stats?.revenue / stats?.impressions) * 1000 || 0).toFixed(2)}`} />
          </div>
        </div>
      </motion.div>

      {/* Main Chart + Intent Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Revenue Performance</h3>
              <p className="text-sm text-gray-400">Daily earnings and traffic trends</p>
            </div>
            <div className="flex bg-gray-50 p-1 rounded-xl">
              {['7d', '14d', '30d'].map(range => (
                <button key={range} onClick={() => setTimeRange(range)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timeRange === range ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorImpD" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.08} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => v.slice(5)} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `$${v}`} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area yAxisId="right" name="Impressions" type="monotone" dataKey="impressions" stroke="#3b82f6" strokeWidth={1.5} fillOpacity={1} fill="url(#colorImpD)" />
                <Area yAxisId="left" name="Revenue" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-6 mt-3">
            <div className="flex items-center gap-2"><div className="w-3 h-1.5 rounded-full bg-emerald-500" /><span className="text-[10px] text-gray-400 font-medium">Revenue</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-1.5 rounded-full bg-blue-500" /><span className="text-[10px] text-gray-400 font-medium">Impressions</span></div>
          </div>
        </motion.div>

        {/* Intent Engine */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Intent Engine</h3>
          <p className="text-sm text-gray-400 mb-4">User intent stages</p>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={intentData} innerRadius={55} outerRadius={78} paddingAngle={6} dataKey="value" nameKey="stage">
                  {intentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {intentData.map(item => (
              <div key={item.stage} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-xs font-medium text-gray-600 capitalize">{item.stage}</span>
                </div>
                <span className="text-xs font-bold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/pub/analytics')}
            className="mt-4 text-xs text-emerald-600 font-bold hover:underline text-center">
            View Full Analytics →
          </button>
        </motion.div>
      </div>

      {/* Bottom Row: Category + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Category Performance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Top Categories</h3>
            <button onClick={() => navigate('/pub/analytics')}
              className="text-xs text-emerald-600 font-bold hover:underline">
              See All →
            </button>
          </div>
          <div className="space-y-4">
            {(analytics?.categoryPerformance || []).slice(0, 5).map((cat, i) => (
              <div key={cat.category} className="flex items-center gap-4">
                <span className="text-xs font-bold text-gray-300 w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-700 capitalize">{cat.category}</span>
                    <span className="text-sm font-bold text-emerald-600">${cat.revenue}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-gray-50 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(5, (cat.revenue / (stats?.revenue || 1)) * 100)}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className="h-full bg-emerald-500 rounded-full" />
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium w-16 text-right">{cat.impressions} imp</span>
                    <span className="text-[10px] text-gray-400 font-medium w-12 text-right">{cat.ctr}% CTR</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="space-y-4">
          {/* Engagement Summary */}
          <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100">
            <h4 className="text-sm font-bold text-gray-900 mb-4">Engagement Summary</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Avg. Scroll Depth</span>
                <span className="text-sm font-bold text-emerald-600">{scrollPct}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Avg. Session Time</span>
                <span className="text-sm font-bold text-blue-600">{avgTime}s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Active Categories</span>
                <span className="text-sm font-bold text-gray-900">{stats?.ad_categories?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Revenue Rates */}
          <div className="bg-gray-900 rounded-[28px] p-6 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] -mr-16 -mt-16" />
            <h4 className="text-sm font-bold mb-4 relative">Revenue Rates</h4>
            <div className="space-y-3 relative">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                <span className="text-xs text-gray-400">CPM</span>
                <span className="text-sm font-bold text-emerald-400">${stats?.cpm_rate?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                <span className="text-xs text-gray-400">CPC</span>
                <span className="text-sm font-bold text-emerald-400">${stats?.cpc_rate?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <button onClick={() => navigate('/pub/integration')}
            className="w-full p-4 bg-emerald-50 border border-emerald-200 rounded-[20px] text-left hover:shadow-md transition-all group">
            <div className="flex items-center gap-3">
              <span className="text-lg group-hover:scale-110 transition-transform">🔌</span>
              <div>
                <p className="text-sm font-bold text-emerald-700">Setup Integration</p>
                <p className="text-[10px] text-emerald-500">Add ads to your website →</p>
              </div>
            </div>
          </button>
        </motion.div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, trend }) {
  return (
    <div className="bg-white/8 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/5">
      <p className="text-[10px] text-gray-400 font-medium mb-0.5">{label}</p>
      <div className="flex items-end gap-2">
        <p className="text-xl font-bold text-white leading-none">{value}</p>
        {trend !== undefined && trend !== 0 && (
          <span className={`text-[10px] font-bold ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend > 0 ? '↑' : '↓'}{Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}
