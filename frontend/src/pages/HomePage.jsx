import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/accueil.css';
import '../styles/accueil-classes.css';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <>
      <header className="header">
        <div className="logo">WeatherTime</div>
        <div className="header-right" style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
          {user ? (
            <>
              <span style={{ fontSize: '12px', color: 'var(--muted)', alignSelf: 'center' }}>{user.username}</span>
              <button className="nav-btn" onClick={() => navigate('/weather')}>Open App</button>
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
        <h1>WeatherTime</h1>
        <p>In sync with the&nbsp;<span className="underline">weather.</span></p>
        <button className="cta-button" onClick={() => navigate('/weather')}>
          Discover my weather
        </button>
        {!user && (
          <button className="cta-button secondary" onClick={() => navigate('/register')}>
            Create an account to unlock everything
          </button>
        )}
      </div>

      <section className="features">
        <div className="feature-card">
          <div className="feature-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.44 33.28C13.9492 33.1315 14.4966 33.1913 14.9617 33.4464C15.4268 33.7014 15.7715 34.1308 15.92 34.64C16.0685 35.1492 16.0087 35.6966 15.7536 36.1617C15.4986 36.6268 15.0692 36.9715 14.56 37.12C13.56 37.412 12.84 37.72 12.378 38C12.854 38.286 13.606 38.606 14.65 38.904C16.96 39.564 20.266 40 24 40C27.734 40 31.04 39.564 33.35 38.904C34.396 38.606 35.146 38.286 35.622 38C35.162 37.72 34.442 37.412 33.442 37.12C32.9408 36.9649 32.5206 36.6191 32.272 36.1572C32.0233 35.6952 31.9662 35.154 32.1129 34.6503C32.2595 34.1465 32.5982 33.7206 33.056 33.4643C33.5137 33.208 34.0539 33.1418 34.56 33.28C35.896 33.67 37.12 34.17 38.06 34.812C38.93 35.41 40 36.452 40 38C40 39.566 38.904 40.616 38.02 41.214C37.064 41.858 35.814 42.36 34.448 42.75C31.692 43.54 28 44 24 44C20 44 16.308 43.54 13.552 42.75C12.186 42.36 10.936 41.858 9.98 41.214C9.096 40.614 8 39.566 8 38C8 36.452 9.07 35.41 9.94 34.812C10.88 34.17 12.104 33.67 13.44 33.28ZM24 15C20.92 15 18.996 18.334 20.536 21C21.25 22.238 22.57 23 24 23C27.08 23 29.004 19.666 27.464 17C27.1129 16.3919 26.608 15.887 25.9999 15.5359C25.3919 15.1849 24.7021 15 24 15Z" fill="black"/>
              <path opacity="0.8" d="M24 4C27.9782 4 31.7936 5.58035 34.6066 8.3934C37.4196 11.2064 39 15.0218 39 19C39 24.136 36.2 28.312 33.3 31.28C32.1472 32.4479 30.9084 33.5276 29.594 34.51C28.406 35.402 25.69 37.074 25.69 37.074C25.1749 37.3668 24.5925 37.5207 24 37.5207C23.4075 37.5207 22.8251 37.3668 22.31 37.074C20.9621 36.2924 19.6588 35.4364 18.406 34.51C17.0916 33.5276 15.8528 32.4479 14.7 31.28C11.8 28.312 9 24.136 9 19C9 15.0218 10.5804 11.2064 13.3934 8.3934C16.2064 5.58035 20.0218 4 24 4Z" fill="#D02121"/>
            </svg>
          </div>
          <h3 className="feature-title">Geolocation</h3>
          <p className="feature-description">Accurate real-time weather for your exact location</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <svg width="60" height="45" viewBox="0 0 60 45" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.75 22.5V37.5H11.25V22.5H18.75ZM30 7.5V37.5H22.5V7.5H30ZM60 41.25V45H0V0H3.75V41.25H60ZM41.25 15V37.5H33.75V15H41.25ZM52.5 3.75V20.625V37.5H45V3.75H52.5Z" fill="url(#paint0_linear)" fillOpacity="0.8"/>
              <defs>
                <linearGradient id="paint0_linear" x1="30" y1="0" x2="30" y2="45" gradientUnits="userSpaceOnUse">
                  <stop offset="0.456731" stopColor="#12813C"/>
                  <stop offset="1" stopColor="#F90E0E" stopOpacity="0.9"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h3 className="feature-title">Detailed Forecasts</h3>
          <p className="feature-description">Up to 7 days with complete hourly data</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <svg width="35" height="35" viewBox="0 0 35 35" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.5 2.91669C14.4058 2.91669 11.4384 4.14585 9.25045 6.33377C7.06253 8.5217 5.83337 11.4892 5.83337 14.5834V18.6142L3.07128 24.1384C2.95987 24.3607 2.90717 24.6078 2.91818 24.8563C2.92919 25.1047 3.00355 25.3462 3.1342 25.5578C3.26485 25.7694 3.44743 25.9441 3.66461 26.0653C3.88179 26.1864 4.12635 26.25 4.37503 26.25H30.625C30.8737 26.25 31.1183 26.1864 31.3354 26.0653C31.5526 25.9441 31.7352 25.7694 31.8659 25.5578C31.9965 25.3462 32.0709 25.1047 32.0819 24.8563C32.0929 24.6078 32.0402 24.3607 31.9288 24.1384L29.1667 18.6142V14.5834C29.1667 11.4892 27.9375 8.5217 25.7496 6.33377C23.5617 4.14585 20.5942 2.91669 17.5 2.91669ZM17.5 33.5417C16.2066 33.542 14.9496 33.1124 13.927 32.3205C12.9043 31.5285 12.1738 30.4191 11.8504 29.1667H23.1496C22.8262 30.4191 22.0958 31.5285 21.0731 32.3205C20.0504 33.1124 18.7935 33.542 17.5 33.5417Z" fill="#DEAC2E" fillOpacity="0.8"/>
            </svg>
          </div>
          <h3 className="feature-title">Mood Companions</h3>
          <p className="feature-description">Meet people matching your mood and the weather</p>
        </div>
      </section>

      <footer>
        <p>© 2025 WeatherTime. All rights reserved.</p>
      </footer>
    </>
  );
}
