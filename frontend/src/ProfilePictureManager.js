import React, { useState } from 'react';
import { apiService } from '../../apiService';

const ProfilePictureManager = ({ user, onPictureUpdate }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    const handleFileSelect = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handlePictureUpload = async () => {
        if (!selectedFile) {
            setUploadError('Please select a file first.');
            return;
        }
        setUploadError('');
        setIsUploading(true);
        try {
            const updatedUser = await apiService.uploadProfilePicture(selectedFile);
            onPictureUpdate(updatedUser); // Notify parent component
            setSelectedFile(null);
        } catch (err) {
            setUploadError(err.message || 'Failed to upload picture.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="profile-picture-section">
            <img src={user?.profilePictureUrl || 'https://via.placeholder.com/150'} alt="Profile" className="profile-picture" />
            <input type="file" onChange={handleFileSelect} accept="image/*" />
            <button onClick={handlePictureUpload} disabled={!selectedFile || isUploading}>
                {isUploading ? 'Uploading...' : 'Upload Picture'}
            </button>
            {uploadError && <p className="error-message">{uploadError}</p>}
        </div>
    );
};

export default ProfilePictureManager;