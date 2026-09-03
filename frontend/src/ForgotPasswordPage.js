import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from './apiService';

const ForgotPasswordPage = () => {
    const [username, setUsername] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);
        try {
            const res = await apiService.forgotPassword(username);
            setMessage(typeof res === 'string' ? res : 'Reset instructions processed.');
        } catch (err) {
            setError(err.message || 'An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: 'auto', padding: '20px' }}>
            <h2>Forgot Password</h2>
            <p>Enter your username. If an account exists, a reset link will be generated in the backend console.</p>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Your Username" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ width: '100%', padding: '8px', marginBottom: '10px' }} />
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px' }}>{loading ? 'Sending...' : 'Send Reset Link'}</button>
            </form>
            {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <Link to="/login">Back to Login</Link>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;