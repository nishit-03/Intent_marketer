import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/': 'Dashboard',
  '/advertiser': 'Advertiser Panel',
  '/publisher': 'Publisher Demo',
  '/intelligence': 'Intent Intelligence',
  '/ranking': 'Ad Ranking',
};

export default function Header() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'IntentMarketer';

  return (
    <header className="h-16 flex items-center justify-between px-8 bg-white/70 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-40">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-400">Privacy-First Ad Intelligence Platform</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs font-medium text-green-700">No Cookies · No Tracking</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full">
          <span className="text-xs text-gray-500">🤖 LLM + ML Active</span>
        </div>
      </div>
    </header>
  );
}
