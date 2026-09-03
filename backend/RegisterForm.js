import React, { useState } from 'react';

const RegisterForm = ({ onSwitchToLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [notification, setNotification] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setNotification('');
        try {
            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const responseText = await response.text();
            if (!response.ok) {
                throw new Error(responseText || 'Registration failed');
            }
            setNotification('Registration successful! Please log in.');
            setTimeout(() => onSwitchToLogin(), 2000); // Switch to login after a short delay
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: 'auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
            <h2>Register New Account</h2>
            <form onSubmit={handleRegister}>
                <div style={{ marginBottom: '15px' }}>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }} />
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', fontSize: '1em', cursor: 'pointer' }}>{loading ? 'Registering...' : 'Register'}</button>
            </form>
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <p>Already have an account? <button onClick={onSwitchToLogin} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}>Login</button></p>
            </div>
            {error && <p style={{ color: 'red', marginTop: '10px', textAlign: 'center' }}>{error}</p>}
            {notification && <p style={{ color: 'green', marginTop: '10px', textAlign: 'center' }}>{notification}</p>}
        </div>
    );
};

export default RegisterForm;