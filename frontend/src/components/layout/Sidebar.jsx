import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const navConfigs = {
  admin: [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/intelligence', label: 'Intent Intel', icon: '🧠' },
    { path: '/admin/ranking', label: 'Ad Ranking', icon: '🏆' },
  ],
  advertiser: [
    { path: '/adv', label: 'Dashboard', icon: '📊' },
    { path: '/adv/create', label: 'Create Ad', icon: '➕' },
    { path: '/adv/analytics', label: 'Analytics', icon: '📈' },
  ],
  publisher: [
    { path: '/pub', label: 'Dashboard', icon: '💰' },
    { path: '/pub/analytics', label: 'Analytics', icon: '📊' },
    { path: '/pub/integration', label: 'Integration', icon: '🔌' },
  ],
};

const roleLabels = {
  admin: 'Admin Panel',
  advertiser: 'Advertiser Panel',
  publisher: 'Publisher Panel',
};

const roleColors = {
  admin: 'from-purple-400 to-indigo-400',
  advertiser: 'from-blue-400 to-indigo-400',
  publisher: 'from-green-400 to-teal-400',
};

export default function Sidebar({ role }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const items = navConfigs[role] || [];

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] flex flex-col z-50" style={{ background: '#0a0e17' }}>
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #22c55e, #14b8a6)' }}>IM</div>
          <div>
            <h1 className="text-white font-bold text-base tracking-tight">IntentMarketer</h1>
            <p className="text-gray-500 text-[10px] tracking-widest uppercase">{roleLabels[role]}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink key={item.path} to={item.path}>
              <motion.div whileHover={{ x: 4 }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
                {isActive && <motion.div layoutId="activeIndicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400" />}
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-white/5 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${roleColors[role]} flex items-center justify-center text-white text-xs font-bold`}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.name}</p>
            <p className="text-gray-500 text-[10px] truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={logout}
          className="w-full px-4 py-2 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-xl text-xs font-medium transition-all text-left">
          ← Sign Out
        </button>
      </div>
    </aside>
  );
}
