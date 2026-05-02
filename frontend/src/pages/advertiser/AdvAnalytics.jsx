import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const INTENT_COLORS = {
  'browsing': '#10b981', 'exploring': '#06b6d4',
  'comparison shopper': '#3b82f6', 'potential buyer': '#f59e0b',
  'comparison_shopper': '#3b82f6', 'potential_buyer': '#f59e0b',
};

export default function AdvAnalytics() {
  const { authFetch } = useAuth();
  const [ads, setAds] = useState([]);
  const [topAds, setTopAds] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [stats, setStats] = useState(null);
  const [expandedAd, setExpandedAd] = useState(null);
  const [adAnalytics, setAdAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adLoading, setAdLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('14d');

  useEffect(() => {
    loadData();
  }, [timeRange]);

  async function loadData() {
    const days = timeRange.replace('d', '');
    try {
      const [adsRes, topAdsRes, timelineRes, statsRes] = await Promise.all([
        authFetch('/api/ads'),
        authFetch('/api/advertiser/top-ads'),
        authFetch(`/api/advertiser/timeline?days=${days}`),
        authFetch('/api/advertiser/stats'),
      ]);
      setAds(await adsRes.json());
      setTopAds(await topAdsRes.json());
      setTimeline(await timelineRes.json());
      setStats(await statsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadAdAnalytics(adId) {
    if (expandedAd === adId) {
      setExpandedAd(null);
      setAdAnalytics(null);
      return;
    }
    setExpandedAd(adId);
    setAdLoading(true);
    try {
      const res = await authFetch(`/api/advertiser/ads/${adId}/analytics`);
      setAdAnalytics(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setAdLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-12 bg-gray-100 rounded-2xl w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-3xl" />)}
        </div>
        <div className="h-80 bg-gray-100 rounded-3xl" />
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 px-4 py-3 rounded-2xl shadow-2xl">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">{label}</p>
          {payload.map((p, i) => (
            <p key={i} className="text-sm font-bold" style={{ color: p.color }}>
              {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // CTR timeline
  const ctrTimeline = timeline.map(d => ({ ...d, ctr: d.impressions > 0 ? parseFloat((d.clicks / d.impressions * 100).toFixed(2)) : 0 }));

  // Category performance from topAds
  const categoryPerf = {};
  topAds.forEach(a => {
    if (!categoryPerf[a.category]) categoryPerf[a.category] = { impressions: 0, clicks: 0 };
    categoryPerf[a.category].impressions += a.impressions;
    categoryPerf[a.category].clicks += a.clicks;
  });
  const categoryData = Object.entries(categoryPerf).map(([cat, data]) => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    impressions: data.impressions,
    clicks: data.clicks,
    ctr: data.impressions > 0 ? parseFloat((data.clicks / data.impressions * 100).toFixed(2)) : 0,
  })).sort((a, b) => b.impressions - a.impressions);

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-[#fafafa] min-h-screen">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold text-gray-900">Ad Analytics</h2>
        <p className="text-sm text-gray-400 mt-1">Deep performance insights for every ad</p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Impressions', value: (stats?.totalImpressions || 0).toLocaleString(), icon: '👁️', color: 'from-indigo-500 to-blue-500' },
          { label: 'Total Clicks', value: (stats?.totalClicks || 0).toLocaleString(), icon: '🖱️', color: 'from-blue-500 to-cyan-500' },
          { label: 'Average CTR', value: `${stats?.ctr || 0}%`, icon: '📊', color: 'from-cyan-500 to-teal-500' },
          { label: 'Active Ads', value: stats?.statusCounts?.active || 0, icon: '🟢', color: 'from-green-500 to-emerald-500' },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${kpi.color} opacity-5 blur-2xl -mr-4 -mt-4`} />
            <p className="text-2xl mb-1">{kpi.icon}</p>
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* CTR Timeline + Category Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CTR Timeline */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">CTR Trend</h3>
              <p className="text-sm text-gray-400">Click-through rate over time</p>
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
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ctrTimeline}>
                <defs>
                  <linearGradient id="colorCtrAdv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => v.slice(5)} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `${v}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="ctr" name="CTR (%)" stroke="#6366f1" strokeWidth={2.5} fill="url(#colorCtrAdv)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category Performance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Category Performance</h3>
          <p className="text-sm text-gray-400 mb-6">Impressions by category</p>
          {categoryData.length > 0 ? (
            <div className="space-y-4">
              {categoryData.map((cat, i) => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700">{cat.name}</span>
                    <span className="text-[10px] text-gray-400">{cat.impressions.toLocaleString()} imp · {cat.ctr}% CTR</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((cat.impressions / Math.max(...categoryData.map(c => c.impressions))) * 100, 100)}%` }}
                      transition={{ delay: 0.2 + i * 0.05, duration: 0.6 }}
                      className="h-full rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">No data yet</div>
          )}
        </motion.div>
      </div>

      {/* Per-Ad Analytics */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Per-Ad Performance</h3>
        <p className="text-sm text-gray-400 mb-6">Click any ad to see detailed analytics</p>

        <div className="space-y-3">
          {topAds.map((ad, i) => (
            <div key={ad.ad_id}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                onClick={() => loadAdAnalytics(ad.ad_id)}
                className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${expandedAd === ad.ad_id ? 'border-indigo-300 bg-indigo-50/30 shadow-sm' : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'}`}>
                {ad.image_url ? (
                  <img src={ad.image_url} alt="" className="w-14 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-14 h-10 rounded-lg bg-gray-100" />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">{ad.title}</h4>
                  <p className="text-[10px] text-gray-400 capitalize">{ad.category}</p>
                </div>
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{ad.impressions.toLocaleString()}</p>
                    <p className="text-[9px] text-gray-400">Impressions</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{ad.clicks.toLocaleString()}</p>
                    <p className="text-[9px] text-gray-400">Clicks</p>
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${ad.ctr > 5 ? 'text-green-600' : ad.ctr > 2 ? 'text-blue-600' : 'text-gray-900'}`}>{ad.ctr}%</p>
                    <p className="text-[9px] text-gray-400">CTR</p>
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${ad.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedAd === ad.ad_id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </motion.div>

              {/* Expanded Analytics */}
              <AnimatePresence>
                {expandedAd === ad.ad_id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden">
                    {adLoading ? (
                      <div className="p-8 text-center"><div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" /></div>
                    ) : adAnalytics ? (
                      <div className="p-6 bg-gray-50/50 rounded-b-xl border-x border-b border-gray-100 space-y-6">
                        {/* Mini KPIs */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-white p-4 rounded-xl border border-gray-100">
                            <p className="text-xs text-gray-400">Total Impressions</p>
                            <p className="text-xl font-bold text-gray-900">{adAnalytics.metrics.totalImpressions.toLocaleString()}</p>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-gray-100">
                            <p className="text-xs text-gray-400">Total Clicks</p>
                            <p className="text-xl font-bold text-gray-900">{adAnalytics.metrics.totalClicks.toLocaleString()}</p>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-gray-100">
                            <p className="text-xs text-gray-400">CTR</p>
                            <p className="text-xl font-bold text-indigo-600">{adAnalytics.metrics.ctr}%</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Daily Trend */}
                          <div className="bg-white p-6 rounded-xl border border-gray-100">
                            <h4 className="text-sm font-bold text-gray-900 mb-4">Daily Performance</h4>
                            <div className="h-[180px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={adAnalytics.dailyData}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9ca3af' }} tickFormatter={v => v.slice(5)} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9ca3af' }} />
                                  <Tooltip content={<CustomTooltip />} />
                                  <Area type="monotone" dataKey="impressions" name="Impressions" stroke="#6366f1" strokeWidth={2} fill="url(#colorCtrAdv)" dot={false} />
                                  <Area type="monotone" dataKey="clicks" name="Clicks" stroke="#3b82f6" strokeWidth={2} fill="none" dot={false} />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Intent Distribution */}
                          <div className="bg-white p-6 rounded-xl border border-gray-100">
                            <h4 className="text-sm font-bold text-gray-900 mb-4">Intent Stage Distribution</h4>
                            {adAnalytics.intentDistribution.length > 0 ? (
                              <>
                                <div className="h-[140px]">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie data={adAnalytics.intentDistribution.map(d => ({ ...d, name: d.stage, value: d.count }))}
                                        cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                                        {adAnalytics.intentDistribution.map((entry, i) => (
                                          <Cell key={i} fill={INTENT_COLORS[entry.stage] || COLORS[i % COLORS.length]} stroke="none" />
                                        ))}
                                      </Pie>
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                                <div className="space-y-1 mt-2">
                                  {adAnalytics.intentDistribution.map(d => (
                                    <div key={d.stage} className="flex items-center justify-between text-xs">
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full" style={{ background: INTENT_COLORS[d.stage] || '#6b7280' }} />
                                        <span className="text-gray-600 capitalize">{d.stage}</span>
                                      </div>
                                      <span className="font-semibold text-gray-900">{d.count} ({d.percentage}%)</span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <div className="text-center py-8 text-gray-400 text-xs">No click data yet</div>
                            )}
                          </div>
                        </div>

                        {/* AI Features */}
                        {adAnalytics.ad.extracted_features && (
                          <div className="bg-white p-6 rounded-xl border border-gray-100">
                            <h4 className="text-sm font-bold text-gray-900 mb-3">🤖 AI-Extracted Features</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {[
                                ['Product', adAnalytics.ad.extracted_features.product],
                                ['Brand', adAnalytics.ad.extracted_features.brand],
                                ['Target Intent', adAnalytics.ad.extracted_features.target_intent],
                                ['Price Range', adAnalytics.ad.extracted_features.price_range],
                              ].filter(([, v]) => v).map(([label, value]) => (
                                <div key={label} className="px-3 py-2 bg-indigo-50/50 rounded-lg border border-indigo-100">
                                  <span className="text-[9px] text-gray-400 uppercase tracking-wider">{label}</span>
                                  <p className="text-xs font-semibold text-gray-900 capitalize mt-0.5">{value}</p>
                                </div>
                              ))}
                            </div>
                            {adAnalytics.ad.extracted_features.keywords?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-3">
                                {adAnalytics.ad.extracted_features.keywords.map(kw => (
                                  <span key={kw} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-medium">{kw}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
          {topAds.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">📊</p>
              <p className="text-sm">No analytics data yet. Submit ads and wait for impressions to start flowing.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* AI Recommendations */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="bg-gradient-to-br from-indigo-500/5 to-blue-500/5 rounded-[32px] p-8 border border-indigo-100">
        <h3 className="text-lg font-bold text-gray-900 mb-1">🧠 AI Optimization Recommendations</h3>
        <p className="text-sm text-gray-400 mb-6">Data-driven suggestions to improve your ad performance</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(() => {
            const recs = [];
            const bestCat = categoryData[0];
            if (bestCat) recs.push({ title: 'Top Category', desc: `"${bestCat.name}" drives the most impressions (${bestCat.impressions.toLocaleString()}). Consider creating more ads in this category.`, tag: 'GROWTH', color: 'text-green-600 bg-green-50' });
            const bestAd = topAds[0];
            if (bestAd && bestAd.ctr > 0) recs.push({ title: 'Best Performer', desc: `"${bestAd.title}" has ${bestAd.ctr}% CTR — analyze its description style and replicate it.`, tag: 'INSIGHT', color: 'text-blue-600 bg-blue-50' });
            const avgCtr = stats?.ctr || 0;
            if (avgCtr < 3) recs.push({ title: 'Improve CTR', desc: 'Your average CTR is below 3%. Try more action-oriented CTA text and matching intent keywords.', tag: 'ACTION', color: 'text-amber-600 bg-amber-50' });
            else recs.push({ title: 'Strong CTR', desc: `Your ${avgCtr}% CTR is solid. Focus on scaling impressions to increase total clicks.`, tag: 'OPTIMIZE', color: 'text-indigo-600 bg-indigo-50' });
            return recs;
          })().map((rec, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${rec.color}`}>{rec.tag}</span>
              </div>
              <h4 className="text-sm font-bold text-gray-900">{rec.title}</h4>
              <p className="text-xs text-gray-500 mt-1">{rec.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
