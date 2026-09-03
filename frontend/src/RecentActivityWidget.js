import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../apiService';
import './RecentActivityWidget.css';
import { Client } from '@stomp/stompjs';
import { useNotification } from './NotificationContext';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import SockJS from 'sockjs-client';

const RecentActivityWidget = () => {
    const [recentLogs, setRecentLogs] = useState([]);
    const WIDGET_LOG_LIMIT = 5;
    const { t, i18n } = useTranslation(); // Initialize useTranslation
    const [highlightedLogId, setHighlightedLogId] = useState(null);
    const { showSuccess } = useNotification();

    useEffect(() => {
        // Initial fetch of recent logs via HTTP
        const fetchRecentLogs = async () => {
            try {
                const data = await apiService.getAllUserActivity(0, WIDGET_LOG_LIMIT);
                setRecentLogs(data.content);
            } catch (err) {
                // Errors are handled globally
            }
        };
        fetchRecentLogs();

        // Set up WebSocket client
        const stompClient = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            onConnect: () => {
                stompClient.subscribe('/topic/recent-activity', (message) => {
                    const newLog = JSON.parse(message.body);
                    setRecentLogs(currentLogs => {
                        // Add new log to the top and maintain the limit
                        const updatedLogs = [newLog, ...currentLogs];
                        return updatedLogs.slice(0, WIDGET_LOG_LIMIT);
                    });
                    showSuccess(t('newActivity', { username: newLog.username, action: newLog.action.replace(/_/g, ' ').toLowerCase() }));
                });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
        });

        stompClient.activate();

        // Cleanup on component unmount
        return () => {
            stompClient.deactivate();
        };
    }, []);

    return (
        <div className="recent-activity-widget">
            <h3>Recent User Activity</h3>
            {recentLogs.length > 0 ? (
                <ul>
                    {recentLogs.map(log => (
                        <li key={log.id}>
                            <span className="log-user">{log.username}</span>
                            <span className="log-action">{log.action.replace(/_/g, ' ').toLowerCase()}</span>
                            <span className="log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No recent activity found.</p>
            )}
            <div className="widget-footer">
                <Link to="/admin/activity">View All Activity</Link>
            </div>
        </div>
    );
};

export default RecentActivityWidget;