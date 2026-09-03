import React, { useState, useEffect } from 'react';
import { apiService } from '../apiService';
import './AdminDashboard.css';
import EditUserRolesModal from './EditUserRolesModal';

import ActivityLogModal from './components/ActivityLogModal';
import { useNotification } from './NotificationContext';
const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [page, setPage] = useState(0);
    const [viewingUserLog, setViewingUserLog] = useState(null);
    const [totalPages, setTotalPages] = useState(0);
    const { showSuccess, showError } = useNotification();
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setPage(0); // Reset to first page on new search
        }, 500); // 500ms delay

        return () => {
            clearTimeout(timerId);
        };
    }, [searchTerm]);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const data = await apiService.getAllUsers(page, 10, `${sortConfig.key},${sortConfig.direction}`, debouncedSearchTerm);
                setUsers(data.content);
                setTotalPages(data.totalPages);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [page, sortConfig, debouncedSearchTerm]);

    const handleDelete = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await apiService.deleteUser(userId);
                setUsers(users.filter(user => user.id !== userId));
            } catch (err) {
                showError(err.message || 'Failed to delete user.');
            }
        }
    };

    const handleSaveRoles = (updatedUser) => {
        setUsers(users.map(user => user.id === updatedUser.id ? updatedUser : user));
        setEditingUser(null);
    };

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
    };

    const handleImpersonate = async (userId) => {
        if (window.confirm('Are you sure you want to impersonate this user? Your current session will be stored.')) {
            try {
                const response = await apiService.impersonateUser(userId);
                sessionStorage.setItem('admin_token', localStorage.getItem('token')); // Store admin token
                localStorage.setItem('token', response.token); // Set user token
                window.location.href = '/'; // Redirect to home to reload app state
            } catch (err) {
                showError(err.message || 'Failed to impersonate user.');
            }
        }
    };

    const handleTriggerPasswordReset = async (userId) => {
        if (window.confirm('Are you sure you want to trigger a password reset for this user? The reset link will be displayed to you.')) {
            try {
                const response = await apiService.triggerPasswordReset(userId);
                showSuccess(response); // Display the token/message from the backend
            } catch (err) {
                showError(err.message || 'Failed to trigger password reset.');
            }
        }
    };

    if (loading) return <div>Loading users...</div>;
    if (error) return <div className="error-message">Error: {error}</div>;

    return (
        <div className="admin-dashboard-container">
            {editingUser && (
                <EditUserRolesModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSave={handleSaveRoles}
                />
            )}
            {viewingUserLog && (
                <ActivityLogModal
                    user={viewingUserLog}
                    onClose={() => setViewingUserLog(null)}
                />
            )}
            <h2>Module 10: User Management</h2>
            <div className="admin-controls">
                <input
                    type="text"
                    placeholder="Search by username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>
            <table className="users-table">
                <thead>
                    <tr>
                        <th onClick={() => requestSort('id')}>ID{getSortIndicator('id')}</th>
                        <th onClick={() => requestSort('username')}>Username{getSortIndicator('username')}</th>
                        <th>Roles</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.username}</td>
                            <td>{user.roles.join(', ')}</td>
                            <td>
                                <button onClick={() => setEditingUser(user)} className="edit-button">Edit Roles</button>
                                <button onClick={() => setViewingUserLog(user)} className="view-activity-button">View Activity</button>
                                <button onClick={() => handleTriggerPasswordReset(user.id)} className="reset-password-button">Reset Password</button>
                                <button onClick={() => handleImpersonate(user.id)} className="impersonate-button">Impersonate</button>
                                <button onClick={() => handleDelete(user.id)} className="delete-button">Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="pagination-controls">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 0}>
                    Previous
                </button>
                <span>Page {page + 1} of {totalPages}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
                    Next
                </button>
            </div>
        </div>
    );
};

export default AdminDashboard;