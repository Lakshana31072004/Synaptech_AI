import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { apiService } from './apiService';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user: adminUser } = useAuth();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await apiService.getAllUsers(0, 50);
                // Spring Data Page object returns content in .content or array directly
                setUsers(data?.content || (Array.isArray(data) ? data : []));
            } catch (err) {
                setError(err.message || 'Failed to fetch users.');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            try {
                await apiService.deleteUser(userId);
                setUsers(currentUsers => currentUsers.filter(u => u.id !== userId));

            } catch (err) {
                setError(err.message);
            }
        }
    };

    if (loading) return <div>Loading users...</div>;
    if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

    return (
        <div className="admin-dashboard-container" style={{ padding: '20px' }}>
            <h2>Admin Dashboard: User Management</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #333' }}>
                        <th style={{ padding: '10px', textAlign: 'left' }}>ID</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Username</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id} style={{ borderBottom: '1px solid #ccc' }}>
                            <td style={{ padding: '10px' }}>{user.id}</td>
                            <td style={{ padding: '10px' }}>{user.username}</td>
                            <td style={{ padding: '10px' }}>
                                <button disabled={user.id === adminUser.id} onClick={() => handleDeleteUser(user.id)} style={{ marginLeft: '5px' }}>
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminDashboard;