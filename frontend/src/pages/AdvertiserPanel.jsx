import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from '../services/api';

const categories = ['tech', 'finance', 'travel', 'health', 'education', 'ecommerce'];

function AdForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    title: '', description: '', category: 'tech', image_url: '', advertiser_name: '', cta_text: 'Learn More', cta_url: '#',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
    setForm({ title: '', description: '', category: 'tech', image_url: '', advertiser_name: '', cta_text: 'Learn More', cta_url: '#' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Ad Title *</label>
          <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
            placeholder="e.g. MacBook Pro M4 — Ultimate Performance" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Advertiser Name</label>
          <input type="text" value={form.advertiser_name} onChange={e => setForm({ ...form, advertiser_name: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
            placeholder="e.g. Apple Inc." />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Description *</label>
        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required rows={3}
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all resize-none"
          placeholder="Describe your product or service in detail..." />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Category *</label>
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all">
            {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Image URL</label>
          <input type="url" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
            placeholder="https://..." />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">CTA Text</label>
          <input type="text" value={form.cta_text} onChange={e => setForm({ ...form, cta_text: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
            placeholder="Learn More" />
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading}
          className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-green-200 transition-all duration-300 disabled:opacity-50">
          {loading ? 'Processing...' : '🚀 Submit Ad for AI Analysis'}
        </button>
      </div>
    </form>
  );
}

const statusColors = {
  active: 'bg-green-50 text-green-700 border-green-200',
  processing: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  paused: 'bg-gray-50 text-gray-500 border-gray-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
};

export default function AdvertiserPanel() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadAds();
    const interval = setInterval(loadAds, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadAds() {
    try {
      const data = await api.getAds();
      setAds(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSubmit(form) {
    setSubmitting(true);
    setMessage('');
    try {
      const result = await api.createAd(form);
      setMessage(`✅ ${result.message}`);
      loadAds();
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Submit Ad */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center text-white text-lg">📢</div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Submit New Ad</h3>
            <p className="text-xs text-gray-400">AI will automatically extract features using LLM (Groq LLaMA)</p>
          </div>
        </div>
        <AdForm onSubmit={handleSubmit} loading={submitting} />
        <AnimatePresence>
          {message && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mt-4 px-4 py-3 bg-gray-50 rounded-xl text-sm">{message}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Ads List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Your Ads ({ads.length})</h3>
            <p className="text-xs text-gray-400">Click on an ad to view LLM-extracted features</p>
          </div>
          <button onClick={loadAds} className="text-xs text-gray-400 hover:text-green-500 transition-colors">↻ Refresh</button>
        </div>

        <div className="space-y-3">
          {ads.map((ad, i) => (
            <motion.div key={ad.ad_id || ad._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }} onClick={() => setSelectedAd(selectedAd?.ad_id === ad.ad_id ? null : ad)}
              className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-md ${selectedAd?.ad_id === ad.ad_id ? 'border-green-300 bg-green-50/30 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}>
              <div className="flex items-center gap-4">
                {ad.image_url && (
                  <img src={ad.image_url} alt="" className="w-16 h-12 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">{ad.title}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColors[ad.status] || statusColors.processing}`}>
                      {ad.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{ad.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px] capitalize">{ad.category}</span>
                  <p className="text-[10px] text-gray-400 mt-1">{ad.advertiser_name}</p>
                </div>
              </div>

              {/* Expanded LLM features */}
              <AnimatePresence>
                {selectedAd?.ad_id === ad.ad_id && ad.extracted_features && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-semibold text-green-600 mb-3">🧠 LLM-Extracted Features (Groq LLaMA)</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        ['Product', ad.extracted_features.product],
                        ['Brand', ad.extracted_features.brand],
                        ['Price Range', ad.extracted_features.price_range],
                        ['Target Intent', ad.extracted_features.target_intent],
                      ].map(([label, val]) => val && (
                        <div key={label} className="px-3 py-2 bg-white rounded-lg border border-gray-100">
                          <span className="text-[10px] text-gray-400 block">{label}</span>
                          <span className="text-xs font-medium text-gray-700 capitalize">{val}</span>
                        </div>
                      ))}
                    </div>
                    {ad.extracted_features.keywords?.length > 0 && (
                      <div className="mt-3">
                        <span className="text-[10px] text-gray-400 block mb-1.5">Keywords</span>
                        <div className="flex flex-wrap gap-1.5">
                          {ad.extracted_features.keywords.map(kw => (
                            <span key={kw} className="px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[10px]">{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {ad.extracted_features.attributes?.length > 0 && (
                      <div className="mt-3">
                        <span className="text-[10px] text-gray-400 block mb-1.5">Attributes</span>
                        <div className="flex flex-wrap gap-1.5">
                          {ad.extracted_features.attributes.map(attr => (
                            <span key={attr} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px]">{attr}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {ad.extracted_features.summary && (
                      <p className="mt-3 text-xs text-gray-500 italic">"{ad.extracted_features.summary}"</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
          {ads.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-sm">No ads yet. Submit your first ad above!</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
