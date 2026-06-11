const BASE = '/api';

function getToken() { return localStorage.getItem('wt_token'); }

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  register:    (b)          => request('/auth/register', { method: 'POST', body: JSON.stringify(b) }),
  login:       (b)          => request('/auth/login',    { method: 'POST', body: JSON.stringify(b) }),
  logout:      ()           => request('/auth/logout',   { method: 'POST' }),
  me:          ()           => request('/auth/me'),

  weatherByCity:   (city)   => request(`/weather?city=${encodeURIComponent(city)}`),
  weatherByCoords: (lat,lon) => request(`/weather/coords?lat=${lat}&lon=${lon}`),
  hourly:      (lat,lon)    => request(`/weather/hourly?lat=${lat}&lon=${lon}`),
  forecast7day:(lat,lon)    => request(`/weather/7day?lat=${lat}&lon=${lon}`),
  history:     ()           => request('/weather/history'),
  quote:       ()           => request('/weather/quote'),

  publishMood: (b)          => request('/moods',       { method: 'POST',  body: JSON.stringify(b) }),
  nearbyMoods: (lat,lng,r)  => request(`/moods/nearby?lat=${lat}&lng=${lng}${r?`&radius=${r}`:''}`),
  myMood:      ()           => request('/moods/me'),
  deleteMood:  (id)         => request(`/moods/${id}`, { method: 'DELETE' }),

  findCompanion:       (lat,lng,idx=0) => request(`/companions/find?lat=${lat}&lng=${lng}&index=${idx}`),
  getPendingCompanions:()        => request('/companions/pending'),
  sendCompanionReq:    (b)       => request('/companions', { method: 'POST', body: JSON.stringify(b) }),
  acceptCompanion:     (id)      => request(`/companions/${id}/accept`,  { method: 'PATCH' }),
  declineCompanion:    (id)      => request(`/companions/${id}/decline`, { method: 'PATCH' }),
  getChat:             (chatId)  => request(`/companions/chat/${chatId}`),

  places: (lat,lng,type) => request(`/places?lat=${lat}&lng=${lng}&type=${encodeURIComponent(type)}`),
  report: (reported_id,reason) => request('/reports', { method: 'POST', body: JSON.stringify({ reported_id, reason }) }),
};
