import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { apiService } from './apiService';
import { useNotification } from './NotificationContext';
import { Link } from 'react-router-dom';

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%239ca3af'%3E%3Cpath fill-rule='evenodd' d='M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z' clip-rule='evenodd' /%3E%3C/svg%3E";

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [availableRoles, setAvailableRoles] = useState(['ROLE_USER', 'ROLE_ADMIN']);
    
    // Modal states
    const [editingUser, setEditingUser] = useState(null); // user object for role editing
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [isSavingRoles, setIsSavingRoles] = useState(false);

    const [passwordUser, setPasswordUser] = useState(null); // user object for password change
    const [newPassword, setNewPassword] = useState('');
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [resetTokenInfo, setResetTokenInfo] = useState('');

    const [activityUser, setActivityUser] = useState(null); // user object for activity modal
    const [userActivities, setUserActivities] = useState([]);
    const [loadingActivity, setLoadingActivity] = useState(false);

    // Create User modal state
    const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
    const [createUsername, setCreateUsername] = useState('');
    const [createPassword, setCreatePassword] = useState('');
    const [createRoles, setCreateRoles] = useState(['ROLE_USER']);
    const [isCreatingUser, setIsCreatingUser] = useState(false);

    const { user: adminUser, userProfile, login } = useAuth();
    const { showSuccess, showError } = useNotification();

    const fetchUsers = useCallback(async (query = '') => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiService.getAllUsers(0, 100, 'id,asc', query);
            const userList = data?.content || (Array.isArray(data) ? data : []);
            setUsers(userList);
        } catch (err) {
            setError(err.message || 'Failed to fetch users.');
            showError(err.message || 'Failed to fetch users.');
        } finally {
            setLoading(false);
        }
    }, [showError]);

    const fetchRoles = useCallback(async () => {
        try {
            const roles = await apiService.getAllRoles();
            if (Array.isArray(roles) && roles.length > 0) {
                setAvailableRoles(roles);
            }
        } catch (e) {
            console.error('Failed to fetch roles:', e);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, [fetchUsers, fetchRoles]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchUsers(searchQuery);
    };

    const handleSearchClear = () => {
        setSearchQuery('');
        fetchUsers('');
    };

    // --- Role Editing Handlers ---
    const openRoleModal = (user) => {
        setEditingUser(user);
        setSelectedRoles(user.roles || []);
    };

    const toggleRole = (role) => {
        if (selectedRoles.includes(role)) {
            setSelectedRoles(selectedRoles.filter(r => r !== role));
        } else {
            setSelectedRoles([...selectedRoles, role]);
        }
    };

    const handleSaveRoles = async () => {
        if (!editingUser) return;
        if (selectedRoles.length === 0) {
            showError('User must have at least one role assigned.');
            return;
        }
        setIsSavingRoles(true);
        try {
            const updated = await apiService.updateUserRoles(editingUser.id, selectedRoles);
            setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, roles: updated.roles || selectedRoles } : u));
            showSuccess(`Roles updated successfully for ${editingUser.username}!`);
            setEditingUser(null);
        } catch (err) {
            showError(err.message || 'Failed to update roles.');
        } finally {
            setIsSavingRoles(false);
        }
    };

    // --- Password Handlers ---
    const openPasswordModal = (user) => {
        setPasswordUser(user);
        setNewPassword('');
        setResetTokenInfo('');
    };

    const handleUpdatePassword = async () => {
        if (!passwordUser) return;
        if (!newPassword || newPassword.length < 4) {
            showError('Password must be at least 4 characters long.');
            return;
        }
        setIsSavingPassword(true);
        try {
            await apiService.updateUserPassword(passwordUser.id, newPassword);
            showSuccess(`Password updated successfully for ${passwordUser.username}!`);
            setPasswordUser(null);
        } catch (err) {
            showError(err.message || 'Failed to update password.');
        } finally {
            setIsSavingPassword(false);
        }
    };

    const handleGenerateResetToken = async () => {
        if (!passwordUser) return;
        setIsSavingPassword(true);
        try {
            const res = await apiService.triggerPasswordReset(passwordUser.id);
            setResetTokenInfo(typeof res === 'string' ? res : JSON.stringify(res));
            showSuccess('Password reset link generated!');
        } catch (err) {
            showError(err.message || 'Failed to generate reset link.');
        } finally {
            setIsSavingPassword(false);
        }
    };

    // --- Activity Modal Handlers ---
    const openActivityModal = async (user) => {
        setActivityUser(user);
        setLoadingActivity(true);
        setUserActivities([]);
        try {
            const data = await apiService.getUserActivity(user.id, 0, 20);
            setUserActivities(data?.content || (Array.isArray(data) ? data : []));
        } catch (err) {
            showError(err.message || 'Failed to load user activity.');
        } finally {
            setLoadingActivity(false);
        }
    };

    // --- Create User Handlers ---
    const openCreateUserModal = () => {
        setCreateUsername('');
        setCreatePassword('');
        setCreateRoles(['ROLE_USER']);
        setIsCreateUserOpen(true);
    };

    const toggleCreateRole = (role) => {
        if (createRoles.includes(role)) {
            setCreateRoles(createRoles.filter(r => r !== role));
        } else {
            setCreateRoles([...createRoles, role]);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        if (!createUsername.trim()) {
            showError('Please enter a username.');
            return;
        }
        if (!createPassword || createPassword.length < 4) {
            showError('Password must be at least 4 characters long.');
            return;
        }
        if (createRoles.length === 0) {
            showError('Please select at least one role for the user.');
            return;
        }
        setIsCreatingUser(true);
        try {
            const newUser = await apiService.createUserByAdmin({
                username: createUsername.trim(),
                password: createPassword,
                roles: createRoles
            });
            setUsers(prev => [newUser, ...prev]);
            showSuccess(`User "${createUsername}" created successfully!`);
            setIsCreateUserOpen(false);
        } catch (err) {
            showError(err.message || 'Failed to create user.');
        } finally {
            setIsCreatingUser(false);
        }
    };

    // --- Impersonate User ---
    const handleImpersonate = async (user) => {
        if (window.confirm(`Are you sure you want to log in as ${user.username}? You will be logged into their account.`)) {
            try {
                const res = await apiService.impersonateUser(user.id);
                if (res?.token) {
                    showSuccess(`Switched to user ${user.username}!`);
                    login(res.token);
                    window.location.href = '/';
                }
            } catch (err) {
                showError(err.message || 'Impersonation failed.');
            }
        }
    };

    // --- Delete User Handler ---
    const handleDeleteUser = async (userId, username) => {
        if (window.confirm(`Are you sure you want to permanently delete user "${username}" (ID: ${userId})? This action cannot be undone.`)) {
            try {
                await apiService.deleteUser(userId);
                setUsers(currentUsers => currentUsers.filter(u => u.id !== userId));
                showSuccess(`User "${username}" deleted successfully.`);
            } catch (err) {
                showError(err.message || 'Failed to delete user.');
            }
        }
    };

    const currentUsername = userProfile?.username || adminUser?.sub;
    const adminCount = users.filter(u => u.roles?.includes('ROLE_ADMIN') || u.roles?.includes('Admin')).length;

    return (
        <div style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {/* Header section */}
            <div style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                color: '#fff',
                padding: '24px 30px',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div>
                    <h2 style={{ margin: '0 0 6px 0', fontSize: '1.6rem', fontWeight: '700', letterSpacing: '-0.02em' }}>
                        Admin Console: User Management
                    </h2>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>
                        Manage user accounts, assign roles, reset passwords, and inspect audit activity.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.08)', padding: '8px 16px', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#38bdf8' }}>{users.length}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Total Users</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.08)', padding: '8px 16px', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#a78bfa' }}>{adminCount}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Admins</div>
                    </div>
                </div>
            </div>

            {/* Controls Bar: Search & Refresh */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                gap: '12px',
                flexWrap: 'wrap'
            }}>
                <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: '1', maxWidth: '450px' }}>
                    <input
                        type="text"
                        placeholder="Search by username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            flex: '1',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.95rem',
                            outline: 'none'
                        }}
                    />
                    <button
                        type="submit"
                        style={{
                            padding: '10px 18px',
                            background: '#2563eb',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Search
                    </button>
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={handleSearchClear}
                            style={{
                                padding: '10px 14px',
                                background: '#f1f5f9',
                                color: '#475569',
                                border: '1px solid #cbd5e1',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            Clear
                        </button>
                    )}
                </form>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => fetchUsers(searchQuery)}
                        style={{
                            padding: '10px 16px',
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            color: '#334155',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        🔄 Refresh
                    </button>
                    <button
                        type="button"
                        onClick={openCreateUserModal}
                        style={{
                            padding: '10px 16px',
                            background: '#059669',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        ➕ Add New User
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #f87171', borderRadius: '8px', color: '#991b1b', marginBottom: '20px' }}>
                    {error}
                </div>
            )}

            {/* Users Table Card */}
            <div style={{
                background: '#fff',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)',
                border: '1px solid #e2e8f0',
                overflow: 'hidden'
            }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
                        Loading users...
                    </div>
                ) : users.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
                        No users found. {searchQuery ? 'Try clearing your search query.' : ''}
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <th style={{ padding: '14px 20px' }}>User</th>
                                <th style={{ padding: '14px 16px' }}>ID</th>
                                <th style={{ padding: '14px 20px' }}>Roles</th>
                                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, idx) => {
                                const isCurrent = user.username === currentUsername;
                                const avatarSrc = user.profilePictureUrl
                                    ? (user.profilePictureUrl.startsWith('http') ? user.profilePictureUrl : `http://localhost:8081${user.profilePictureUrl}`)
                                    : DEFAULT_AVATAR;

                                return (
                                    <tr
                                        key={user.id}
                                        style={{
                                            borderBottom: idx === users.length - 1 ? 'none' : '1px solid #f1f5f9',
                                            transition: 'background-color 0.15s ease',
                                            background: isCurrent ? '#f0fdf4' : 'transparent'
                                        }}
                                    >
                                        {/* User Avatar + Username */}
                                        <td style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <img
                                                src={avatarSrc}
                                                alt={user.username}
                                                style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #cbd5e1' }}
                                                onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_AVATAR; }}
                                            />
                                            <div>
                                                <div style={{ fontWeight: '600', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {user.username}
                                                    {isCurrent && (
                                                        <span style={{ fontSize: '0.7rem', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>
                                                            YOU
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* User ID */}
                                        <td style={{ padding: '14px 16px', color: '#64748b', fontWeight: '500' }}>
                                            #{user.id}
                                        </td>

                                        {/* Roles Badges */}
                                        <td style={{ padding: '14px 20px' }}>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                {user.roles && user.roles.length > 0 ? (
                                                    user.roles.map(role => {
                                                        const isAdminRole = role === 'ROLE_ADMIN' || role === 'Admin';
                                                        return (
                                                            <span
                                                                key={role}
                                                                style={{
                                                                    padding: '3px 10px',
                                                                    borderRadius: '20px',
                                                                    fontSize: '0.78rem',
                                                                    fontWeight: '600',
                                                                    background: isAdminRole ? '#ede9fe' : '#e0f2fe',
                                                                    color: isAdminRole ? '#6b21a8' : '#0369a1',
                                                                    border: isAdminRole ? '1px solid #c084fc' : '1px solid #7dd3fc'
                                                                }}
                                                            >
                                                                {role}
                                                            </span>
                                                        );
                                                    })
                                                ) : (
                                                    <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>None</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Actions Column */}
                                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                            <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                {/* Edit Roles Button */}
                                                <button
                                                    onClick={() => openRoleModal(user)}
                                                    title="Edit user roles"
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: '#f8fafc',
                                                        border: '1px solid #cbd5e1',
                                                        borderRadius: '6px',
                                                        color: '#1e293b',
                                                        cursor: 'pointer',
                                                        fontSize: '0.82rem',
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    ✏️ Roles
                                                </button>

                                                {/* Password Reset Button */}
                                                <button
                                                    onClick={() => openPasswordModal(user)}
                                                    title="Reset user password"
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: '#f8fafc',
                                                        border: '1px solid #cbd5e1',
                                                        borderRadius: '6px',
                                                        color: '#1e293b',
                                                        cursor: 'pointer',
                                                        fontSize: '0.82rem',
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    🔑 Password
                                                </button>

                                                {/* User Activity Button */}
                                                <button
                                                    onClick={() => openActivityModal(user)}
                                                    title="View user activity history"
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: '#f8fafc',
                                                        border: '1px solid #cbd5e1',
                                                        borderRadius: '6px',
                                                        color: '#1e293b',
                                                        cursor: 'pointer',
                                                        fontSize: '0.82rem',
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    📜 Activity
                                                </button>

                                                {/* Impersonate Button (disabled for self) */}
                                                {!isCurrent && (
                                                    <button
                                                        onClick={() => handleImpersonate(user)}
                                                        title={`Switch into ${user.username}'s account`}
                                                        style={{
                                                            padding: '6px 12px',
                                                            background: '#e0f2fe',
                                                            border: '1px solid #bae6fd',
                                                            borderRadius: '6px',
                                                            color: '#0369a1',
                                                            cursor: 'pointer',
                                                            fontSize: '0.82rem',
                                                            fontWeight: '600'
                                                        }}
                                                    >
                                                        👤 Login As
                                                    </button>
                                                )}

                                                {/* Delete Button (disabled for self) */}
                                                <button
                                                    disabled={isCurrent}
                                                    onClick={() => handleDeleteUser(user.id, user.username)}
                                                    title={isCurrent ? "You cannot delete your own admin account" : `Delete ${user.username}`}
                                                    style={{
                                                        padding: '6px 12px',
                                                        background: isCurrent ? '#f1f5f9' : '#fee2e2',
                                                        border: isCurrent ? '1px solid #e2e8f0' : '1px solid #fecaca',
                                                        borderRadius: '6px',
                                                        color: isCurrent ? '#94a3b8' : '#b91c1c',
                                                        cursor: isCurrent ? 'not-allowed' : 'pointer',
                                                        fontSize: '0.82rem',
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* --- MODAL 1: Edit Roles Modal --- */}
            {editingUser && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '12px',
                        padding: '24px 28px',
                        width: '90%',
                        maxWidth: '440px',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
                    }}>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', color: '#0f172a' }}>
                            Edit Roles for: <span style={{ color: '#2563eb' }}>{editingUser.username}</span>
                        </h3>
                        <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '0.9rem' }}>
                            Select the access roles for this account.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                            {availableRoles.map(role => (
                                <label
                                    key={role}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        background: selectedRoles.includes(role) ? '#f0f9ff' : '#fff',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedRoles.includes(role)}
                                        onChange={() => toggleRole(role)}
                                        style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
                                    />
                                    <div>
                                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{role}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                            {role === 'ROLE_ADMIN' ? 'Full administrative access and user management' : 'Standard user privileges for Synaptech tools'}
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={() => setEditingUser(null)}
                                style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isSavingRoles}
                                onClick={handleSaveRoles}
                                style={{ padding: '8px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                            >
                                {isSavingRoles ? 'Saving...' : 'Save Roles'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 2: Reset / Update Password Modal --- */}
            {passwordUser && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '12px',
                        padding: '24px 28px',
                        width: '90%',
                        maxWidth: '460px',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
                    }}>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', color: '#0f172a' }}>
                            Password Management: <span style={{ color: '#2563eb' }}>{passwordUser.username}</span>
                        </h3>
                        <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '0.9rem' }}>
                            Directly set a new password or generate a one-time reset token link.
                        </p>

                        <div style={{ marginBottom: '18px' }}>
                            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem', color: '#334155' }}>
                                Set New Password Directly:
                            </label>
                            <input
                                type="password"
                                placeholder="Enter new password (min 4 chars)"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '0.95rem',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <button
                                type="button"
                                disabled={isSavingPassword || !newPassword}
                                onClick={handleUpdatePassword}
                                style={{
                                    marginTop: '8px',
                                    width: '100%',
                                    padding: '10px',
                                    background: '#2563eb',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontWeight: '600',
                                    cursor: isSavingPassword || !newPassword ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isSavingPassword ? 'Updating...' : 'Update Password Directly'}
                            </button>
                        </div>

                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginBottom: '18px' }}>
                            <button
                                type="button"
                                disabled={isSavingPassword}
                                onClick={handleGenerateResetToken}
                                style={{
                                    width: '100%',
                                    padding: '9px',
                                    background: '#f8fafc',
                                    color: '#334155',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                🔗 Generate Password Reset Link Token
                            </button>
                            {resetTokenInfo && (
                                <div style={{
                                    marginTop: '10px',
                                    padding: '10px',
                                    background: '#f0fdf4',
                                    border: '1px solid #86efac',
                                    borderRadius: '6px',
                                    fontSize: '0.82rem',
                                    color: '#166534',
                                    wordBreak: 'break-all'
                                }}>
                                    {resetTokenInfo}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => setPasswordUser(null)}
                                style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 3: User Activity Audit Modal --- */}
            {activityUser && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '12px',
                        padding: '24px 28px',
                        width: '90%',
                        maxWidth: '650px',
                        maxHeight: '80vh',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
                    }}>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', color: '#0f172a' }}>
                            Activity Audit: <span style={{ color: '#2563eb' }}>{activityUser.username}</span>
                        </h3>
                        <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '0.9rem' }}>
                            Recent security and action logs for this account.
                        </p>

                        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '16px' }}>
                            {loadingActivity ? (
                                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Loading logs...</div>
                            ) : userActivities.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No activity logs recorded for this user.</div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                                            <th style={{ padding: '8px 12px' }}>Action</th>
                                            <th style={{ padding: '8px 12px' }}>Details</th>
                                            <th style={{ padding: '8px 12px' }}>Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {userActivities.map(log => (
                                            <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '8px 12px', fontWeight: '600', color: '#1e293b' }}>{log.action}</td>
                                                <td style={{ padding: '8px 12px', color: '#475569' }}>{log.details || '-'}</td>
                                                <td style={{ padding: '8px 12px', color: '#64748b', fontSize: '0.8rem' }}>
                                                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => setActivityUser(null)}
                                style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 4: Create User Modal --- */}
            {isCreateUserOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '12px',
                        padding: '26px 30px',
                        width: '90%',
                        maxWidth: '460px',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
                    }}>
                        <h3 style={{ margin: '0 0 6px 0', fontSize: '1.3rem', color: '#0f172a' }}>
                            Add New User
                        </h3>
                        <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '0.9rem' }}>
                            Create a new user account with customized roles directly in the admin panel.
                        </p>

                        <form onSubmit={handleCreateUser}>
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                                    Username
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter username"
                                    value={createUsername}
                                    onChange={(e) => setCreateUsername(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '0.95rem',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                                    Initial Password
                                </label>
                                <input
                                    type="password"
                                    placeholder="Min 4 characters"
                                    value={createPassword}
                                    onChange={(e) => setCreatePassword(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '0.95rem',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '22px' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
                                    Assign Roles
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {availableRoles.map(role => (
                                        <label
                                            key={role}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '8px 12px',
                                                borderRadius: '6px',
                                                border: '1px solid #e2e8f0',
                                                background: createRoles.includes(role) ? '#f0fdf4' : '#fff',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={createRoles.includes(role)}
                                                onChange={() => toggleCreateRole(role)}
                                                style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                                            />
                                            <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#0f172a' }}>{role}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateUserOpen(false)}
                                    style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreatingUser}
                                    style={{
                                        padding: '8px 18px',
                                        background: '#059669',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: isCreatingUser ? 'not-allowed' : 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    {isCreatingUser ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;