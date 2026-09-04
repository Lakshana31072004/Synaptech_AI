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
        <div className="brand-container" style={{ display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left' }}>
          <img
            src="/synaptech_logo.png"
            alt="Synaptech AI"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              border: '1px solid rgba(0, 240, 255, 0.4)',
              boxShadow: '0 0 16px rgba(0, 240, 255, 0.35)',
              background: '#0b0e15',
              flexShrink: 0
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{
                margin: 0,
                fontSize: '1.26rem',
                fontWeight: '700',
                letterSpacing: '-0.02em',
                color: '#ffffff',
                fontFamily: "'Space Grotesk', sans-serif"
              }}>
                Synaptech
              </h1>
              <span style={{
                background: 'rgba(0, 240, 255, 0.15)',
                border: '1px solid rgba(0, 240, 255, 0.4)',
                color: '#00f0ff',
                borderRadius: '6px',
                padding: '1px 7px',
                fontSize: '0.72rem',
                fontWeight: '700',
                letterSpacing: '0.06em',
                fontFamily: "'JetBrains Mono', monospace"
              }}>
                AI
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.72rem',
                fontFamily: "'JetBrains Mono', monospace",
                color: '#65f2b5',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '2px 8px',
                borderRadius: '9999px',
                marginLeft: '4px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }}></span>
                ONLINE 99.98%
              </span>
            </div>
            <div style={{ fontSize: '0.73rem', color: '#849495', letterSpacing: '0.01em', marginTop: '2px', fontFamily: "'JetBrains Mono', monospace" }}>
              Cybernetic Telemetry &amp; Autonomous AI Core
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
                <img
                  src={userProfile?.profilePictureUrl ? (userProfile.profilePictureUrl.startsWith('http') || userProfile.profilePictureUrl.startsWith('data:') ? userProfile.profilePictureUrl : (userProfile.profilePictureUrl.startsWith('/') ? userProfile.profilePictureUrl : `/${userProfile.profilePictureUrl}`)) : '/uploads/stitch_avatar.jpg'}
                  alt="Avatar"
                  onError={(e) => { e.currentTarget.src = '/uploads/stitch_avatar.jpg'; }}
                  style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #00f0ff', boxShadow: '0 0 8px rgba(0, 240, 255, 0.4)' }}
                />
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
