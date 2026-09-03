import React, { useState } from 'react';
import { apiService } from '../apiService';
import { Link } from 'react-router-dom';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);
        try {
            const response = await apiService.forgotPassword(email);
            setMessage(response);
        } catch (err) {
            setError(err.message || 'An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <form onSubmit={handleSubmit} className="auth-form">
                <h2>Forgot Password</h2>
                <p>Enter your email address and we'll send you a link to reset your password (link will appear in the backend console).</p>
                <input
                    type="email"
                    placeholder="Your Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send Reset Link'}</button>
                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}
                <Link to="/" className="toggle-auth">Back to Login</Link>
            </form>
        </div>
    );
};

export default ForgotPasswordPage;