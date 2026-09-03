import React from 'react';
import { apiService } from './apiService';
import { withTranslation } from 'react-i18next'; // Import withTranslation

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);

        // Log the error to your backend for tracking
        try {
            apiService.logActivity('FRONTEND_ERROR', {
                error: error.toString(),
                componentStack: errorInfo.componentStack
            });
        } catch (loggingError) {
            console.error("Failed to log error to backend:", loggingError);
        }
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <h2>{this.props.t('somethingWentWrong')}</h2>
                    <p>{this.props.t('notifiedIssue')}</p>
                    <button onClick={() => window.location.reload()} className="view-activity-button">
                        {this.props.t('reloadPage')}
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default withTranslation()(ErrorBoundary); // Wrap with withTranslation