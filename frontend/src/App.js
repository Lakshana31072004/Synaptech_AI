import React, { useEffect } from 'react';
import './App.css';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { setNotificationService } from './apiService';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import DashboardPage from './DashboardPage';
import ForgotPasswordPage from './ForgotPasswordPage';
import ResetPasswordPage from './ResetPasswordPage';
import ProfilePage from './ProfilePage';
import AdminDashboard from './AdminDashboard';
import AiRequirementAnalyzer from './components/AiRequirementAnalyzer';
import AiSprintPlanner from './components/AiSprintPlanner';
import AiArchitectureAdvisor from './components/AiArchitectureAdvisor';
import AiCodeReviewInspector from './components/AiCodeReviewInspector';
import SynaptechCopilot from './components/SynaptechCopilot';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';

function App() {
  const { isAuthenticated, user, userProfile, logout } = useAuth();
  const notifications = useNotification();

  useEffect(() => {
    if (notifications) {
      setNotificationService(notifications);
    }
  }, [notifications]);

  return (
    <div className="App">
      <header className="App-header">
        <div className="brand-container" style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
            flexShrink: 0
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="6" cy="6" r="2.5" fill="#ffffff" />
              <circle cx="18" cy="6" r="2.5" fill="#ffffff" />
              <circle cx="12" cy="18" r="2.5" fill="#ffffff" />
              <path d="M6 6L12 18M18 6L12 18M6 6H18" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.85" />
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{
                margin: 0,
                fontSize: '1.28rem',
                fontWeight: '800',
                letterSpacing: '-0.02em',
                color: '#ffffff',
                fontFamily: "'Outfit', sans-serif"
              }}>
                Synaptech
              </h1>
              <span style={{
                background: 'rgba(59, 130, 246, 0.25)',
                border: '1px solid rgba(96, 165, 250, 0.4)',
                color: '#93c5fd',
                borderRadius: '6px',
                padding: '1px 7px',
                fontSize: '0.72rem',
                fontWeight: '700',
                letterSpacing: '0.05em'
              }}>
                AI
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', letterSpacing: '0.01em', marginTop: '2px' }}>
              AI-Driven Architecture &amp; Agile Intelligence Platform
            </div>
          </div>
        </div>
        <nav>
          {isAuthenticated ? (
            <>
              <Link to="/" className="header-link">Overview</Link>
              <Link to="/analyzer" className="header-link">Requirement Analyzer</Link>
              <Link to="/planner" className="header-link">Sprint Planner</Link>
              <Link to="/architecture" className="header-link">Architecture Advisor</Link>
              <Link to="/code-review" className="header-link">Code Review</Link>
              {userProfile?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('Admin') ? (
                <Link to="/admin" className="header-link">Admin</Link>
              ) : null}
              <Link to="/profile" className="header-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                {userProfile?.profilePictureUrl ? (
                  <img
                    src={userProfile.profilePictureUrl.startsWith('http') || userProfile.profilePictureUrl.startsWith('data:') ? userProfile.profilePictureUrl : (userProfile.profilePictureUrl.startsWith('/') ? userProfile.profilePictureUrl : `/${userProfile.profilePictureUrl}`)}
                    alt="Avatar"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #60a5fa' }}
                  />
                ) : null}
                <span>My Profile</span>
              </Link>
              <button onClick={logout} className="logout-button">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="header-link">Login</Link>
          )}
        </nav>
      </header>
      <main className="App-main">
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <div style={{ maxWidth: '400px', margin: '40px auto' }}><LoginForm /></div>} />
          <Route path="/register" element={<div style={{ maxWidth: '400px', margin: '40px auto' }}><RegisterForm /></div>} />
          <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/" /> : <ForgotPasswordPage />} />
          <Route path="/reset-password" element={isAuthenticated ? <Navigate to="/" /> : <ResetPasswordPage />} />
          <Route path="/profile" element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" />} />
          <Route path="/admin" element={isAuthenticated ? <AdminDashboard /> : <Navigate to="/login" />} />
          <Route path="/analyzer" element={isAuthenticated ? <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 20px' }}><AiRequirementAnalyzer /></div> : <Navigate to="/login" />} />
          <Route path="/planner" element={isAuthenticated ? <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 20px' }}><AiSprintPlanner /></div> : <Navigate to="/login" />} />
          <Route path="/architecture" element={isAuthenticated ? <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 20px' }}><AiArchitectureAdvisor /></div> : <Navigate to="/login" />} />
          <Route path="/code-review" element={isAuthenticated ? <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 20px' }}><AiCodeReviewInspector /></div> : <Navigate to="/login" />} />
          <Route path="/" element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
        </Routes>
      </main>

      {/* Global Real-Time AI Copilot */}
      {isAuthenticated && <SynaptechCopilot />}
    </div>
  );
}

export default App;
