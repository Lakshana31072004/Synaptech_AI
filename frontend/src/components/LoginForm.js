import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { apiService } from '../apiService';

const LoginForm = ({ onSwitchToRegister }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const executeLogin = async (userToLogin, passToLogin) => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiService.login({ username: userToLogin, password: passToLogin });
            const jwtToken = data?.token || data?.accessToken;
            if (!jwtToken) {
                throw new Error('Authentication succeeded but no token was returned');
            }
            login(jwtToken);
            navigate('/');
        } catch (err) {
            let msg = err.message || 'Login failed. Please check your credentials.';
            try {
                const parsed = JSON.parse(msg);
                if (parsed.message) msg = parsed.message;
                else if (parsed.error) msg = parsed.error;
            } catch (e) { }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        await executeLogin(username, password);
    };

    const handleRegisterClick = (e) => {
        if (onSwitchToRegister) {
            e.preventDefault();
            onSwitchToRegister();
        }
    };

    return (
        <div style={{ maxWidth: '440px', margin: 'auto', padding: '32px 28px', border: '1px solid #e2e8f0', borderRadius: '16px', backgroundColor: '#ffffff', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{
                    width: '46px',
                    height: '46px',
                    margin: '0 auto 10px auto',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)'
                }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="6" cy="6" r="2.5" fill="#ffffff" />
                        <circle cx="18" cy="6" r="2.5" fill="#ffffff" />
                        <circle cx="12" cy="18" r="2.5" fill="#ffffff" />
                        <path d="M6 6L12 18M18 6L12 18M6 6H18" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.85" />
                    </svg>
                </div>
                <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                    Login to Synaptech
                </h2>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                    AI-Driven Architecture &amp; Agile Intelligence Platform
                </div>
            </div>

            <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '16px' }}>
                    <label htmlFor="username" style={{ display: 'block', fontSize: '0.88em', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Username</label>
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        required
                        style={{ width: '100%', padding: '11px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box', fontSize: '0.92rem' }}
                    />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="password" style={{ display: 'block', fontSize: '0.88em', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Password</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            style={{
                                width: '100%',
                                padding: '11px 42px 11px 12px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '8px',
                                boxSizing: 'border-box',
                                fontSize: '0.92rem'
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            title={showPassword ? 'Hide password' : 'Show password'}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            style={{
                                position: 'absolute',
                                right: '8px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#64748b'
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
                        fontSize: '0.98em',
                        fontWeight: 700,
                        color: '#fff',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                        transition: 'all 0.2s ease'
                    }}
                >
                    {loading ? 'Authenticating...' : 'Log In'}
                </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.88em' }}>
                <Link to="/forgot-password" style={{ color: '#2563eb', textDecoration: 'none', display: 'block', marginBottom: '8px' }}>Forgot Password?</Link>
                <p style={{ margin: 0, color: '#64748b' }}>
                    Don't have an account?{' '}
                    <Link to="/register" onClick={handleRegisterClick} style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}>
                        Register
                    </Link>
                </p>
            </div>
            {error && <p style={{ color: '#ef4444', marginTop: '14px', textAlign: 'center', fontSize: '0.88em', background: '#fef2f2', padding: '8px', borderRadius: '6px', border: '1px solid #fecaca' }}>{error}</p>}
        </div>
    );
};

export default LoginForm;
