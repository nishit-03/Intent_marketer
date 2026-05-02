import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const categories = ['tech', 'finance', 'travel', 'health', 'education', 'ecommerce'];

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('advertiser');
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    company_name: '', website_url: '', website_name: '',
    ad_categories: [...categories],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function toggleCategory(cat) {
    setForm(f => ({
      ...f,
      ad_categories: f.ad_categories.includes(cat)
        ? f.ad_categories.filter(c => c !== cat)
        : [...f.ad_categories, cat],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await signup({ ...form, role });
      if (user.role === 'publisher') navigate('/pub');
      else navigate('/adv');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-green-50 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-white font-bold text-xl mb-4"
            style={{ background: 'linear-gradient(135deg, #22c55e, #14b8a6)' }}>IM</div>
          <h1 className="text-2xl font-bold text-gray-900">Join IntentMarketer</h1>
          <p className="text-sm text-gray-400 mt-1">Start advertising or monetize your website</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
          {/* Role selector */}
          <div className="flex gap-3 mb-6">
            <button onClick={() => setRole('advertiser')}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${role === 'advertiser' ? 'bg-blue-500 text-white shadow-lg shadow-blue-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
              📢 Advertiser
            </button>
            <button onClick={() => setRole('publisher')}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${role === 'publisher' ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
              🌐 Publisher
            </button>
          </div>

          <p className="text-xs text-gray-400 mb-4">
            {role === 'advertiser'
              ? 'Submit ads and reach users based on real-time intent. No user tracking.'
              : 'Monetize your website with privacy-first ads. Get a simple script to embed.'}
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Password *</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                placeholder="Minimum 6 characters" />
            </div>

            {role === 'advertiser' && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Company Name</label>
                <input type="text" value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent" />
              </div>
            )}

            {role === 'publisher' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Website Name *</label>
                    <input type="text" value={form.website_name} onChange={e => setForm({ ...form, website_name: e.target.value })} required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                      placeholder="My Blog" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Website URL *</label>
                    <input type="url" value={form.website_url} onChange={e => setForm({ ...form, website_url: e.target.value })} required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                      placeholder="https://myblog.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Ad Categories to Display</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${form.ad_categories.includes(cat)
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-gray-50 text-gray-400 border border-gray-200'}`}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-green-200 transition-all disabled:opacity-50">
              {loading ? 'Creating account...' : `Sign Up as ${role === 'advertiser' ? 'Advertiser' : 'Publisher'}`}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account? <Link to="/login" className="text-green-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
