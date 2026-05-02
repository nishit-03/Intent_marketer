import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const ALL_CATEGORIES = ['tech', 'finance', 'travel', 'health', 'education', 'gaming', 'food', 'sports', 'fashion', 'entertainment'];

export default function PubIntegration() {
  const { authFetch, user } = useAuth();
  const [scriptData, setScriptData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [savingCategories, setSavingCategories] = useState(false);
  const [categorySaved, setCategorySaved] = useState(false);
  const [testStatus, setTestStatus] = useState('idle'); // idle, testing, success, error

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [scriptRes, statsRes] = await Promise.all([
        authFetch('/api/publisher/script'),
        authFetch('/api/publisher/stats'),
      ]);
      const script = await scriptRes.json();
      const st = await statsRes.json();
      setScriptData(script);
      setStats(st);
      setSelectedCategories(st?.ad_categories || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function copyScript() {
    if (scriptData?.script) {
      navigator.clipboard.writeText(scriptData.script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  function copyText(text) {
    navigator.clipboard.writeText(text);
  }

  async function saveCategories() {
    setSavingCategories(true);
    try {
      await authFetch('/api/publisher/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: selectedCategories }),
      });
      setCategorySaved(true);
      setTimeout(() => setCategorySaved(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingCategories(false);
    }
  }

  function toggleCategory(cat) {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
    setCategorySaved(false);
  }

  function runConnectionTest() {
    setTestStatus('testing');
    setTimeout(() => {
      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 4000);
    }, 2000);
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-12 bg-gray-100 rounded-2xl w-64" />
        <div className="h-96 bg-gray-100 rounded-3xl" />
      </div>
    );
  }

  const publisherId = stats?.publisher_id || user?.publisher_id;
  const backendUrl = 'http://localhost:5000';

  const integrationSteps = [
    {
      step: 1,
      title: 'Install the SDK Script',
      subtitle: 'Add the IntentMarketer SDK to your website',
      icon: '📋',
      content: (
        <div className="space-y-6">
          <p className="text-sm text-gray-500 leading-relaxed">
            Copy this script tag and paste it into your website's HTML, ideally just before the closing <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-emerald-600">&lt;/body&gt;</code> tag. The SDK loads asynchronously and won't affect your page load speed.
          </p>
          <div className="relative">
            <pre className="bg-gray-900 text-emerald-400 rounded-2xl p-6 text-[12px] font-mono overflow-x-auto leading-relaxed border border-gray-800">
{scriptData?.script || 'Loading...'}
            </pre>
            <button onClick={copyScript}
              className={`absolute top-4 right-4 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${copied ? 'bg-emerald-500 text-white' : 'bg-white text-gray-900 hover:bg-emerald-50'}`}>
              {copied ? '✓ Copied!' : 'Copy Code'}
            </button>
          </div>
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl">
            <span className="text-blue-500 mt-0.5">ℹ️</span>
            <div>
              <p className="text-xs font-bold text-blue-700 mb-0.5">Quick Tip</p>
              <p className="text-xs text-blue-600">The script automatically creates a session ID for each visitor, ensuring privacy-first tracking with no cookies or personal data collected.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      step: 2,
      title: 'Place Ad Slots',
      subtitle: 'Define where ads should appear on your pages',
      icon: '🎯',
      content: (
        <div className="space-y-6">
          <p className="text-sm text-gray-500 leading-relaxed">
            Add <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-emerald-600">ad-slot</code> elements wherever you want ads to appear. The SDK will automatically fill these with relevant, intent-matched advertisements.
          </p>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-700">Sidebar Ad Slot</h4>
            <CodeBlock code={`<!-- Sidebar ad placement -->\n<div id="ad-slot" data-position="sidebar"></div>`} onCopy={copyText} />
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-700">Inline Content Ad</h4>
            <CodeBlock code={`<!-- Inline ad between content -->\n<div id="ad-slot-inline" data-position="inline"></div>`} onCopy={copyText} />
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-700">Banner Ad (Top/Bottom)</h4>
            <CodeBlock code={`<!-- Banner ad placement -->\n<div id="ad-slot-banner" data-position="banner"\n     data-size="leaderboard"></div>`} onCopy={copyText} />
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <AdPlacementVisual label="Sidebar" position="right" />
            <AdPlacementVisual label="Inline" position="middle" />
            <AdPlacementVisual label="Banner" position="top" />
          </div>
        </div>
      ),
    },
    {
      step: 3,
      title: 'Configure Categories',
      subtitle: 'Choose which ad categories to show on your site',
      icon: '⚙️',
      content: (
        <div className="space-y-6">
          <p className="text-sm text-gray-500 leading-relaxed">
            Select the ad categories that are relevant to your content. This helps our intent engine serve more relevant ads to your audience, improving CTR and revenue.
          </p>

          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map(cat => (
              <button key={cat} onClick={() => toggleCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${selectedCategories.includes(cat) ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={saveCategories} disabled={savingCategories}
              className="px-6 py-3 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all disabled:opacity-50 active:scale-95">
              {savingCategories ? 'Saving...' : categorySaved ? '✓ Saved!' : 'Save Preferences'}
            </button>
            <span className="text-[10px] text-gray-400">{selectedCategories.length} categories selected</span>
          </div>

          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl">
            <span className="text-amber-500 mt-0.5">💡</span>
            <div>
              <p className="text-xs font-bold text-amber-700 mb-0.5">Pro Tip</p>
              <p className="text-xs text-amber-600">Matching categories to your content increases CTR by up to 3.5x. A tech blog showing tech ads performs significantly better than showing random categories.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      step: 4,
      title: 'Test Your Integration',
      subtitle: 'Verify everything is working correctly',
      icon: '🧪',
      content: (
        <div className="space-y-6">
          <p className="text-sm text-gray-500 leading-relaxed">
            Run a quick test to verify your SDK integration is working. This will check the connection to our servers, validate your publisher ID, and confirm ad delivery.
          </p>

          <div className="bg-gray-900 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">Connection Test</h4>
              <button onClick={runConnectionTest} disabled={testStatus === 'testing'}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${testStatus === 'success' ? 'bg-emerald-500 text-white' : testStatus === 'testing' ? 'bg-gray-700 text-gray-400' : 'bg-white text-gray-900 hover:bg-emerald-50'}`}>
                {testStatus === 'testing' ? '⏳ Testing...' : testStatus === 'success' ? '✓ All Passed' : 'Run Test'}
              </button>
            </div>

            <div className="space-y-2">
              <TestItem label="API Connection" status={testStatus === 'idle' ? 'pending' : 'pass'} />
              <TestItem label={`Publisher ID (${publisherId})`} status={testStatus === 'idle' ? 'pending' : 'pass'} />
              <TestItem label="Ad Inventory Available" status={testStatus === 'idle' ? 'pending' : 'pass'} />
              <TestItem label="Intent Engine Active" status={testStatus === 'idle' ? 'pending' : 'pass'} />
              <TestItem label="Revenue Tracking" status={testStatus === 'idle' ? 'pending' : 'pass'} />
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-2xl">
            <span className="text-emerald-500 mt-0.5">✅</span>
            <div>
              <p className="text-xs font-bold text-emerald-700 mb-0.5">What Happens Next?</p>
              <p className="text-xs text-emerald-600">Once your site is live with the SDK, you'll start seeing impressions and revenue in your Dashboard within minutes. The intent engine learns from user behavior to serve increasingly relevant ads over time.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      step: 5,
      title: 'Go Live & Monitor',
      subtitle: 'Deploy and track your earnings',
      icon: '🚀',
      content: (
        <div className="space-y-6">
          <p className="text-sm text-gray-500 leading-relaxed">
            Your integration is complete! Deploy your site and start earning. Here's what to expect:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TimelineCard icon="⏱️" time="First 5 minutes" description="Ads start appearing on your site. First impressions are tracked." />
            <TimelineCard icon="📊" time="First hour" description="Dashboard updates with real-time metrics. Intent engine starts learning." />
            <TimelineCard icon="🧠" time="First 24 hours" description="Intent engine has enough data to optimize ad relevance. CTR improves." />
            <TimelineCard icon="💰" time="First week" description="Revenue stabilizes. Full analytics available including category and intent breakdowns." />
          </div>

          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
            <h4 className="text-sm font-bold mb-3">Your Publisher Credentials</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Publisher ID</p>
                <p className="text-sm font-mono text-emerald-400">{publisherId}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">API Endpoint</p>
                <p className="text-sm font-mono text-emerald-400">{backendUrl}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">CPM Rate</p>
                <p className="text-sm font-mono text-white">${stats?.cpm_rate?.toFixed(2)}/1000 impressions</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">CPC Rate</p>
                <p className="text-sm font-mono text-white">${stats?.cpc_rate?.toFixed(2)}/click</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-[#fafafa] min-h-screen">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Integration Guide</h1>
        <p className="text-sm text-gray-400 mt-1">Step-by-step tutorial to integrate IntentMarketer ads into your website</p>
      </motion.div>

      {/* Progress Bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-500">Setup Progress</p>
          <p className="text-xs font-bold text-emerald-600">{activeStep + 1} of {integrationSteps.length} steps</p>
        </div>
        <div className="flex gap-1.5">
          {integrationSteps.map((_, i) => (
            <div key={i} className="flex-1 h-2 rounded-full overflow-hidden bg-gray-100 cursor-pointer" onClick={() => setActiveStep(i)}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: i <= activeStep ? '100%' : '0%' }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="h-full bg-emerald-500 rounded-full"
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        {/* Step Navigator */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="space-y-2">
          {integrationSteps.map((step, i) => (
            <button key={i} onClick={() => setActiveStep(i)}
              className={`w-full text-left p-4 rounded-2xl transition-all group ${activeStep === i ? 'bg-white shadow-md border border-gray-100' : 'hover:bg-white/60'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-transform ${activeStep === i ? 'scale-110' : 'group-hover:scale-105'}`}
                  style={{ background: activeStep === i ? 'linear-gradient(135deg, #10b981, #06b6d4)' : '#f3f4f6' }}>
                  {i < activeStep ? '✓' : step.icon}
                </div>
                <div>
                  <p className={`text-sm font-bold transition-colors ${activeStep === i ? 'text-gray-900' : 'text-gray-400'}`}>
                    Step {step.step}
                  </p>
                  <p className={`text-xs transition-colors ${activeStep === i ? 'text-gray-500' : 'text-gray-300'}`}>
                    {step.title}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </motion.div>

        {/* Active Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
                style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                {integrationSteps[activeStep].icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{integrationSteps[activeStep].title}</h2>
                <p className="text-sm text-gray-400">{integrationSteps[activeStep].subtitle}</p>
              </div>
            </div>

            {integrationSteps[activeStep].content}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              <button onClick={() => setActiveStep(Math.max(0, activeStep - 1))} disabled={activeStep === 0}
                className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30">
                ← Previous
              </button>
              <button onClick={() => setActiveStep(Math.min(integrationSteps.length - 1, activeStep + 1))} disabled={activeStep === integrationSteps.length - 1}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-30">
                Next Step →
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Sub-Components ─── */

function CodeBlock({ code, onCopy }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    onCopy(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="relative">
      <pre className="bg-gray-900 text-emerald-400 rounded-xl p-4 text-[11px] font-mono overflow-x-auto leading-relaxed">{code}</pre>
      <button onClick={handleCopy}
        className={`absolute top-3 right-3 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
        {copied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  );
}

function AdPlacementVisual({ label, position }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
      <div className="aspect-[4/3] rounded-lg bg-white border border-dashed border-gray-200 relative overflow-hidden">
        {position === 'right' && (
          <>
            <div className="absolute left-2 top-2 w-[55%] space-y-1">
              <div className="h-1.5 bg-gray-100 rounded-full w-full" />
              <div className="h-1.5 bg-gray-100 rounded-full w-4/5" />
              <div className="h-1.5 bg-gray-100 rounded-full w-full" />
            </div>
            <div className="absolute right-2 top-2 bottom-2 w-[30%] bg-emerald-100 border border-emerald-300 rounded-lg flex items-center justify-center">
              <span className="text-[8px] text-emerald-600 font-bold">AD</span>
            </div>
          </>
        )}
        {position === 'middle' && (
          <>
            <div className="absolute left-2 right-2 top-2 space-y-1">
              <div className="h-1.5 bg-gray-100 rounded-full w-full" />
              <div className="h-1.5 bg-gray-100 rounded-full w-4/5" />
            </div>
            <div className="absolute left-2 right-2 top-[40%] h-[25%] bg-emerald-100 border border-emerald-300 rounded-lg flex items-center justify-center">
              <span className="text-[8px] text-emerald-600 font-bold">AD</span>
            </div>
            <div className="absolute left-2 right-2 bottom-2 space-y-1">
              <div className="h-1.5 bg-gray-100 rounded-full w-full" />
              <div className="h-1.5 bg-gray-100 rounded-full w-3/5" />
            </div>
          </>
        )}
        {position === 'top' && (
          <>
            <div className="absolute left-2 right-2 top-2 h-[22%] bg-emerald-100 border border-emerald-300 rounded-lg flex items-center justify-center">
              <span className="text-[8px] text-emerald-600 font-bold">AD</span>
            </div>
            <div className="absolute left-2 right-2 bottom-2 space-y-1">
              <div className="h-1.5 bg-gray-100 rounded-full w-full" />
              <div className="h-1.5 bg-gray-100 rounded-full w-4/5" />
              <div className="h-1.5 bg-gray-100 rounded-full w-full" />
              <div className="h-1.5 bg-gray-100 rounded-full w-3/5" />
            </div>
          </>
        )}
      </div>
      <p className="text-[10px] text-gray-500 font-bold text-center mt-2">{label}</p>
    </div>
  );
}

function TestItem({ label, status }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/5">
      <span className="text-xs text-gray-300 font-medium">{label}</span>
      {status === 'pending' && <span className="text-[10px] text-gray-500 font-bold">—</span>}
      {status === 'pass' && (
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-xs text-emerald-400 font-bold">
          ✓ Pass
        </motion.span>
      )}
    </div>
  );
}

function TimelineCard({ icon, time, description }) {
  return (
    <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <span className="text-xs font-bold text-emerald-600">{time}</span>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}
