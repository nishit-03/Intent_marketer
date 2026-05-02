import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];
const categories = ['tech', 'finance', 'travel', 'health', 'education', 'ecommerce'];

export default function AdvDashboard() {
  const { authFetch, user } = useAuth();
  const [ads, setAds] = useState([]);
  const [selectedAd, setSelectedAd] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', category: 'tech', image_url: '', cta_text: 'Learn More', cta_url: '',
  });

  useEffect(() => {
    loadAds();
    const interval = setInterval(loadAds, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadAds() {
    try {
      const res = await authFetch('/api/ads');
      if (res.ok) setAds(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const res = await authFetch('/api/ads', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setShowForm(false);
        setForm({ title: '', description: '', category: 'tech', image_url: '', cta_text: 'Learn More', cta_url: '' });
        loadAds();
      } else {
        setMessage(data.error);
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const statusColors = {
    active: 'bg-green-50 text-green-700',
    processing: 'bg-yellow-50 text-yellow-700',
    paused: 'bg-gray-100 text-gray-500',
    failed: 'bg-red-50 text-red-700',
  };

  const totalImpressions = ads.length * 150; // Simulated aggregate
  const totalClicks = Math.floor(totalImpressions * 0.08);

  // Category distribution
  const catDist = categories.map(cat => ({
    name: cat,
    count: ads.filter(a => a.category === cat).length,
  })).filter(c => c.count > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-8 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0a0e17, #1a1a3e)' }}>
        <h1 className="text-2xl font-bold mb-1">Welcome, {user?.name}</h1>
        <p className="text-blue-300 text-sm">{user?.company_name || 'Advertiser'} Dashboard</p>
        <div className="flex gap-4 mt-5">
          <div className="bg-white/10 rounded-xl px-5 py-3"><p className="text-2xl font-bold">{ads.length}</p><p className="text-[10px] text-gray-400">Total Ads</p></div>
          <div className="bg-white/10 rounded-xl px-5 py-3"><p className="text-2xl font-bold">{ads.filter(a => a.status === 'active').length}</p><p className="text-[10px] text-gray-400">Active</p></div>
          <div className="bg-white/10 rounded-xl px-5 py-3"><p className="text-2xl font-bold text-green-400">{ads.filter(a => a.status === 'processing').length}</p><p className="text-[10px] text-gray-400">Processing</p></div>
        </div>
      </motion.div>

      {/* Create Ad Button + Form */}
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-gray-900">Your Ads</h3>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all">
          {showForm ? 'Cancel' : '+ Submit New Ad'}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl p-6 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Submit New Ad</h3>
            <p className="text-xs text-gray-400 mb-4">Our AI (Groq LLaMA) will automatically analyze your ad and extract targeting features.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Ad Title *</label>
                  <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Category *</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                    {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Description *</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Image URL</label>
                  <input type="url" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">CTA Text</label>
                  <input type="text" value={form.cta_text} onChange={e => setForm({ ...form, cta_text: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">CTA URL</label>
                  <input type="url" value={form.cta_url} onChange={e => setForm({ ...form, cta_url: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="https://yoursite.com/product" />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-50">
                  {submitting ? 'Processing...' : 'Submit for AI Analysis'}
                </button>
              </div>
            </form>
            {message && <p className="mt-3 text-sm text-green-600">{message}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ads List */}
      <div className="space-y-3">
        {ads.map((ad, i) => (
          <motion.div key={ad.ad_id || ad._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }} onClick={() => setSelectedAd(selectedAd?.ad_id === ad.ad_id ? null : ad)}
            className={`bg-white p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${selectedAd?.ad_id === ad.ad_id ? 'border-blue-300 bg-blue-50/20' : 'border-gray-100'}`}>
            <div className="flex items-center gap-4">
              {ad.image_url && <img src={ad.image_url} alt="" className="w-16 h-12 rounded-lg object-cover" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">{ad.title}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[ad.status] || ''}`}>{ad.status}</span>
                </div>
                <p className="text-xs text-gray-400 truncate">{ad.description}</p>
              </div>
              <span className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px] capitalize">{ad.category}</span>
            </div>

            <AnimatePresence>
              {selectedAd?.ad_id === ad.ad_id && ad.extracted_features && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-blue-600 mb-2">AI-Extracted Features</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[['Product', ad.extracted_features.product], ['Brand', ad.extracted_features.brand], ['Target Intent', ad.extracted_features.target_intent], ['Price Range', ad.extracted_features.price_range]].map(([l, v]) => v && (
                      <div key={l} className="px-3 py-1.5 bg-gray-50 rounded-lg">
                        <span className="text-[10px] text-gray-400">{l}</span>
                        <p className="text-xs font-medium capitalize">{v}</p>
                      </div>
                    ))}
                  </div>
                  {ad.extracted_features.keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {ad.extracted_features.keywords.map(kw => (
                        <span key={kw} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px]">{kw}</span>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
        {ads.length === 0 && !loading && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm">No ads yet. Click "Submit New Ad" to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}
