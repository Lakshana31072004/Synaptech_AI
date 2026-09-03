import React, { useState, useEffect } from 'react';
import './ProfilePage.css';
import PasswordChanger from './PasswordChanger';
import ProfilePictureManager from './ProfilePictureManager';
import { useAuth } from './AuthContext';

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token } = useAuth();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/users/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch user data.');
                }
                const data = await response.json();
                setUser(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [token]);

    const handlePictureUpdate = (newUrl) => {
        setUser(currentUser => ({ ...currentUser, profile_picture_url: newUrl }));
    };

    if (loading) return <div>Loading profile...</div>;
    if (error) return <div className="error-message">Error: {error}</div>;

    return (
        <div className="profile-container">
            <h2>My Profile</h2>
            {user && (
                <>
                    <ProfilePictureManager currentPictureUrl={user.profile_picture_url} onPictureUpdate={handlePictureUpdate} />
                    <div className="profile-details">
                        <p><strong>ID:</strong> {user.id}</p>
                        <p><strong>Username:</strong> {user.username}</p>
                        <p><strong>Roles:</strong> {user.roles.join(', ')}</p>
                    </div>
                    <PasswordChanger />
                </>
            )}
        </div>
    );
};

export default ProfilePage;