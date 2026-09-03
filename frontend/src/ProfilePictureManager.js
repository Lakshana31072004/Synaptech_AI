import React, { useState } from 'react';
import { useAuth } from './AuthContext';

const ProfilePictureManager = ({ currentPictureUrl, onPictureUpdate }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const { token } = useAuth();

    const handleFileSelect = (event) => {
        setSelectedFile(event.target.files[0] || null);
        setUploadError('');
    };

    const handlePictureUpload = async () => {
        if (!selectedFile) {
            setUploadError('Please select a file first.');
            return;
        }
        setUploadError('');
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await fetch('http://localhost:3000/api/users/me/profile-picture', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });

            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || 'File upload failed.');
            }
            const data = await response.json();
            onPictureUpdate(data.profilePictureUrl);
            setSelectedFile(null);
        } catch (err) {
            setUploadError(err.message || 'Failed to upload picture.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="profile-picture-section">
            <img
                src={currentPictureUrl ? `http://localhost:3000${currentPictureUrl}` : 'https://via.placeholder.com/150'}
                alt="Profile"
                className="profile-picture"
            />
            <input type="file" onChange={handleFileSelect} accept="image/*" />
            <button onClick={handlePictureUpload} disabled={!selectedFile || isUploading}>
                {isUploading ? 'Uploading...' : 'Upload Picture'}
            </button>
            {uploadError && <p className="error-message">{uploadError}</p>}
        </div>
    );
};

export default ProfilePictureManager;
