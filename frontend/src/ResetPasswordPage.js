import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiService } from '../apiService';

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (!token) {
            setError("No reset token found. Please request a new link.");
            return;
        }

        try {
            const response = await apiService.resetPassword({ token, newPassword });
            setMessage(response);
        } catch (err) {
            setError(err.message || 'Failed to reset password.');
        }
    };

    return (
        <div className="auth-container">
            <form onSubmit={handleSubmit} className="auth-form">
                <h2>Reset Your Password</h2>
                <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
                <button type="submit">Reset Password</button>
                {message && <p className="success-message">{message} You can now <Link to="/">login</Link>.</p>}
                {error && <p className="error-message">{error}</p>}
            </form>
        </div>
    );
};

export default ResetPasswordPage;