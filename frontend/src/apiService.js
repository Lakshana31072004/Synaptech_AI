/**
 * Synaptech AI - Unified Client Service
 * Configured for Serverless Cloud Architecture powered directly by Firebase (Cloud Firestore & Auth).
 * Eliminates requirements for external Spring Boot application servers or H2 database consoles.
 */

import { firebaseService } from './firebase/firebaseService';

// Firebase is preferred and active per user configuration
export const shouldPreferFirebase = () => true;

let notificationService = null;

export const setNotificationService = (service) => {
    notificationService = service;
};

export const apiService = {
    // --- Authentication & User Governance ---
    login: (credentials) => firebaseService.login(credentials),
    register: (credentials) => firebaseService.register(credentials),
    getCurrentUser: () => firebaseService.getCurrentUser(),
    changePassword: (passwords) => firebaseService.changePassword(passwords),
    changeUsername: (newUsername) => firebaseService.changeUsername(newUsername),
    forgotPassword: (email) => firebaseService.forgotPassword(email),
    resetPassword: (data) => firebaseService.resetPassword(data),
    uploadProfilePicture: (file) => firebaseService.uploadProfilePicture(file),

    // --- Projects & Health Telemetry ---
    getProjects: () => firebaseService.getProjects(),
    createProject: (project) => firebaseService.createProject(project),
    getProjectHealth: (projectId) => firebaseService.getProjectHealth(projectId),
    getProjectHealthHistory: (projectId) => firebaseService.getProjectHealthHistory(projectId),
    evaluateProjectRisk: (projectId, metrics) => firebaseService.evaluateProjectRisk(projectId, metrics),
    predictRisk: (metrics) => firebaseService.predictRisk(metrics),

    // --- Requirements Intelligence (USEIM RQ1) ---
    getProjectRequirements: (projectId) => firebaseService.getProjectRequirements(projectId),
    createProjectRequirement: (projectId, data) => firebaseService.createProjectRequirement(projectId, data),
    analyzeRequirements: (text) => firebaseService.analyzeRequirements(text),

    // --- Traceability & Blast Radius Analysis (USEIM RQ4) ---
    getTraceabilityGraph: (projectId) => firebaseService.getTraceabilityGraph(projectId),
    calculateTraceabilityImpact: (projectId, rootNodeId) => firebaseService.calculateTraceabilityImpact(projectId, rootNodeId),

    // --- What-If Counterfactual Simulations (USEIM RQ4) ---
    runWhatIfSimulation: (projectId, payload) => firebaseService.runWhatIfSimulation(projectId, payload),
    getProjectSimulations: (projectId) => firebaseService.getProjectSimulations(projectId),

    // --- Architecture Advisor & Mermaid Canvas ---
    recommendArchitecture: (criteria) => firebaseService.recommendArchitecture(criteria),
    generateCustomArchitectureDiagram: (prompt, style = 'topology') => 
        firebaseService.generateCustomArchitectureDiagram(prompt, style),

    // --- Agile Delivery & Code Quality ---
    planSprint: (sprintData) => firebaseService.planSprint(sprintData),
    reviewCode: (data) => firebaseService.reviewCode(data),
    chatWithCopilot: (data) => firebaseService.chatWithCopilot(data),

    // --- Administration, RBAC & Audit Trails ---
    getAllUsers: (page = 0, size = 10, sort = 'id,asc', search = '') => 
        firebaseService.getAllUsers(page, size, sort, search),
    createUserByAdmin: (userData) => firebaseService.createUserByAdmin(userData),
    deleteUser: (userId) => firebaseService.deleteUser(userId),
    updateUserRoles: (userId, roles) => firebaseService.updateUserRoles(userId, roles),
    updateUserPassword: (userId, newPassword) => firebaseService.updateUserPassword(userId, newPassword),
    getAllRoles: () => firebaseService.getAllRoles(),
    impersonateUser: (userId) => firebaseService.impersonateUser(userId),
    triggerPasswordReset: (userId) => firebaseService.triggerPasswordReset(userId),
    getUserActivity: (userId, page = 0, size = 200) => firebaseService.getUserActivity(userId, page, size),
    getAllUserActivity: (page = 0, size = 15, username = '', actionType = '', startDate = '', endDate = '', sort = 'timestamp,desc') =>
        firebaseService.getAllUserActivity(page, size, username, actionType, startDate, endDate, sort),
    getArchivedUserActivity: (page = 0, size = 15, username = '', actionType = '', startDate = '', endDate = '', sort = 'timestamp,desc') =>
        firebaseService.getArchivedUserActivity(page, size, username, actionType, startDate, endDate, sort),
    globalSearch: (query) => firebaseService.globalSearch(query),
    logActivity: (action, details) => firebaseService.logActivity(action, details)
};