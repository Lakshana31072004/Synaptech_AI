import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ResetPasswordPage = () => {
    const [searchParams] = new URLSearchParams(window.location.search);
    const token = searchParams.get('token');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const passwordPolicy = {
        minLength: new RegExp('.{8,}'),
        uppercase: new RegExp('[A-Z]'),
        lowercase: new RegExp('[a-z]'),
        number: new RegExp('[0-9]'),
        specialChar: new RegExp('[@$!%*?&]'),
    };
    const isPasswordValid = Object.values(passwordPolicy).every(regex => regex.test(newPassword));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (!isPasswordValid) {
            setError("Password does not meet the strength requirements.");
            return;
        }
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword }),
            });
            const responseText = await response.text();
            if (!response.ok) throw new Error(responseText);
            setMessage(responseText);
        } catch (err) {
            setError(err.message || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: 'auto', padding: '20px' }}>
            <h2>Reset Password</h2>
            <form onSubmit={handleSubmit}>
                <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required style={{ width: '100%', padding: '8px', marginBottom: '10px' }} />
                <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={{ width: '100%', padding: '8px', marginBottom: '10px' }} />
                
                <div style={{ textAlign: 'left', fontSize: '0.8em', marginBottom: '15px' }}>
                    <p style={{ color: passwordPolicy.minLength.test(newPassword) ? 'green' : 'red' }}>At least 8 characters</p>
                    <p style={{ color: passwordPolicy.uppercase.test(newPassword) ? 'green' : 'red' }}>At least one uppercase letter</p>
                    <p style={{ color: passwordPolicy.lowercase.test(newPassword) ? 'green' : 'red' }}>At least one lowercase letter</p>
                    <p style={{ color: passwordPolicy.number.test(newPassword) ? 'green' : 'red' }}>At least one number</p>
                    <p style={{ color: passwordPolicy.specialChar.test(newPassword) ? 'green' : 'red' }}>At least one special character (@$!%*?&)</p>
                </div>

                <button type="submit" disabled={loading || !token} style={{ width: '100%', padding: '10px' }}>{loading ? 'Resetting...' : 'Reset Password'}</button>
            </form>
            {message && (
                <div style={{ color: 'green', marginTop: '10px' }}>
                    <p>{message} You can now log in.</p>
                    <Link to="/login">Go to Login</Link>
                </div>
            )}
            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
            {!token && <p style={{ color: 'red', marginTop: '10px' }}>No reset token found in URL. Please use the link from the console.</p>}
        </div>
    );
};

export default ResetPasswordPage;