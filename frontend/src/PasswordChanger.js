import React, { useState } from 'react';
import { apiService } from './apiService';
import Modal from './Modal';

const PasswordChanger = () => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords do not match.");
            return;
        }
        setIsConfirmModalOpen(true);
    };

    const handlePasswordChangeConfirm = async () => {
        setIsConfirmModalOpen(false);
        setIsChangingPassword(true);
        try {
            const message = await apiService.changePassword({ oldPassword, newPassword });
            setPasswordSuccess(message || "Password changed successfully!");
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setPasswordError(err.message || "Failed to change password.");
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <div className="password-change-form">
            {isConfirmModalOpen && (
                <Modal
                    title="Confirm Password Change"
                    onClose={() => setIsConfirmModalOpen(false)}
                    footer={
                        <>
                            <button onClick={handlePasswordChangeConfirm} className="save-button">Confirm</button>
                            <button onClick={() => setIsConfirmModalOpen(false)} className="cancel-button">Cancel</button>
                        </>
                    }
                >
                    <p>Are you sure you want to change your password?</p>
                </Modal>
            )}
            <h3>Change Password</h3>
            <form onSubmit={handleSubmit}>
                <input
                    type="password"
                    placeholder="Old Password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                />
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
                <button type="submit" disabled={isChangingPassword}>{isChangingPassword ? 'Changing...' : 'Change Password'}</button>
            </form>
            {passwordError && <p className="error-message">{passwordError}</p>}
            {passwordSuccess && <p className="success-message">{passwordSuccess}</p>}
        </div>
    );
};

export default PasswordChanger;