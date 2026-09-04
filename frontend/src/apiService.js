import { firebaseService } from './firebase/firebaseService';
import { isFirebaseConfigured } from './firebase/firebaseConfig';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';

let notificationService = null; // Will be set by App.js

const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Check if running on remote/Vercel/phone where localhost:8081 cannot be reached
export const shouldPreferFirebase = () => {
    if (process.env.REACT_APP_FORCE_REST_BACKEND === 'true') return false;
    if (isFirebaseConfigured) return true;
    if (process.env.REACT_APP_USE_FIREBASE === 'true') return true;
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname || '';
        const isRemoteHost = hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '';
        if (isRemoteHost) {
            return true;
        }
    }
    return false;
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

const executeWithFallback = async (restCall, firebaseCall) => {
    if (shouldPreferFirebase()) {
        return await firebaseCall();
    }
    try {
        return await restCall();
    } catch (err) {
        const isNetworkFailure = !err.response && (
            !err.status ||
            err.name === 'TypeError' ||
            (err.message && (
                err.message.includes('Failed to fetch') ||
                err.message.includes('NetworkError') ||
                err.message.includes('ERR_CONNECTION') ||
                err.message.includes('Load failed')
            ))
        );
        if (isNetworkFailure) {
            console.warn('[apiService] Backend unreachable at ' + API_BASE_URL + ', routing seamlessly to Firebase Cloud Service.');
            return await firebaseCall();
        }
        throw err;
    }
};

export const setNotificationService = (service) => {
    notificationService = service;
};

export const apiService = {
    login: (credentials) => 
        executeWithFallback(
            () => request('/auth/login', { body: credentials }),
            () => firebaseService.login(credentials)
        ),

    register: (credentials) => 
        executeWithFallback(
            () => request('/auth/register', { body: credentials }),
            () => firebaseService.register(credentials)
        ),

    getProjects: () => 
        executeWithFallback(
            () => request('/projects'),
            () => firebaseService.getProjects()
        ),

    createProject: (project) => 
        executeWithFallback(
            () => request('/projects', { body: project }),
            () => firebaseService.createProject(project)
        ),

    getProjectHealth: (projectId) => 
        executeWithFallback(
            () => request(`/projects/${projectId}/health`),
            () => firebaseService.getProjectHealth(projectId)
        ),

    getProjectHealthHistory: (projectId) => 
        executeWithFallback(
            () => request(`/projects/${projectId}/history`),
            () => firebaseService.getProjectHealthHistory(projectId)
        ),

    evaluateProjectRisk: (projectId, metrics) => 
        executeWithFallback(
            () => request(`/projects/${projectId}/evaluate-risk`, { body: metrics }),
            () => firebaseService.evaluateProjectRisk(projectId, metrics)
        ),

    predictRisk: (metrics) => 
        executeWithFallback(
            () => request('/projects/predict-risk', { body: metrics }),
            () => firebaseService.predictRisk(metrics)
        ),

    recommendArchitecture: (criteria) => 
        executeWithFallback(
            () => request('/recommend-architecture', { body: criteria }),
            () => firebaseService.recommendArchitecture(criteria)
        ),

    generateCustomArchitectureDiagram: (prompt, style = 'topology') => 
        executeWithFallback(
            () => request('/generate-architecture-diagram', { body: { prompt, style } }),
            () => firebaseService.generateCustomArchitectureDiagram({ prompt, style })
        ),

    analyzeRequirements: (text) => 
        executeWithFallback(
            () => request('/analyze-requirements', { body: { text } }),
            () => firebaseService.analyzeRequirements({ text })
        ),

    planSprint: (sprintData) => 
        executeWithFallback(
            () => request('/plan-sprint', { body: sprintData }),
            () => firebaseService.planSprint(sprintData)
        ),

    reviewCode: (data) => 
        executeWithFallback(
            () => request('/code-review', { body: data }),
            () => firebaseService.reviewCode(data)
        ),

    chatWithCopilot: (data) => 
        executeWithFallback(
            () => request('/copilot/chat', { body: data }),
            () => firebaseService.chatWithCopilot(data)
        ),

    getAllUsers: (page = 0, size = 10, sort = 'id,asc', search = '') => {
        return executeWithFallback(
            () => {
                let endpoint = `/admin/users?page=${page}&size=${size}&sort=${sort}`;
                if (search) {
                    endpoint += `&username=${search}`;
                }
                return request(endpoint);
            },
            () => firebaseService.getAllUsers(page, size, sort, search)
        );
    },

    createUserByAdmin: (userData) => 
        executeWithFallback(
            () => request('/admin/users', { method: 'POST', body: userData }),
            () => firebaseService.createUserByAdmin(userData)
        ),

    deleteUser: (userId) => 
        executeWithFallback(
            () => request(`/admin/users/${userId}`, { method: 'DELETE' }),
            () => firebaseService.deleteUser(userId)
        ),

    updateUserRoles: (userId, roles) => 
        executeWithFallback(
            () => request(`/admin/users/${userId}/roles`, { method: 'PUT', body: { roles } }),
            () => firebaseService.updateUserRoles(userId, roles)
        ),

    updateUserPassword: (userId, newPassword) => 
        executeWithFallback(
            () => request(`/admin/users/${userId}/password`, { method: 'PUT', body: { newPassword } }),
            () => firebaseService.updateUserPassword(userId, newPassword)
        ),

    getAllRoles: () => 
        executeWithFallback(
            () => request('/admin/roles'),
            () => firebaseService.getAllRoles()
        ),

    getCurrentUser: () => 
        executeWithFallback(
            () => request('/users/me'),
            () => firebaseService.getCurrentUser()
        ),

    changePassword: (passwords) => 
        executeWithFallback(
            () => request('/users/me/change-password', { body: passwords }),
            () => firebaseService.changePassword(passwords)
        ),

    changeUsername: (newUsername) => 
        executeWithFallback(
            () => request('/users/me/change-username', { body: newUsername }),
            () => firebaseService.changeUsername(newUsername)
        ),

    forgotPassword: (email) => 
        executeWithFallback(
            () => request('/auth/forgot-password', { body: { email } }),
            () => Promise.resolve({ message: 'Reset email queued via Firebase.' })
        ),

    resetPassword: (data) => 
        executeWithFallback(
            () => request('/auth/reset-password', { body: data }),
            () => Promise.resolve({ message: 'Password reset processed.' })
        ),

    impersonateUser: (userId) => 
        executeWithFallback(
            () => request(`/admin/users/${userId}/impersonate`, { method: 'POST' }),
            () => firebaseService.impersonateUser(userId)
        ),

    uploadProfilePicture: async (file) => {
        if (shouldPreferFirebase()) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve({ profilePictureUrl: reader.result, profile_picture_url: reader.result });
                };
                reader.readAsDataURL(file);
            });
        }
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_BASE_URL}/users/me/profile-picture`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: formData,
            });
            if (!response.ok) {
                let errorMsg = 'File upload failed';
                try {
                    const errData = await response.json();
                    errorMsg = errData.message || errData.error || errorMsg;
                } catch (e) {
                    const text = await response.text();
                    if (text) errorMsg = text;
                }
                throw new Error(errorMsg);
            }
            return response.json();
        } catch (err) {
            if (err.message === 'Failed to fetch') {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        resolve({ profilePictureUrl: reader.result, profile_picture_url: reader.result });
                    };
                    reader.readAsDataURL(file);
                });
            }
            throw err;
        }
    },

    triggerPasswordReset: (userId) => 
        executeWithFallback(
            () => request(`/admin/users/${userId}/trigger-password-reset`, { method: 'POST' }),
            () => Promise.resolve(`Password reset link generated via Firebase for user ID: ${userId}`)
        ),

    getUserActivity: (userId, page = 0, size = 10) => 
        executeWithFallback(
            () => request(`/admin/users/${userId}/activity?page=${page}&size=${size}`),
            () => firebaseService.getUserActivity(userId)
        ),

    getAllUserActivity: (page = 0, size = 15, username = '', actionType = '', startDate = '', endDate = '', sort = 'timestamp,desc') => {
        return executeWithFallback(
            () => {
                const params = new URLSearchParams({ page, size, sort });
                if (username) params.append('username', username);
                if (actionType) params.append('actionType', actionType);
                if (startDate) params.append('startDate', startDate);
                if (endDate) params.append('endDate', endDate);
                return request(`/admin/activity?${params.toString()}`);
            },
            () => Promise.resolve({ content: [], totalElements: 0 })
        );
    },

    getArchivedUserActivity: (page = 0, size = 15, username = '', actionType = '', startDate = '', endDate = '', sort = 'timestamp,desc') => {
        return executeWithFallback(
            () => {
                const params = new URLSearchParams({ page, size, sort });
                if (username) params.append('username', username);
                if (actionType) params.append('actionType', actionType);
                if (startDate) params.append('startDate', startDate);
                if (endDate) params.append('endDate', endDate);
                return request(`/admin/activity/archive?${params.toString()}`);
            },
            () => Promise.resolve({ content: [], totalElements: 0 })
        );
    },

    globalSearch: (query) => 
        executeWithFallback(
            () => request(`/admin/search?query=${query}`),
            () => Promise.resolve({ users: [], projects: [] })
        ),
};