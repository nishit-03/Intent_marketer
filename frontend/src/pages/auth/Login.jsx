import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'publisher') navigate('/pub');
      else navigate('/adv');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(role) {
    if (role === 'admin') setForm({ email: 'admin@intentmarketer.com', password: 'admin123' });
    else if (role === 'advertiser') setForm({ email: 'advertiser@demo.com', password: 'demo123' });
    else setForm({ email: 'publisher@demo.com', password: 'demo123' });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-green-50 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-white font-bold text-xl mb-4"
            style={{ background: 'linear-gradient(135deg, #22c55e, #14b8a6)' }}>IM</div>
          <h1 className="text-2xl font-bold text-gray-900">IntentMarketer</h1>
          <p className="text-sm text-gray-400 mt-1">Privacy-First Ad Intelligence</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Password</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                placeholder="Enter password" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-green-200 transition-all disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400 mb-3">Quick login as demo user:</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => fillDemo('admin')} className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-xs font-medium hover:bg-purple-100 transition-colors">Admin</button>
              <button onClick={() => fillDemo('advertiser')} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">Advertiser</button>
              <button onClick={() => fillDemo('publisher')} className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors">Publisher</button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-400">
            Don't have an account? <Link to="/signup" className="text-green-600 font-medium hover:underline">Sign up</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
