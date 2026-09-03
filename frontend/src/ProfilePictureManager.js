import React, { useState } from 'react';
import { apiService } from './apiService';
import { useNotification } from './NotificationContext';

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'%3E%3Cpath fill-rule='evenodd' d='M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z' clip-rule='evenodd' /%3E%3C/svg%3E";

const ProfilePictureManager = ({ currentPictureUrl, onPictureUpdate }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState('');
    const { showSuccess, showError } = useNotification();

    const handleFileSelect = (event) => {
        const file = event.target.files[0] || null;
        setSelectedFile(file);
        setUploadError('');
        setUploadSuccess('');
        if (file) {
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setPreviewUrl(null);
        }
    };

    const handlePictureUpload = async () => {
        if (!selectedFile) {
            setUploadError('Please select an image file first.');
            return;
        }
        setUploadError('');
        setUploadSuccess('');
        setIsUploading(true);
        try {
            const data = await apiService.uploadProfilePicture(selectedFile);
            const newUrl = data.profilePictureUrl || data.profile_picture_url;
            onPictureUpdate(newUrl);
            setSelectedFile(null);
            setPreviewUrl(null);
            setUploadSuccess('Profile picture updated successfully!');
            showSuccess('Profile picture updated successfully!');
        } catch (err) {
            const msg = err.message || 'Failed to upload picture.';
            setUploadError(msg);
            showError(msg);
        } finally {
            setIsUploading(false);
        }
    };

    const displayUrl = previewUrl || (currentPictureUrl
        ? (currentPictureUrl.startsWith('http') ? currentPictureUrl : `http://localhost:8081${currentPictureUrl}`)
        : DEFAULT_AVATAR);

    return (
        <div className="profile-picture-section" style={{ textAlign: 'center', marginBottom: '25px' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                    src={displayUrl}
                    alt="Profile"
                    className="profile-picture"
                    style={{
                        width: '130px',
                        height: '130px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid #3b82f6',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        backgroundColor: '#f1f5f9'
                    }}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_AVATAR;
                    }}
                />
            </div>
            <div style={{ marginTop: '15px' }}>
                <input
                    type="file"
                    id="profile-file-input"
                    onChange={handleFileSelect}
                    accept="image/*"
                    style={{ display: 'none' }}
                />
                <label
                    htmlFor="profile-file-input"
                    style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        backgroundColor: '#f1f5f9',
                        color: '#334155',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9em',
                        fontWeight: 500,
                        marginRight: '10px'
                    }}
                >
                    {selectedFile ? selectedFile.name : 'Choose Image'}
                </label>
                <button
                    onClick={handlePictureUpload}
                    disabled={!selectedFile || isUploading}
                    style={{
                        padding: '8px 18px',
                        fontSize: '0.9em',
                        fontWeight: 600,
                        color: '#fff',
                        backgroundColor: selectedFile && !isUploading ? '#2563eb' : '#94a3b8',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: selectedFile && !isUploading ? 'pointer' : 'not-allowed'
                    }}
                >
                    {isUploading ? 'Uploading...' : 'Upload Picture'}
                </button>
            </div>
            {uploadSuccess && <p style={{ color: '#16a34a', marginTop: '10px', fontSize: '0.9em', fontWeight: 500 }}>{uploadSuccess}</p>}
            {uploadError && <p style={{ color: '#dc2626', marginTop: '10px', fontSize: '0.9em' }}>{uploadError}</p>}
        </div>
    );
};

export default ProfilePictureManager;
