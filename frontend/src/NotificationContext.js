import React, { createContext, useState, useContext, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((message, type = 'info') => {
        const id = uuidv4();
        setNotifications((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications((prev) => prev.filter((notif) => notif.id !== id));
        }, 5000); // Auto-dismiss after 5 seconds
    }, []);

    const showSuccess = useCallback((message) => addNotification(message, 'success'), [addNotification]);
    const showError = useCallback((message) => addNotification(message, 'error'), [addNotification]);
    const showInfo = useCallback((message) => addNotification(message, 'info'), [addNotification]);

    return (
        <NotificationContext.Provider value={{ showSuccess, showError, showInfo }}>
            {children}
            <div className="notification-container">
                {notifications.map((notif) => (
                    <div key={notif.id} className={`notification-item notification-${notif.type}`}>
                        {notif.message}
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    return useContext(NotificationContext);
};