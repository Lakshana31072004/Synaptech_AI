import React, { useState, useEffect } from 'react';
import { apiService } from './apiService';
import Papa from 'papaparse';
import { Link, useLocation } from 'react-router-dom';
import './ActivityLogModal.css'; // Re-use styles for the table
import './AdminDashboard.css'; // Re-use styles for pagination
import useDebounce from './hooks/useDebounce'; // Import the new hook
import { useTranslation } from 'react-i18next'; // Import useTranslation

const AllActivityLogs = () => {
    const { t } = useTranslation(); // Initialize useTranslation
    const [logs, setLogs] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [isExporting, setIsExporting] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
    const [usernameFilter, setUsernameFilter] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const location = useLocation();

    // Initialize filter from URL query parameter
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const username = params.get('username');
        if (username) setUsernameFilter(username);
    }, [location.search]);

    // Use the custom useDebounce hook for filter inputs
    const debouncedUsername = useDebounce(usernameFilter, 500);
    const debouncedAction = useDebounce(actionFilter, 500);
    const debouncedStartDate = useDebounce(startDate, 500);
    const debouncedEndDate = useDebounce(endDate, 500);

    useEffect(() => {
        const fetchAllLogs = async () => {
            try {
                const sortString = `${sortConfig.key},${sortConfig.direction}`;
                const data = await apiService.getAllUserActivity(page, 15, debouncedUsername, debouncedAction, debouncedStartDate, debouncedEndDate, sortString);
                setLogs(data.content);
                setTotalPages(data.totalPages);
            } catch (err) {
                // Errors are handled by the global notification service
            }
        };
        fetchAllLogs();
    }, [page, debouncedUsername, debouncedAction, debouncedStartDate, debouncedEndDate, sortConfig]);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const allLogs = [];
            // Fetch all pages of data for the current filter
            for (let i = 0; i < totalPages; i++) {
                const sortString = `${sortConfig.key},${sortConfig.direction}`;
                const data = await apiService.getAllUserActivity(i, 20, debouncedUsername, debouncedAction, debouncedStartDate, debouncedEndDate, sortString); // Using a page size of 20 for export
                allLogs.push(...data.content);
            }

            const csvData = allLogs.map(log => ({
                Username: log.username,
                Action: log.action,
                Timestamp: new Date(log.timestamp).toLocaleString(i18n.language), // Use i18n.language for locale
                Details: log.details || 'N/A'
            }));

            const csv = Papa.unparse(csvData);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'activity_logs.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } finally {
            setIsExporting(false);
        }
    };

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        setPage(0); // Reset to first page on sort
    };

    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
    };

    const handleClearFilters = () => {
        setUsernameFilter('');
        setActionFilter('');
        setStartDate('');
        setEndDate('');
    };

    const isRecent = (timestamp) => {
        const logDate = new Date(timestamp);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return logDate > oneHourAgo;
    };

    return (
        <div className="admin-dashboard-container">
            <h2>All User Activity</h2>
            <div className="admin-controls" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                <input
                    type="text"
                    placeholder="Filter by username..."
                    value={usernameFilter}
                    onChange={(e) => setUsernameFilter(e.target.value)}
                    className="search-input"
                />
                <input
                    type="text" // This will be changed to a select in the i18n section
                    placeholder="Filter by action type..."
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="search-input"
                />
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="search-input"
                    title="Start Date"
                />
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="search-input"
                    title="End Date"
                />
                <button onClick={handleClearFilters} className="view-activity-button">
                    Clear Filters
                </button>
                <Link to="/admin/activity/archive" className="view-activity-button">
                    View Archived Logs
                </Link>
                </div>
                <button onClick={handleExport} disabled={isExporting} className="edit-button">
                    {isExporting ? t('exporting') : t('exportToCSV')}
                </button>
            </div>
            <table className="activity-log-table">
                <thead>
                    <tr>
                        <th onClick={() => requestSort('user.username')}>{t('user')}{getSortIndicator('user.username')}</th>
                        <th onClick={() => requestSort('action')}>{t('action')}{getSortIndicator('action')}</th>
                        <th onClick={() => requestSort('timestamp')}>{t('timestamp')}{getSortIndicator('timestamp')}</th>
                        <th>{t('details')}</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map(log => (
                        <tr key={log.id} className={isRecent(log.timestamp) ? 'recent-log' : ''}>
                            <td>{log.username}</td>
                            <td>{t(log.action)}</td> {/* Translate action type if needed */}
                            <td>{new Date(log.timestamp).toLocaleString(i18n.language)}</td>
                            <td>{log.details || 'N/A'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="pagination-controls">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                    {t('previous')}
                </button>
                <span>{t('page')} {page + 1} {t('of')} {totalPages}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
                    {t('next')}
                </button>
            </div>
        </div>
    );
};

export default AllActivityLogs;