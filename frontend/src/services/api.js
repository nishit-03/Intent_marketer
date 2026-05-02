const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('im_token');
}

async function request(url, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${url}`, { headers, ...options });
  if (res.status === 401) {
    localStorage.removeItem('im_token');
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

// Ads
export const createAd = (data) => request('/ads', { method: 'POST', body: JSON.stringify(data) });
export const getAds = (params = '') => request(`/ads${params ? '?' + params : ''}`);
export const getAd = (id) => request(`/ads/${id}`);
export const serveAds = (sessionId, cats) => request(`/ads/serve?session_id=${sessionId}${cats ? '&categories=' + cats : ''}`);
export const clickAd = (adId, sessionId, intentStage) =>
  request(`/ads/${adId}/click`, { method: 'POST', body: JSON.stringify({ session_id: sessionId, intent_stage: intentStage }) });

// Tracking
export const trackSession = (data) => request('/track', { method: 'POST', body: JSON.stringify(data) });
export const getSession = (sessionId) => request(`/track/${sessionId}`);

// Analytics
export const getAnalyticsOverview = () => request('/analytics/overview');
export const getTimeline = (days = 14) => request(`/analytics/timeline?days=${days}`);
export const getCategoryStats = () => request('/analytics/by-category');
export const getIntentCTR = () => request('/analytics/intent-ctr');
export const getTopAds = (limit = 10) => request(`/analytics/top-ads?limit=${limit}`);
export const getIntentDistribution = () => request('/analytics/intent-distribution');

// Retrain
export const triggerRetrain = () => request('/retrain', { method: 'POST' });

// Health
export const healthCheck = () => request('/health');
