import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = ['tech', 'finance', 'travel', 'health', 'education', 'ecommerce'];

export default function AdvCreateAd() {
  const { authFetch } = useAuth();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [form, setForm] = useState({
    title: '', description: '', category: 'tech', image_url: '',
    cta_text: 'Learn More', cta_url: '', advertiser_name: '',
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
    setMessage({ text: '', type: '' });
    try {
      const res = await authFetch('/api/ads', { method: 'POST', body: JSON.stringify(form) });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: '✅ Ad submitted! AI is analyzing your ad for optimal targeting...', type: 'success' });
        setForm({ title: '', description: '', category: 'tech', image_url: '', cta_text: 'Learn More', cta_url: '', advertiser_name: '' });
        loadAds();
      } else {
        setMessage({ text: data.error || 'Failed to submit ad', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(ad) {
    const newStatus = ad.status === 'active' ? 'paused' : 'active';
    try {
      await authFetch(`/api/ads/${ad.ad_id}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
      loadAds();
    } catch (err) { console.error(err); }
  }

  async function handleDelete(adId) {
    if (!confirm('Delete this ad permanently?')) return;
    try {
      await authFetch(`/api/ads/${adId}`, { method: 'DELETE' });
      loadAds();
    } catch (err) { console.error(err); }
  }

  const statusColors = {
    active: 'bg-green-50 text-green-700 border-green-200',
    processing: 'bg-amber-50 text-amber-700 border-amber-200',
    paused: 'bg-gray-50 text-gray-500 border-gray-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
  };

  const statusIcons = { active: '🟢', processing: '⏳', paused: '⏸️', failed: '❌' };

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-[#fafafa] min-h-screen">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold text-gray-900">Create & Manage Ads</h2>
        <p className="text-sm text-gray-400 mt-1">Submit ads for AI-powered feature extraction and targeting</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Ad Creation Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="lg:col-span-3 bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white text-lg">✏️</div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">New Ad Submission</h3>
              <p className="text-xs text-gray-400">Our Groq LLaMA AI will automatically extract targeting features</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title + Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ad Title *</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
                  placeholder="e.g. MacBook Pro M4 — Ultimate Performance"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Category *</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ad Description *</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required rows={4}
                placeholder="Write a compelling ad description. The AI will analyze this to extract keywords, target intent, brand, and more..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all resize-none" />
            </div>

            {/* Image URL + Advertiser Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Image URL</label>
                <input type="url" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Advertiser Name</label>
                <input type="text" value={form.advertiser_name} onChange={e => setForm({ ...form, advertiser_name: e.target.value })}
                  placeholder="Your Brand Name"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all" />
              </div>
            </div>

            {/* CTA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">CTA Button Text</label>
                <input type="text" value={form.cta_text} onChange={e => setForm({ ...form, cta_text: e.target.value })}
                  placeholder="Learn More"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">CTA URL</label>
                <input type="url" value={form.cta_url} onChange={e => setForm({ ...form, cta_url: e.target.value })}
                  placeholder="https://yoursite.com/product"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-[10px] text-gray-400">🤖 AI will extract: keywords, brand, target intent, price range</p>
              <button type="submit" disabled={submitting}
                className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl text-sm font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? (
                  <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</span>
                ) : 'Submit for AI Analysis'}
              </button>
            </div>
          </form>

          <AnimatePresence>
            {message.text && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`mt-4 p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Live Preview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Ad Preview</h3>
            <p className="text-xs text-gray-400 mb-6">How your ad will appear on publisher sites</p>

            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              {form.image_url && (
                <img src={form.image_url} alt="Preview" className="w-full h-40 object-cover rounded-xl mb-3"
                  onError={e => { e.target.style.display = 'none'; }} />
              )}
              {!form.image_url && (
                <div className="w-full h-40 bg-gradient-to-br from-indigo-100 to-blue-50 rounded-xl mb-3 flex items-center justify-center">
                  <span className="text-gray-300 text-sm">Image Preview</span>
                </div>
              )}
              <h4 className="font-bold text-gray-900 text-sm">{form.title || 'Your Ad Title'}</h4>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{form.description || 'Your ad description will appear here...'}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[10px] text-gray-400 capitalize">{form.advertiser_name || 'Brand'} · {form.category}</span>
                <span className="px-3 py-1 bg-indigo-500 text-white rounded-lg text-[10px] font-bold">{form.cta_text || 'Learn More'}</span>
              </div>
            </div>
          </div>

          {/* AI Processing Info */}
          <div className="bg-gradient-to-br from-indigo-500/5 to-blue-500/5 rounded-[32px] p-6 border border-indigo-100">
            <h4 className="font-bold text-gray-900 text-sm mb-3">🤖 How AI Analysis Works</h4>
            <div className="space-y-3">
              {[
                { step: '1', title: 'Submit', desc: 'You submit your ad with title & description' },
                { step: '2', title: 'AI Extraction', desc: 'Groq LLaMA extracts keywords, brand, intent & attributes' },
                { step: '3', title: 'Auto-Targeting', desc: 'ML ranker uses features to match users by intent' },
                { step: '4', title: 'Optimize', desc: 'Analytics show which intents convert best' },
              ].map(s => (
                <div key={s.step} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">{s.step}</div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{s.title}</p>
                    <p className="text-[10px] text-gray-400">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Existing Ads List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Your Ads</h3>
            <p className="text-sm text-gray-400">{ads.length} ad{ads.length !== 1 ? 's' : ''} submitted</p>
          </div>
        </div>

        <div className="space-y-3">
          {ads.map((ad, i) => (
            <motion.div key={ad.ad_id || ad._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all group">
              {ad.image_url ? (
                <img src={ad.image_url} alt="" className="w-16 h-12 rounded-lg object-cover" />
              ) : (
                <div className="w-16 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-xs">No img</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">{ad.title}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColors[ad.status] || ''}`}>
                    {statusIcons[ad.status]} {ad.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate">{ad.description}</p>
                {ad.extracted_features && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {ad.extracted_features.keywords?.slice(0, 5).map(kw => (
                      <span key={kw} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px]">{kw}</span>
                    ))}
                    {(ad.extracted_features.keywords?.length || 0) > 5 && (
                      <span className="text-[9px] text-gray-400">+{ad.extracted_features.keywords.length - 5}</span>
                    )}
                  </div>
                )}
              </div>
              <span className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px] capitalize font-medium">{ad.category}</span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {ad.status !== 'processing' && (
                  <button onClick={() => handleToggleStatus(ad)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${ad.status === 'active' ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                    {ad.status === 'active' ? 'Pause' : 'Activate'}
                  </button>
                )}
                <button onClick={() => handleDelete(ad.ad_id)}
                  className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold hover:bg-red-100 transition-all">
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
          {ads.length === 0 && !loading && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-sm">No ads yet. Use the form above to submit your first ad!</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
