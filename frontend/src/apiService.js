const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';

let notificationService = null; // Will be set by App.js

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const request = async (endpoint, options = {}) => {
    const { body, ...customConfig } = options;

    const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
    };

    const config = {
        method: body ? 'POST' : 'GET',
        ...customConfig,
        headers: {
            ...headers,
            ...customConfig.headers,
        },
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
        const message = await response.text();
        const error = new Error(message || 'Network response was not ok');
        if (notificationService) {
            notificationService.showError(error.message);
        }
        throw error;
    }

    // Handle responses with no content
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    } else {
        return response.text();
    }
};

export const setNotificationService = (service) => {
    notificationService = service;
};

export const apiService = {
    login: (credentials) => request('/auth/login', { body: credentials }),
    register: (credentials) => request('/auth/register', { body: credentials }),
    getProjects: () => request('/projects'),
    createProject: (project) => request('/projects', { body: project }),
    getProjectHealth: (projectId) => request(`/projects/${projectId}/health`),
    getProjectHealthHistory: (projectId) => request(`/projects/${projectId}/history`),
    evaluateProjectRisk: (projectId, metrics) => request(`/projects/${projectId}/evaluate-risk`, { body: metrics }),
    predictRisk: (metrics) => request('/projects/predict-risk', { body: metrics }),
    recommendArchitecture: (criteria) => request('/recommend-architecture', { body: criteria }),
    analyzeRequirements: (text) => request('/analyze-requirements', { body: { text } }),
    planSprint: (sprintData) => request('/plan-sprint', { body: sprintData }),
    getAllUsers: (page = 0, size = 10, sort = 'id,asc', search = '') => {
        let endpoint = `/admin/users?page=${page}&size=${size}&sort=${sort}`;
        if (search) {
            endpoint += `&username=${search}`;
        }
        return request(endpoint);
    },
    deleteUser: (userId) => request(`/admin/users/${userId}`, { method: 'DELETE' }),
    updateUserRoles: (userId, roles) => request(`/admin/users/${userId}/roles`, { method: 'PUT', body: { roles } }),
    getAllRoles: () => request('/admin/roles'),
    getCurrentUser: () => request('/users/me'),
    changePassword: (passwords) => request('/users/me/change-password', { body: passwords }),
    changeUsername: (newUsername) => request('/users/me/change-username', { body: { newUsername } }),
    forgotPassword: (email) => request('/auth/forgot-password', { body: { email } }),
    resetPassword: (data) => request('/auth/reset-password', { body: data }),
    impersonateUser: (userId) => request(`/admin/users/${userId}/impersonate`, { method: 'POST' }),
    uploadProfilePicture: async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/users/me/profile-picture`, {
            method: 'POST',
            headers: getAuthHeaders(), // No 'Content-Type', browser sets it for FormData
            body: formData,
        });
        if (!response.ok) throw new Error('File upload failed');
        return response.json();
    },
    triggerPasswordReset: (userId) => request(`/admin/users/${userId}/trigger-password-reset`, { method: 'POST' }),
    getUserActivity: (userId, page = 0, size = 10) => request(`/admin/users/${userId}/activity?page=${page}&size=${size}`),
    getAllUserActivity: (page = 0, size = 15, username = '', actionType = '', startDate = '', endDate = '', sort = 'timestamp,desc') => {
        const params = new URLSearchParams({ page, size, sort });
        if (username) params.append('username', username);
        if (actionType) params.append('actionType', actionType);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        return request(`/admin/activity?${params.toString()}`);
    },
    getArchivedUserActivity: (page = 0, size = 15, username = '', actionType = '', startDate = '', endDate = '', sort = 'timestamp,desc') => {
        const params = new URLSearchParams({ page, size, sort });
        if (username) params.append('username', username);
        if (actionType) params.append('actionType', actionType);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        return request(`/admin/activity/archive?${params.toString()}`);
    },
    globalSearch: (query) => request(`/admin/search?query=${query}`),
};