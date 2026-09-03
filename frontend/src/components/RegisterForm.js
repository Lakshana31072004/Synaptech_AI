import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../apiService';

const RegisterForm = ({ onSwitchToLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [notification, setNotification] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setNotification('');
        try {
            await apiService.register({ username, password });
            setNotification('Registration successful! Redirecting to login...');
            setTimeout(() => {
                if (onSwitchToLogin) {
                    onSwitchToLogin();
                } else {
                    navigate('/login');
                }
            }, 1200);
        } catch (err) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleLoginClick = (e) => {
        if (onSwitchToLogin) {
            e.preventDefault();
            onSwitchToLogin();
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: 'auto', padding: '28px 24px', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{
                    width: '44px',
                    height: '44px',
                    margin: '0 auto 10px auto',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)'
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="6" cy="6" r="2.5" fill="#ffffff" />
                        <circle cx="18" cy="6" r="2.5" fill="#ffffff" />
                        <circle cx="12" cy="18" r="2.5" fill="#ffffff" />
                        <path d="M6 6L12 18M18 6L12 18M6 6H18" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.85" />
                    </svg>
                </div>
                <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.4rem', fontWeight: 700 }}>
                    Create Synaptech Account
                </h2>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                    AI-Driven Architecture &amp; Agile Intelligence
                </div>
            </div>
            <form onSubmit={handleRegister}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontSize: '0.9em', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Desired Username</label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" required style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.9em', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }} />
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', fontSize: '1em', fontWeight: 600, color: '#fff', backgroundColor: '#10b981', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>{loading ? 'Creating Account...' : 'Register'}</button>
            </form>
            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9em' }}>
                <p style={{ margin: 0, color: '#64748b' }}>
                    Already have an account?{' '}
                    <Link to="/login" onClick={handleLoginClick} style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}>
                        Login
                    </Link>
                </p>
            </div>
            {error && <p style={{ color: '#ef4444', marginTop: '15px', textAlign: 'center', fontSize: '0.9em' }}>{error}</p>}
            {notification && <p style={{ color: '#10b981', marginTop: '15px', textAlign: 'center', fontWeight: 600, fontSize: '0.9em' }}>{notification}</p>}
        </div>
    );
};

export default RegisterForm;
