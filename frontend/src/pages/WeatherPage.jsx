import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWeather } from '../hooks/useWeather';
import { useCompanion } from '../hooks/useCompanion';
import { api } from '../services/api';
import '../styles/meteo.css';
import CompanionChat from '../components/CompanionChat';

const MOOD_ACTIVITIES = {
  happy:  ['Go to a bar', 'Go to a restaurant', 'Attend a concert'],
  chill:  ['Find a cozy café', 'Watch a movie', 'Walk in a park'],
  tired:  ['Visit a spa', 'Sit in a quiet café', 'Browse a bookstore'],
  sporty: ['Hit the gym', 'Go swimming', 'Run in a park'],
};

const ACTIVITY_TYPE = {
  'Go to a bar':          'catering.bar',
  'Go to a restaurant':   'catering.restaurant',
  'Attend a concert':     'entertainment.cinema',
  'Find a cozy café':     'catering.cafe',
  'Watch a movie':        'entertainment.cinema',
  'Walk in a park':       'leisure.park',
  'Visit a spa':          'leisure.spa',
  'Sit in a quiet café':  'catering.cafe',
  'Browse a bookstore':   'commercial.books',
  'Hit the gym':          'sport.sports_centre',
  'Go swimming':          'sport.swimming_pool',
  'Run in a park':        'leisure.park',
};

const MOOD_COMPAT = {
  happy:  ['happy','chill','sporty'],
  chill:  ['chill','happy','tired'],
  tired:  ['tired','chill'],
  sporty: ['sporty','happy'],
};

const COMMON_ACT = {
  'happy-happy':   'Grab a drink together',
  'happy-chill':   'Find a cozy café',
  'happy-sporty':  'Go for a run',
  'chill-chill':   'Visit a museum',
  'chill-tired':   'Sit in a quiet café',
  'tired-tired':   'Find a spa',
  'sporty-sporty': 'Hit the gym together',
};

function getCommonActivity(mA, mB) {
  return COMMON_ACT[`${mA}-${mB}`] || COMMON_ACT[`${mB}-${mA}`] || 'Meet for a coffee';
}

const WMO = { 0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Foggy',51:'Light drizzle',61:'Light rain',63:'Moderate rain',65:'Heavy rain',71:'Light snow',80:'Light showers',95:'Thunderstorm' };
const WMO_ICON = { 0:'01d',1:'02d',2:'03d',3:'04d',45:'50d',51:'10d',61:'10d',63:'10d',65:'10d',71:'13d',80:'10d',95:'11d' };

export default function WeatherPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { weather, forecast, hourly, loading, error, fetchWeather, geolocate } = useWeather();

  const [search, setSearch]         = useState('');
  const [coords, setCoords]         = useState({ lat: null, lng: null });
  const [histFact, setHistFact]     = useState(null);
  const [quote, setQuote]           = useState(null);
  const [myMood, setMyMood]         = useState(null);
  const [moodStep, setMoodStep]     = useState(1);
  const [selMood, setSelMood]       = useState(null);
  const [places, setPlaces]         = useState([]);
  const [loadingPl, setLoadingPl]   = useState(false);
  const [published, setPublished]   = useState(false);
  const [openPanel, setOpenPanel]   = useState(null);
  const [forecastScroll, setForecastScroll] = useState(0);
  const forecastRef = useRef(null);

  const { suggestion, pending, activeChat, chatMinimized, loading: compLoading, findCompanion, nextCompanion, sendRequest, accept, decline, sendMessage, closeChat, reopenChat, dismissChat, hasActiveChat } = useCompanion(coords, !!user);

  useEffect(() => { geolocate(); }, []);

  useEffect(() => {
    if (!weather?.coord) return;
    const { lat, lon } = weather.coord;
    setCoords({ lat, lng: lon });
    if (user) {
      findCompanion();
      api.history().then(setHistFact).catch(() => {});
      api.quote().then(setQuote).catch(() => {});
      api.myMood().then(setMyMood).catch(() => {});
    }
  }, [weather, user]);

  function handleSearch(e) {
    e.preventDefault();
    if (search.trim()) fetchWeather({ city: search.trim() });
  }

  function togglePanel(name) {
    setOpenPanel(p => p === name ? null : name);
  }

  async function selectMoodActivity(activity) {
    setMoodStep(3);
    setLoadingPl(true);
    setPlaces([]);
    try {
      const type = ACTIVITY_TYPE[activity] || 'catering.cafe';
      const result = await api.places(coords.lat, coords.lng, type);
      setPlaces(result);
    } catch {}
    finally { setLoadingPl(false); }

    if (coords.lat && coords.lng) {
      try {
        const expires_at = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
        await api.publishMood({ mood: selMood, activity, status: 'open', lat: coords.lat, lng: coords.lng, expires_at });
        setPublished(true);
        await findCompanion();
      } catch {}
    }
  }

  async function removeMood() {
    if (myMood) { try { await api.deleteMood(myMood.id); } catch {} }
    setMyMood(null); setPublished(false); setMoodStep(1); setSelMood(null); setPlaces([]);
  }

  function scrollForecast(dir) {
    if (!forecastRef.current) return;
    forecastRef.current.scrollBy({ left: dir * 160, behavior: 'smooth' });
  }

  async function handleSendCompanion() {
    if (!suggestion) return;
    const activity = getCommonActivity(selMood || 'chill', suggestion.mood);
    await sendRequest(suggestion.user_id, activity, selMood || 'chill');
  }

  const isDay = weather?.weather?.[0]?.icon?.endsWith('d') ?? true;

  return (
    <>
      <header className="header">
        <a className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>WeatherTime</a>
        <div className="header-right">
          {user ? (
            <>
              <span className="header-username">{user.username}</span>
              <button className="nav-btn ghost" onClick={async () => { await logout(); navigate('/'); }}>Sign Out</button>
            </>
          ) : (
            <>
              <button className="nav-btn ghost" onClick={() => navigate('/login')}>Sign In</button>
              <button className="nav-btn"       onClick={() => navigate('/register')}>Sign Up</button>
            </>
          )}
        </div>
      </header>

      <div className="container">
        {/* SEARCH */}
        <div className="search-box">
          <form onSubmit={handleSearch} style={{ position: 'relative' }}>
            <input id="city-input" type="text" placeholder="Enter a city..." value={search} onChange={e => setSearch(e.target.value)} />
            <button id="search-btn" type="submit">Search</button>
          </form>
        </div>

        {error   && <div className="error-msg">{error}</div>}
        {loading && <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Loading...</p>}

        {/* WEATHER CARD */}
        {weather && !loading && (
          <div className="weather-container">
            <div className="weather-header">
              <h2 id="city-name">{weather.name}, {weather.sys.country}</h2>
              <p id="date">{new Date().toLocaleDateString('en-US', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</p>
            </div>
            <div className="weather-main">
              <img id="weather-icon" src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`} alt={weather.weather[0].description} />
              <div className="temperature">
                {Math.round(weather.main.temp)}<span className="unit">°C</span>
              </div>
              <p id="description">{weather.weather[0].description}</p>
            </div>

            {/* FORECAST 7 DAYS — connecté seulement */}
            {user && forecast && (
              <section className="forecast-section">
                <div className="forecast-head">
                  <h3>7 Days Forecast</h3>
                  <div className="forecast-nav">
                    <button className="forecast-arrow" onClick={() => scrollForecast(-1)}>‹</button>
                    <button className="forecast-arrow" onClick={() => scrollForecast(1)}>›</button>
                  </div>
                </div>
                <div className="forecast-grid" ref={forecastRef}>
                  {forecast.daily.time.map((date, i) => (
                    <div key={date} className="forecast-card">
                      <div className="forecast-day">{new Date(date).toLocaleDateString('en-US', { weekday:'short' })}</div>
                      <img src={`https://openweathermap.org/img/wn/${WMO_ICON[forecast.daily.weather_code[i]] ?? '03d'}.png`} alt="" style={{ width:32, height:32, margin:'4px auto' }} />
                      <div className="forecast-temp">{Math.round(forecast.daily.temperature_2m_max[i])}° / {Math.round(forecast.daily.temperature_2m_min[i])}°</div>
                      <div className="forecast-desc">{WMO[forecast.daily.weather_code[i]] ?? 'Variable'}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="weather-details">
              <div className="detail"><span className="label">Feels Like</span><span>{Math.round(weather.main.feels_like)}°C</span></div>
              <div className="detail"><span className="label">Humidity</span><span>{weather.main.humidity}%</span></div>
              <div className="detail"><span className="label">Wind</span><span>{Math.round(weather.wind.speed * 3.6)} km/h</span></div>
              <div className="detail"><span className="label">Pressure</span><span>{weather.main.pressure} hPa</span></div>
            </div>
          </div>
        )}

        {/* HOURLY — connecté seulement */}
        {user && hourly && weather && !loading && (
          <div style={{ width: 'min(100%, 580px)' }}>
            <p style={{ fontSize:'0.88rem', color:'rgba(234,252,255,0.75)', marginBottom:'10px' }}>Hourly Forecast</p>
            <div style={{ display:'flex', gap:'8px', overflowX:'auto', paddingBottom:'4px', scrollbarWidth:'none' }}>
              {hourly.hourly.time
                .map((t,i) => ({ time: new Date(t), temp: hourly.hourly.temperature_2m[i], code: hourly.hourly.weather_code[i], rain: hourly.hourly.precipitation_probability?.[i] }))
                .filter(h => h.time >= new Date())
                .slice(0,12)
                .map((h,i) => (
                  <div key={i} style={{ flexShrink:0, minWidth:'52px', background:'var(--panel-strong)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'16px', padding:'8px 5px', textAlign:'center' }}>
                    <p style={{ fontSize:'0.68rem', color:'var(--muted)', marginBottom:'4px' }}>{h.time.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false})}</p>
                    <img src={`https://openweathermap.org/img/wn/${WMO_ICON[h.code]??'03d'}.png`} alt="" style={{ width:24, height:24, margin:'2px auto' }} />
                    <p style={{ fontSize:'0.82rem', fontWeight:700 }}>{Math.round(h.temp)}°</p>
                    {h.rain > 0 && <p style={{ fontSize:'0.65rem', color:'var(--accent)' }}>{h.rain}%</p>}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* PENDING COMPANION REQUESTS */}
        {user && pending?.length > 0 && (
          <div className="pending-banner">
            <p className="pending-title">
              Incoming requests
              <span className="pending-count">{pending.length}</span>
            </p>
            {pending.map(req => (
              <div key={req.id} className="pending-item">
                <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
                  <div className="companion-avatar">{req.sender_username?.slice(0,2).toUpperCase()}</div>
                  <div>
                    <p style={{ fontSize:'12px', fontWeight:600, color:'var(--text)' }}>{req.sender_username}</p>
                    {req.sender_bio && <p style={{ fontSize:'11px', color:'var(--muted)' }}>{req.sender_bio}</p>}
                  </div>
                </div>
                <p className="companion-activity">✦ {req.activity}</p>
                <div className="companion-actions" style={{ marginTop:'8px' }}>
                  <button className="comp-btn" onClick={() => accept(req.id, req.sender_username, req.activity)}>Accept</button>
                  <button className="comp-btn refuse" onClick={() => decline(req.id)}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ACTION PANELS */}
        {weather && !loading && (
          <div className="action-buttons">

            {/* HISTORICAL FACT */}
            {user && (
              <div className={`action-panel${openPanel === 'history' ? ' panel-open' : ''}`} onClick={() => togglePanel('history')}>
                <div className="panel-trigger">
                  <span className="panel-label">Historical Fact</span>
                  <span className="panel-chevron">›</span>
                </div>
                <div className="panel-body" onClick={e => e.stopPropagation()}>
                  <h3 className="history-title">Historical Fact of the Day</h3>
                  {histFact
                    ? <><p className="history-text">{histFact.event}</p><span className="history-year">— {histFact.year}</span></>
                    : <p style={{ color:'var(--muted)', fontSize:'13px' }}>Loading...</p>
                  }
                </div>
              </div>
            )}

            {/* QUOTE */}
            {user && (
              <div className={`action-panel${openPanel === 'quote' ? ' panel-open' : ''}`} onClick={() => togglePanel('quote')}>
                <div className="panel-trigger">
                  <span className="panel-label">Quote of the Day</span>
                  <span className="panel-chevron">›</span>
                </div>
                <div className="panel-body" onClick={e => e.stopPropagation()}>
                  <h3 className="history-title">Quote of the Day</h3>
                  {quote
                    ? <><p className="history-text">"{quote.q}"</p><span className="history-year">— {quote.a}</span></>
                    : <p style={{ color:'var(--muted)', fontSize:'13px' }}>Loading...</p>
                  }
                </div>
              </div>
            )}

            {/* MOOD OF THE DAY */}
            {user && (
              <div className={`action-panel highlight${openPanel === 'mood' ? ' panel-open' : ''}`} onClick={() => togglePanel('mood')}>
                <div className="panel-trigger">
                  <span className="panel-label" style={{ color:'var(--accent)' }}>
                    Mood of the Day
                    {published && <span className="published-pill">✓ Published</span>}
                  </span>
                  <span className="panel-chevron" style={{ color:'var(--accent)' }}>›</span>
                </div>
                <div className="panel-body" onClick={e => e.stopPropagation()}>

                  {/* Step 1 — mood */}
                  {moodStep === 1 && (
                    <>
                      <h3 className="history-title" style={{ color:'var(--accent)' }}>How are you feeling today?</h3>
                      <div className="mood-list">
                        {['happy','chill','tired','sporty'].map(m => (
                          <button key={m} className="mood-item" onClick={() => { setSelMood(m); setMoodStep(2); }}>
                            {m === 'happy' ? '😄' : m === 'chill' ? '😌' : m === 'tired' ? '🥱' : '💪'} {m.charAt(0).toUpperCase() + m.slice(1)}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Step 2 — activity */}
                  {moodStep === 2 && (
                    <>
                      <button className="back-btn" onClick={() => setMoodStep(1)}>← Back</button>
                      <h3 className="history-title" style={{ color:'var(--accent)' }}>What would you like to do?</h3>
                      <div className="activity-list">
                        {(MOOD_ACTIVITIES[selMood] || []).map(act => (
                          <button key={act} className="activity-item" onClick={() => selectMoodActivity(act)}>{act}</button>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Step 3 — places + companion */}
                  {moodStep === 3 && (
                    <>
                      <button className="back-btn" onClick={() => setMoodStep(2)}>← Back</button>
                      {published && (
                        <div style={{ fontSize:'11px', color:'var(--accent)', background:'rgba(0,245,196,0.07)', border:'0.5px solid rgba(0,255,220,0.18)', borderRadius:'12px', padding:'8px 12px', marginBottom:'10px', textAlign:'left' }}>
                          👥 Your mood is visible to nearby users for 4 hours
                        </div>
                      )}
                      {loadingPl && <p style={{ color:'var(--muted)', fontSize:'12px' }}>Finding places...</p>}
                      <div className="places-list">
                        {places.map((p,i) => (
                          <div key={i} className="place-item">
                            <p className="place-name">{i+1}. {p.name}</p>
                            {p.address && <p className="place-address">{p.address}</p>}
                            {p.lat && p.lng && (
                              <button className="place-dir" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&origin=${coords.lat},${coords.lng}&destination=${p.lat},${p.lng}&travelmode=walking`, '_blank')}>
                                Get directions →
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* COMPANION SUGGESTION */}
                      {suggestion && (
                        <div className="companion-card" style={{ marginTop:'14px' }}>
                          <p style={{ fontFamily:"'Orbitron',sans-serif", fontSize:'0.72rem', fontWeight:700, color:'var(--accent)', letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:'8px' }}>
                            Suggested Companion
                          </p>
                          <div className="companion-header">
                            <div className="companion-avatar">{suggestion.username.slice(0,2).toUpperCase()}</div>
                            <div>
                              <p className="companion-name">{suggestion.username}</p>
                              {suggestion.bio && <p className="companion-bio">{suggestion.bio}</p>}
                              <span className="companion-mood">
                                {suggestion.mood === 'happy' ? '😄' : suggestion.mood === 'chill' ? '😌' : suggestion.mood === 'tired' ? '🥱' : '💪'} {suggestion.mood}
                              </span>
                            </div>
                          </div>
                          <p className="companion-activity">✦ {getCommonActivity(selMood, suggestion.mood)}</p>
                          <div className="companion-actions">
                            <button className="comp-btn" onClick={handleSendCompanion} disabled={compLoading}>
                              {compLoading ? '...' : 'Send request →'}
                            </button>
                            <button className="comp-btn refuse" onClick={nextCompanion}>{suggestion?.total > 1 ? `Next (${(suggestion.index ?? 0) + 1}/${suggestion.total})` : "Skip"}</button>
                          </div>
                        </div>
                      )}

                      <button onClick={removeMood} style={{ marginTop:'12px', background:'transparent', border:'none', color:'var(--muted)', fontSize:'12px', cursor:'pointer' }}>
                        Remove my mood
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* LOCK BANNER — sans compte */}
            {!user && (
              <div className="lock-banner">
                <p className="lock-title">🔒 Members Only</p>
                <p className="lock-desc">7-day forecasts, hourly data, historical facts, mood matching and ephemeral companion chat are available to members only.</p>
                <button className="lock-btn" onClick={() => navigate('/register')}>Create a free account</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CHAT */}
      {activeChat && (
        <CompanionChat chat={activeChat} onSend={sendMessage} onClose={chatMinimized ? reopenChat : closeChat} onDismiss={dismissChat} minimized={chatMinimized} />
      )}
    </>
  );
}
