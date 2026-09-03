import React, { createContext, useState, useContext, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((message, type = 'info', onClick = null, data = null) => {
        const id = uuidv4();
        setNotifications((prev) => [...prev, { id, message, type, onClick, data }]);
        setTimeout(() => {
            setNotifications((prev) => prev.filter((notif) => notif.id !== id));
        }, 5000); // Auto-dismiss after 5 seconds
    }, []);

    const showSuccess = useCallback((message, onClick = null, data = null) => addNotification(message, 'success', onClick, data), [addNotification]);
    const showError = useCallback((message, onClick = null, data = null) => addNotification(message, 'error', onClick, data), [addNotification]);
    const showInfo = useCallback((message, onClick = null, data = null) => addNotification(message, 'info', onClick, data), [addNotification]);

    return (
        <NotificationContext.Provider value={{ showSuccess, showError, showInfo }}>
            {children}
            <div className="notification-container">
                {notifications.map((notif) => (
                    <div
                        key={notif.id}
                        className={`notification-item notification-${notif.type}`}
                        onClick={notif.onClick ? () => notif.onClick(notif.data) : null}
                        style={notif.onClick ? { cursor: 'pointer' } : {}}
                    >
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