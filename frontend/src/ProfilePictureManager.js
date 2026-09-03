import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { apiService } from './apiService';

const ProfilePictureManager = ({ currentPictureUrl, onPictureUpdate }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

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
            const data = await apiService.uploadProfilePicture(selectedFile);
            onPictureUpdate(data.profilePictureUrl);
            setSelectedFile(null);
        } catch (err) {
            setUploadError(err.message || 'Failed to upload picture.');
        } finally {
            setIsUploading(false);
        }
    };

    const imageUrl = currentPictureUrl
        ? (currentPictureUrl.startsWith('http') ? currentPictureUrl : `http://localhost:8081${currentPictureUrl}`)
        : 'https://via.placeholder.com/150';

    return (
        <div className="profile-picture-section">
            <img
                src={imageUrl}
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
