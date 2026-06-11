# WeatherTime

Weather app + social mood companions.

## Stack
- **Frontend**: React 18, Vite, React Router v6, Socket.io-client
- **Backend**: Node.js, Express 4, Socket.io, bcryptjs, JWT
- **APIs**: OpenWeatherMap, Open-Meteo, Geoapify, API-Ninjas

## Setup

### Backend
```powershell
cd backend
npm install
cp .env.example .env
# Fill in your API keys in .env
npm run dev
```

### Frontend
```powershell
cd frontend
npm install
npm run dev
```

Frontend → http://localhost:5173  
Backend → http://localhost:4000

## .env keys
| Key | Source |
|-----|--------|
| OPENWEATHER_API_KEY | openweathermap.org |
| GEOAPIFY_KEY | geoapify.com |
| HISTORY_API_KEY | api-ninjas.com |
| JWT_SECRET | any long random string |

## Features
| Feature | Without account | With account |
|---------|----------------|--------------|
| Current weather | ✅ | ✅ |
| 7-day forecast | ❌ | ✅ |
| Hourly forecast | ❌ | ✅ |
| Historical fact | ❌ | ✅ |
| Quote of the day | ❌ | ✅ |
| Mood of the Day | ❌ | ✅ |
| Mood companions | ❌ | ✅ |
| Ephemeral chat (4h) | ❌ | ✅ |
