import React, { useState, useEffect } from 'react';
import { apiService } from '../../apiService';

const UsernameEditor = ({ user, onUsernameUpdate }) => {
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [newUsername, setNewUsername] = useState(user.username);
    const [usernameError, setUsernameError] = useState('');
    const [isChangingUsername, setIsChangingUsername] = useState(false);

    useEffect(() => {
        setNewUsername(user.username);
    }, [user.username]);

    const handleUsernameChange = async (e) => {
        e.preventDefault();
        setUsernameError('');
        setIsChangingUsername(true);
        try {
            const response = await apiService.changeUsername(newUsername);
            localStorage.setItem('token', response.token);
            onUsernameUpdate({ ...user, username: newUsername });
            setIsEditingUsername(false);
        } catch (err) {
            setUsernameError(err.message || "Failed to change username.");
        } finally {
            setIsChangingUsername(false);
        }
    };

    if (isEditingUsername) {
        return (
            <form onSubmit={handleUsernameChange} className="username-edit-form">
                <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                />
                <button type="submit" disabled={isChangingUsername}>{isChangingUsername ? 'Saving...' : 'Save'}</button>
                <button type="button" onClick={() => setIsEditingUsername(false)} disabled={isChangingUsername}>Cancel</button>
                {usernameError && <p className="error-message">{usernameError}</p>}
            </form>
        );
    }

    return (
        <p><strong>Username:</strong> {user.username} <button onClick={() => setIsEditingUsername(true)} className="inline-edit-button">Edit</button></p>
    );
};

export default UsernameEditor;