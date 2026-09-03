import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

import { apiService } from '../apiService';

const LoginForm = ({ onSwitchToRegister }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

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
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: 'auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '15px' }}>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }} />
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', fontSize: '1em', cursor: 'pointer' }}>{loading ? 'Logging in...' : 'Login'}</button>
            </form>
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <Link to="/forgot-password" style={{ fontSize: '0.9em' }}>Forgot Password?</Link>
                <p style={{ marginTop: '15px' }}>Don't have an account? <button onClick={onSwitchToRegister} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}>Register</button></p>
            </div>
            {error && <p style={{ color: 'red', marginTop: '10px', textAlign: 'center' }}>{error}</p>}
        </div>
    );
};

export default LoginForm;
