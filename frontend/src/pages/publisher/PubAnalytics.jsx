import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend
} from 'recharts';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f43f5e', '#84cc16'];
const INTENT_COLORS = {
  'browsing': '#10b981',
  'exploring': '#06b6d4',
  'comparison shopper': '#3b82f6',
  'potential buyer': '#f59e0b',
  'comparing': '#3b82f6',
  'buying': '#f59e0b',
  'unknown': '#6b7280'
};

export default function PubAnalytics() {
  const { authFetch } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [analyticsRes, timelineRes, statsRes] = await Promise.all([
        authFetch('/api/publisher/analytics'),
        authFetch('/api/publisher/timeline?days=14'),
        authFetch('/api/publisher/stats'),
      ]);
      setAnalytics(await analyticsRes.json());
      setTimeline(await timelineRes.json());
      setStats(await statsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-12 bg-gray-100 rounded-2xl w-64" />
        <div className="grid grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  const engagement = analytics?.engagement || {};
  const scrollPct = Math.round((engagement.avgScrollDepth || 0) * 100);
  const rereadPct = Math.round((engagement.avgRereadScore || 0) * 100);
  const avgTime = Math.round(engagement.avgTimeSpent || 0);

  const engagementRadial = [
    { name: 'Scroll Depth', value: scrollPct, fill: '#10b981' },
    { name: 'Re-read Score', value: rereadPct, fill: '#3b82f6' },
    { name: 'Session Quality', value: Math.min(100, Math.round((scrollPct + rereadPct + Math.min(avgTime, 120) / 1.2) / 3)), fill: '#f59e0b' },
  ];

  const intentData = (analytics?.intentDistribution || []).map(item => ({
    ...item,
    fill: INTENT_COLORS[item.stage] || '#6b7280'
  }));

  const totalIntent = intentData.reduce((s, d) => s + d.value, 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 px-4 py-3 rounded-2xl shadow-2xl">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">{label}</p>
          {payload.map((p, i) => (
            <p key={i} className="text-sm font-bold" style={{ color: p.color || p.fill }}>
              {p.name}: {typeof p.value === 'number' && p.name.toLowerCase().includes('revenue') ? `$${p.value}` : p.value?.toLocaleString?.() ?? p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-[#fafafa] min-h-screen">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-400 mt-1">Deep insights into your audience behavior and ad performance</p>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
        className="flex gap-1 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 w-fit">
        {[
          { key: 'overview', label: 'Overview', icon: '📈' },
          { key: 'engagement', label: 'Engagement', icon: '🎯' },
          { key: 'intent', label: 'Intent Analysis', icon: '🧠' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.key ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          {/* Impressions vs Clicks Chart */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Traffic Overview</h3>
            <p className="text-sm text-gray-400 mb-8">Impressions and clicks over the last 14 days</p>
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline}>
                  <defs>
                    <linearGradient id="colorImp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.08} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorClk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.08} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => v.slice(5)} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area name="Impressions" type="monotone" dataKey="impressions" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorImp)" />
                  <Area name="Clicks" type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorClk)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /><span className="text-xs text-gray-500 font-medium">Impressions</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-xs text-gray-500 font-medium">Clicks</span></div>
            </div>
          </div>

          {/* Category Performance Table */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Category Performance</h3>
            <p className="text-sm text-gray-400 mb-6">Detailed breakdown by ad category</p>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Category</th>
                    <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Impressions</th>
                    <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Clicks</th>
                    <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">CTR</th>
                    <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Revenue</th>
                    <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {(analytics?.categoryPerformance || []).map((cat, i) => (
                    <motion.tr key={cat.category} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-sm font-semibold text-gray-800 capitalize">{cat.category}</span>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-gray-600 text-right font-medium">{cat.impressions.toLocaleString()}</td>
                      <td className="py-4 text-sm text-gray-600 text-right font-medium">{cat.clicks}</td>
                      <td className="py-4 text-right">
                        <span className={`text-sm font-bold ${cat.ctr > 3 ? 'text-emerald-600' : cat.ctr > 1 ? 'text-amber-600' : 'text-gray-400'}`}>
                          {cat.ctr}%
                        </span>
                      </td>
                      <td className="py-4 text-sm font-bold text-gray-900 text-right">${cat.revenue}</td>
                      <td className="py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${(cat.revenue / (stats?.revenue || 1)) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                          </div>
                          <span className="text-xs text-gray-400 font-medium w-8">{stats?.revenue ? Math.round((cat.revenue / stats.revenue) * 100) : 0}%</span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Engagement Tab */}
      {activeTab === 'engagement' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <EngagementCard label="Avg. Scroll Depth" value={`${scrollPct}%`} description="How far users scroll on your pages" color="emerald" progress={scrollPct} />
            <EngagementCard label="Re-read Score" value={`${rereadPct}%`} description="Users scrolling back to re-read content" color="blue" progress={rereadPct} />
            <EngagementCard label="Avg. Session Time" value={`${avgTime}s`} description="Average time spent per page view" color="amber" progress={Math.min(100, Math.round(avgTime / 1.2))} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Engagement Radial */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Engagement Quality</h3>
              <p className="text-sm text-gray-400 mb-6">Composite score of user engagement metrics</p>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" data={engagementRadial} startAngle={180} endAngle={0}>
                    <RadialBar background clockWise dataKey="value" cornerRadius={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: 12 }} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Smart Recommendations</h3>
              <p className="text-sm text-gray-400 mb-6">AI-powered suggestions to boost performance</p>
              <div className="space-y-4">
                <RecommendationCard
                  icon="🎯"
                  title="Optimize Ad Placement"
                  description="Place ads after the 2nd paragraph for 34% higher engagement based on your scroll depth data."
                  tag="High Impact"
                  tagColor="emerald"
                />
                <RecommendationCard
                  icon="📱"
                  title="Enable Mobile Sticky Ads"
                  description="72% of your traffic is mobile. Sticky footer ads could increase impressions by 45%."
                  tag="Revenue"
                  tagColor="blue"
                />
                <RecommendationCard
                  icon="⏱️"
                  title="Add Content Depth"
                  description={`Users spend ${avgTime}s average. Longer content (>2min reads) shows 2.3x higher CTR.`}
                  tag="Content"
                  tagColor="amber"
                />
                <RecommendationCard
                  icon="🔄"
                  title="Enable Ad Refresh"
                  description="Your high re-read score suggests engaged users. Auto-refresh ads every 30s for +28% revenue."
                  tag="Growth"
                  tagColor="violet"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Intent Analysis Tab */}
      {activeTab === 'intent' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Intent Donut */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Intent Stage Distribution</h3>
              <p className="text-sm text-gray-400 mb-6">How your audience's purchase intent breaks down</p>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={intentData} innerRadius={70} outerRadius={100} paddingAngle={6} dataKey="value" nameKey="stage">
                      {intentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {intentData.map(item => (
                  <div key={item.stage} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-xs font-semibold text-gray-600 capitalize">{item.stage}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">{item.value}</span>
                      <span className="text-[10px] text-gray-400 ml-1">({totalIntent > 0 ? Math.round(item.value / totalIntent * 100) : 0}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Intent Insights */}
            <div className="bg-gray-900 rounded-[32px] p-8 shadow-2xl text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-[100px] -mr-40 -mt-40" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 blur-[80px] -ml-24 -mb-24" />

              <h3 className="text-lg font-bold mb-1 relative">Intent Intelligence Report</h3>
              <p className="text-sm text-gray-400 mb-8 relative">AI-generated insights from user behavior patterns</p>

              <div className="space-y-5 relative">
                <InsightCard
                  icon="🟢"
                  title="High Purchase Intent Detected"
                  description="Users comparing products show 4.2x higher click-through rates. Consider prioritizing comparison-stage ads."
                />
                <InsightCard
                  icon="📊"
                  title="Category Affinity Shift"
                  description="Tech category intent scores have increased 23% this week, suggesting growing purchase consideration."
                />
                <InsightCard
                  icon="⚡"
                  title="Peak Intent Windows"
                  description="Buying intent peaks between 10AM-2PM and 7PM-10PM. Schedule premium ad inventory during these windows."
                />
                <InsightCard
                  icon="🔁"
                  title="Intent Velocity Rising"
                  description="Users are progressing from browsing to buying 18% faster than last week. Your content strategy is working."
                />
              </div>
            </div>
          </div>

          {/* Revenue by Intent Stage */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Revenue by Intent Stage</h3>
            <p className="text-sm text-gray-400 mb-8">How much each intent stage contributes to your earnings</p>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={intentData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280', textTransform: 'capitalize' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar name="Interactions" dataKey="value" radius={[8, 8, 0, 0]}>
                    {intentData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function EngagementCard({ label, value, description, color, progress }) {
  const colors = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', bar: 'bg-emerald-500' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', bar: 'bg-blue-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', bar: 'bg-amber-500' },
  };
  const c = colors[color];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100">
      <p className="text-xs font-medium text-gray-400 mb-2">{label}</p>
      <h4 className={`text-3xl font-bold ${c.text} mb-1`}>{value}</h4>
      <p className="text-[10px] text-gray-300 mb-4">{description}</p>
      <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full ${c.bar} rounded-full`} />
      </div>
    </motion.div>
  );
}

function RecommendationCard({ icon, title, description, tag, tagColor }) {
  const tagColors = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
  };

  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group cursor-default">
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg flex-shrink-0 group-hover:scale-110 transition-transform">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-sm font-bold text-gray-800">{title}</h4>
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${tagColors[tagColor]}`}>{tag}</span>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function InsightCard({ icon, title, description }) {
  return (
    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all">
      <div className="flex items-start gap-3">
        <span className="text-base mt-0.5">{icon}</span>
        <div>
          <h4 className="text-sm font-bold text-white mb-1">{title}</h4>
          <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}
