import React from 'react';
import { useLoading } from '../LoadingContext';
import './LoadingIndicator.css';

const LoadingIndicator = () => {
    const { isLoading } = useLoading();

    if (!isLoading) return null;

    return (
        <div className="loading-overlay">
            <div className="loading-spinner"></div>
        </div>
    );
};

export default LoadingIndicator;