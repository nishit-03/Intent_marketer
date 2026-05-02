import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Dashboard from './pages/Dashboard';
import AdvDashboard from './pages/advertiser/AdvDashboard';
import AdvCreateAd from './pages/advertiser/AdvCreateAd';
import AdvAnalytics from './pages/advertiser/AdvAnalytics';
import PubDashboard from './pages/publisher/PubDashboard';
import PubAnalytics from './pages/publisher/PubAnalytics';
import PubIntegration from './pages/publisher/PubIntegration';
import IntentIntelligence from './pages/IntentIntelligence';
import AdRankingPanel from './pages/AdRankingPanel';
import Layout from './components/layout/Layout';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="skeleton w-32 h-8" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center"><div className="w-12 h-12 rounded-2xl mx-auto mb-4 animate-pulse" style={{ background: 'linear-gradient(135deg, #22c55e, #14b8a6)' }} /><p className="text-sm text-gray-400">Loading...</p></div>
    </div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'publisher' ? '/pub' : '/adv'} /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'publisher' ? '/pub' : '/adv'} /> : <Signup />} />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Layout role="admin"><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/admin/intelligence" element={<ProtectedRoute roles={['admin']}><Layout role="admin"><IntentIntelligence /></Layout></ProtectedRoute>} />
      <Route path="/admin/ranking" element={<ProtectedRoute roles={['admin']}><Layout role="admin"><AdRankingPanel /></Layout></ProtectedRoute>} />

      {/* Advertiser routes */}
      <Route path="/adv" element={<ProtectedRoute roles={['advertiser']}><Layout role="advertiser"><AdvDashboard /></Layout></ProtectedRoute>} />
      <Route path="/adv/create" element={<ProtectedRoute roles={['advertiser']}><Layout role="advertiser"><AdvCreateAd /></Layout></ProtectedRoute>} />
      <Route path="/adv/analytics" element={<ProtectedRoute roles={['advertiser']}><Layout role="advertiser"><AdvAnalytics /></Layout></ProtectedRoute>} />

      {/* Publisher routes */}
      <Route path="/pub" element={<ProtectedRoute roles={['publisher']}><Layout role="publisher"><PubDashboard /></Layout></ProtectedRoute>} />
      <Route path="/pub/analytics" element={<ProtectedRoute roles={['publisher']}><Layout role="publisher"><PubAnalytics /></Layout></ProtectedRoute>} />
      <Route path="/pub/integration" element={<ProtectedRoute roles={['publisher']}><Layout role="publisher"><PubIntegration /></Layout></ProtectedRoute>} />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
