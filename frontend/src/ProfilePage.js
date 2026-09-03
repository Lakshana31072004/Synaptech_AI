import React, { useState, useEffect } from 'react';
import { apiService } from '../apiService';
import './ProfilePage.css';
import ProfilePictureManager from '../components/profile/ProfilePictureManager';
import UsernameEditor from '../components/profile/UsernameEditor';
import { useNotification } from '../NotificationContext';
import PasswordChanger from '../components/profile/PasswordChanger';

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { showError } = useNotification();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const data = await apiService.getCurrentUser();
                setUser(data);
            } catch (err) {
                showError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    if (loading) return <div>Loading profile...</div>;
    if (error) return <div className="error-message">Error: {error}</div>;

    return (
        <div className="profile-container">
            <h2>My Profile</h2>
            {user && (
                <>
                    <ProfilePictureManager user={user} onPictureUpdate={setUser} />
                    <div className="profile-details">
                        <UsernameEditor user={user} onUsernameUpdate={setUser} />
                        <p><strong>ID:</strong> {user.id}</p>
                        <p><strong>Roles:</strong> {user.roles.join(', ')}</p>
                    </div>
                    <PasswordChanger />
                </>
            )}
        </div>
    );
};

export default ProfilePage;