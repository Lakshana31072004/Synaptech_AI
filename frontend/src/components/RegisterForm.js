import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../apiService';

const RegisterForm = ({ onSwitchToLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
        <div style={{
            maxWidth: '420px',
            margin: '40px auto',
            padding: '32px 28px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            backgroundColor: 'rgba(29, 31, 39, 0.88)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.6), 0 0 24px -4px rgba(16, 185, 129, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
            color: '#e1e2ec'
        }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <img
                    src="/synaptech_logo.png"
                    alt="Synaptech AI"
                    style={{
                        width: '50px',
                        height: '50px',
                        margin: '0 auto 12px auto',
                        display: 'block',
                        borderRadius: '12px',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
                        background: '#0b0e15'
                    }}
                />
                <h2 style={{ margin: 0, color: '#ffffff', fontSize: '1.45rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
                    Create Synaptech Account
                </h2>
                <div style={{ fontSize: '0.78rem', color: '#849495', marginTop: '6px', fontFamily: "'JetBrains Mono', monospace" }}>
                    AI-Driven Architecture &amp; Agile Intelligence
                </div>
            </div>
            <form onSubmit={handleRegister}>
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.84em', fontWeight: 600, color: '#b9cacb', marginBottom: '6px', fontFamily: "'JetBrains Mono', monospace" }}>DESIRED USERNAME</label>
                    <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="Enter username"
                        required
                        style={{
                            width: '100%',
                            padding: '11px 14px',
                            background: 'rgba(11, 14, 21, 0.75)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '8px',
                            boxSizing: 'border-box',
                            color: '#ffffff',
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '0.92rem',
                            outline: 'none'
                        }}
                    />
                </div>
                <div style={{ marginBottom: '22px' }}>
                    <label style={{ display: 'block', fontSize: '0.84em', fontWeight: 600, color: '#b9cacb', marginBottom: '6px', fontFamily: "'JetBrains Mono', monospace" }}>PASSWORD</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Enter password"
                            required
                            style={{
                                width: '100%',
                                padding: '11px 42px 11px 14px',
                                background: 'rgba(11, 14, 21, 0.75)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                borderRadius: '8px',
                                boxSizing: 'border-box',
                                color: '#ffffff',
                                fontFamily: "'Inter', sans-serif",
                                fontSize: '0.92rem',
                                outline: 'none'
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            title={showPassword ? 'Hide password' : 'Show password'}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#849495'
                            }}
                        >
                            {showPassword ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        color: '#0b0e15',
                        background: '#10b981',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        boxShadow: '0 0 18px rgba(16, 185, 129, 0.4)',
                        fontFamily: "'Space Grotesk', sans-serif",
                        transition: 'all 0.2s ease'
                    }}
                >
                    {loading ? 'Creating Account...' : 'Register'}
                </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: '22px', fontSize: '0.86rem' }}>
                <p style={{ margin: 0, color: '#849495' }}>
                    Already have an account?{' '}
                    <Link to="/login" onClick={handleLoginClick} style={{ color: '#00f0ff', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}>
                        Login
                    </Link>
                </p>
            </div>
            {error && <p style={{ color: '#ffb4ab', marginTop: '16px', textAlign: 'center', fontSize: '0.86rem', background: 'rgba(239, 68, 68, 0.15)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{error}</p>}
            {notification && <p style={{ color: '#65f2b5', marginTop: '16px', textAlign: 'center', fontWeight: 600, fontSize: '0.86rem', background: 'rgba(16, 185, 129, 0.15)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>{notification}</p>}
        </div>
    );
};

export default RegisterForm;
