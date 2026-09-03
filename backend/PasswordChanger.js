import React, { useState } from 'react';
import { useAuth } from '../../AuthContext';

const PasswordChanger = ({ onPasswordChange }) => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { token } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/users/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ oldPassword, newPassword }),
            });

            const responseText = await response.text();
            if (!response.ok) {
                throw new Error(responseText || 'Failed to change password.');
            }

            setSuccess(responseText);
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            if (onPasswordChange) onPasswordChange();

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="password-change-form">
            <h3>Change Password</h3>
            <form onSubmit={handleSubmit}>
                <input type="password" placeholder="Current Password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
                <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                <button type="submit" disabled={loading}>{loading ? 'Updating...' : 'Update Password'}</button>
            </form>
            {error && <p className="error-message" style={{ marginTop: '10px' }}>{error}</p>}
            {success && <p className="success-message" style={{ marginTop: '10px' }}>{success}</p>}
        </div>
    );
};

export default PasswordChanger;