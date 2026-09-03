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
import LoginForm from './components/LoginForm';

function App() {
  const { isAuthenticated, user, logout } = useAuth();
  const notifications = useNotification();

  useEffect(() => {
    if (notifications) {
      setNotificationService(notifications);
    }
  }, [notifications]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Autonomous Software Engineering OS (ASEOS)</h1>
        <nav>
          {isAuthenticated ? (
            <>
              <Link to="/" className="header-link">Overview</Link>
              <Link to="/analyzer" className="header-link">Requirement Analyzer</Link>
              <Link to="/planner" className="header-link">Sprint Planner</Link>
              <Link to="/architecture" className="header-link">Architecture Advisor</Link>
              {user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('Admin') ? (
                <Link to="/admin" className="header-link">Admin</Link>
              ) : null}
              <Link to="/profile" className="header-link">My Profile</Link>
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
          <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/" /> : <ForgotPasswordPage />} />
          <Route path="/reset-password" element={isAuthenticated ? <Navigate to="/" /> : <ResetPasswordPage />} />
          <Route path="/profile" element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" />} />
          <Route path="/admin" element={isAuthenticated ? <AdminDashboard /> : <Navigate to="/login" />} />
          <Route path="/analyzer" element={isAuthenticated ? <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 20px' }}><AiRequirementAnalyzer /></div> : <Navigate to="/login" />} />
          <Route path="/planner" element={isAuthenticated ? <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 20px' }}><AiSprintPlanner /></div> : <Navigate to="/login" />} />
          <Route path="/architecture" element={isAuthenticated ? <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 20px' }}><AiArchitectureAdvisor /></div> : <Navigate to="/login" />} />
          <Route path="/" element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
