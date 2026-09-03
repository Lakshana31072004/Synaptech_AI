import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { apiService } from '../apiService';

const LoginForm = ({ onSwitchToRegister }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const data = await apiService.login({ username, password });
            const jwtToken = data?.token || data?.accessToken;
            if (!jwtToken) {
                throw new Error('Authentication succeeded but no token was returned');
            }
            login(jwtToken);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterClick = (e) => {
        if (onSwitchToRegister) {
            e.preventDefault();
            onSwitchToRegister();
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: 'auto', padding: '24px', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#1e293b' }}>Login to ASEOS</h2>
            <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontSize: '0.9em', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Username</label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. developer or admin" required style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.9em', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }} />
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', fontSize: '1em', fontWeight: 600, color: '#fff', backgroundColor: '#3b82f6', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>{loading ? 'Logging in...' : 'Login'}</button>
            </form>
            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9em' }}>
                <Link to="/forgot-password" style={{ color: '#2563eb', textDecoration: 'none', display: 'block', marginBottom: '10px' }}>Forgot Password?</Link>
                <p style={{ margin: 0, color: '#64748b' }}>
                    Don't have an account?{' '}
                    <Link to="/register" onClick={handleRegisterClick} style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}>
                        Register
                    </Link>
                </p>
            </div>
            {error && <p style={{ color: '#ef4444', marginTop: '15px', textAlign: 'center', fontSize: '0.9em' }}>{error}</p>}
        </div>
    );
};

export default LoginForm;
