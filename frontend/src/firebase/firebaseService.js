import { isFirebaseConfigured, auth, db } from './firebaseConfig';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updatePassword 
} from 'firebase/auth';

// Helper to create a compliant JWT-like token for AuthContext and jwtDecode
const createClientJwt = (user) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    id: user.id,
    sub: user.username,
    username: user.username,
    roles: user.roles || ['ROLE_USER'],
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  }));
  const signature = btoa('synaptech-cloud-signature');
  return `${header}.${payload}.${signature}`;
};

// Default seed data for immediate mobile / offline preview
const DEFAULT_USERS = [
  { 
    id: 1, 
    username: 'admin', 
    password: 'admin123', 
    email: 'admin@synaptech.ai', 
    roles: ['ROLE_USER', 'ROLE_ADMIN'], 
    profilePictureUrl: '/uploads/953c7178-aa6b-4503-87c7-2b7af5dcff65_WhatsApp Image 2026-08-04 at 10.03.52 AM.jpeg' 
  },
  { 
    id: 2, 
    username: 'developer', 
    password: 'developer123', 
    email: 'dev@synaptech.ai', 
    roles: ['ROLE_USER'], 
    profilePictureUrl: '/uploads/879752d8-c6cb-4cf8-a971-36d2fe0c6515_download.jpg' 
  },
  { 
    id: 33, 
    username: 'sahana', 
    password: 'sahana123', 
    email: 'sahana@synaptech.ai', 
    roles: ['ROLE_USER'], 
    profilePictureUrl: '/uploads/6dda8cea-c36c-4691-9abd-0af0f74b4f67_WhatsApp Image 2026-09-03 at 2.04.10 PM.jpeg' 
  },
  { 
    id: 66, 
    username: 'subbu', 
    password: 'subbu123', 
    email: 'subbu@synaptech.ai', 
    roles: ['ROLE_USER'], 
    profilePictureUrl: '/uploads/a581ca53-b55c-41eb-9a24-2b92e9c2a68d_1784035870485.png' 
  },
  { 
    id: 3, 
    username: 'lucky', 
    password: 'lucky123', 
    email: 'lucky@synaptech.ai', 
    roles: ['ROLE_USER'], 
    profilePictureUrl: null 
  }
];

const DEFAULT_PROJECTS = [
  { id: 1, name: 'Project Alpha' },
  { id: 2, name: 'Project Beta' }
];

const DEFAULT_HEALTH = {
  1: {
    id: 1,
    project: { id: 1, name: 'Project Alpha' },
    riskScore: 35,
    bugTrend: 'decreasing',
    sprintVelocity: 42,
    technicalDebt: 'low',
    codeQualityIndex: 88,
    teamProductivity: 'high',
    projectProgress: 75,
    timestamp: new Date().toISOString()
  },
  2: {
    id: 2,
    project: { id: 2, name: 'Project Beta' },
    riskScore: 60,
    bugTrend: 'stable',
    sprintVelocity: 30,
    technicalDebt: 'medium',
    codeQualityIndex: 72,
    teamProductivity: 'medium',
    projectProgress: 40,
    timestamp: new Date().toISOString()
  }
};

class ClientStore {
  constructor() {
    this.initStore();
  }

  initStore() {
    try {
      const existingUsersRaw = localStorage.getItem('synaptech_users');
      if (!existingUsersRaw) {
        localStorage.setItem('synaptech_users', JSON.stringify(DEFAULT_USERS));
      } else {
        const existingUsers = JSON.parse(existingUsersRaw);
        let modified = false;
        DEFAULT_USERS.forEach(defUser => {
          const match = existingUsers.find(u => u.username.toLowerCase() === defUser.username.toLowerCase());
          if (!match) {
            existingUsers.push(defUser);
            modified = true;
          } else if (match.profilePictureUrl !== defUser.profilePictureUrl && defUser.profilePictureUrl) {
            match.profilePictureUrl = defUser.profilePictureUrl;
            modified = true;
          }
        });
        if (modified) {
          localStorage.setItem('synaptech_users', JSON.stringify(existingUsers));
        }
      }
    } catch {
      localStorage.setItem('synaptech_users', JSON.stringify(DEFAULT_USERS));
    }

    if (!localStorage.getItem('synaptech_projects')) {
      localStorage.setItem('synaptech_projects', JSON.stringify(DEFAULT_PROJECTS));
    }
    if (!localStorage.getItem('synaptech_health')) {
      localStorage.setItem('synaptech_health', JSON.stringify(DEFAULT_HEALTH));
    }
    if (!localStorage.getItem('synaptech_activities')) {
      localStorage.setItem('synaptech_activities', JSON.stringify([
        { id: 1, userId: 1, username: 'admin', action: 'SYSTEM_INITIALIZED', timestamp: new Date().toISOString(), details: 'Synaptech platform initialized.' }
      ]));
    }
  }

  getUsers() {
    try {
      return JSON.parse(localStorage.getItem('synaptech_users') || '[]');
    } catch {
      return DEFAULT_USERS;
    }
  }

  setUsers(users) {
    localStorage.setItem('synaptech_users', JSON.stringify(users));
  }

  getProjects() {
    try {
      return JSON.parse(localStorage.getItem('synaptech_projects') || '[]');
    } catch {
      return DEFAULT_PROJECTS;
    }
  }

  setProjects(projects) {
    localStorage.setItem('synaptech_projects', JSON.stringify(projects));
  }

  getHealth() {
    try {
      return JSON.parse(localStorage.getItem('synaptech_health') || '{}');
    } catch {
      return DEFAULT_HEALTH;
    }
  }

  setHealth(health) {
    localStorage.setItem('synaptech_health', JSON.stringify(health));
  }

  getActivities() {
    try {
      return JSON.parse(localStorage.getItem('synaptech_activities') || '[]');
    } catch {
      return [];
    }
  }

  logActivity(userId, username, action, details) {
    const activities = this.getActivities();
    const newLog = {
      id: Date.now(),
      userId,
      username,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    activities.unshift(newLog);
    localStorage.setItem('synaptech_activities', JSON.stringify(activities.slice(0, 100)));
  }
}

const clientStore = new ClientStore();

export const firebaseService = {
  // --- AUTHENTICATION ---
  login: async ({ username, password }) => {
    if (isFirebaseConfigured && auth && db) {
      try {
        // Try Firebase Auth if email provided or match user in Firestore
        const userQuery = query(collection(db, 'users'), where('username', '==', username));
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data();
          if (userData.email) {
            try {
              await signInWithEmailAndPassword(auth, userData.email, password);
            } catch (authErr) {
              console.warn('[Firebase] Auth verify failed, checking fallback:', authErr);
            }
          }
          if (userData.password === password || !userData.password) {
            const token = createClientJwt(userData);
            return { token, accessToken: token, user: userData };
          }
        }
      } catch (err) {
        console.warn('[Firebase] Remote query failed, falling back to local store:', err);
      }
    }

    // Client/Offline fallback
    const users = clientStore.getUsers();
    const cleanUsername = (username || '').trim().toLowerCase();
    const foundUser = users.find(u => u.username.toLowerCase() === cleanUsername);

    if (!foundUser || foundUser.password !== password) {
      throw new Error('Invalid username or password.');
    }

    clientStore.logActivity(foundUser.id, foundUser.username, 'USER_LOGIN', 'User logged in successfully.');
    const token = createClientJwt(foundUser);
    return { token, accessToken: token, user: foundUser };
  },

  register: async ({ username, password, email }) => {
    const cleanUsername = (username || '').trim();
    if (!cleanUsername || !password) {
      throw new Error('Username and password are required.');
    }

    const users = clientStore.getUsers();
    if (users.some(u => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
      throw new Error(`Username "${cleanUsername}" is already taken.`);
    }

    const newUser = {
      id: Date.now(),
      username: cleanUsername,
      password: password,
      email: email || `${cleanUsername}@synaptech.ai`,
      roles: ['ROLE_USER'],
      profilePictureUrl: null,
      createdAt: new Date().toISOString()
    };

    if (isFirebaseConfigured && db) {
      try {
        await addDoc(collection(db, 'users'), newUser);
        if (auth && email) {
          await createUserWithEmailAndPassword(auth, email, password);
        }
      } catch (err) {
        console.warn('[Firebase] Registration remote save failed:', err);
      }
    }

    users.push(newUser);
    clientStore.setUsers(users);
    clientStore.logActivity(newUser.id, newUser.username, 'USER_REGISTERED', 'New user registered.');
    return { message: 'User registered successfully.', user: newUser };
  },

  getCurrentUser: async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const payload = JSON.parse(atob(parts[1]));
      const users = clientStore.getUsers();
      const current = users.find(u => u.username === payload.username || u.id === payload.id);
      return current || payload;
    } catch {
      return null;
    }
  },

  changePassword: async ({ oldPassword, newPassword }) => {
    const current = await firebaseService.getCurrentUser();
    if (!current) throw new Error('Not authenticated.');

    const users = clientStore.getUsers();
    const userIndex = users.findIndex(u => u.id === current.id);
    if (userIndex === -1 || users[userIndex].password !== oldPassword) {
      throw new Error('Current password does not match.');
    }

    users[userIndex].password = newPassword;
    clientStore.setUsers(users);
    clientStore.logActivity(current.id, current.username, 'PASSWORD_CHANGE', 'Password changed.');
    return { message: 'Password updated successfully.' };
  },

  changeUsername: async ({ newUsername }) => {
    const current = await firebaseService.getCurrentUser();
    if (!current) throw new Error('Not authenticated.');

    const clean = newUsername.trim();
    const users = clientStore.getUsers();
    if (users.some(u => u.id !== current.id && u.username.toLowerCase() === clean.toLowerCase())) {
      throw new Error('Username is already taken.');
    }

    const userIndex = users.findIndex(u => u.id === current.id);
    if (userIndex !== -1) {
      users[userIndex].username = clean;
      clientStore.setUsers(users);
      clientStore.logActivity(current.id, clean, 'USERNAME_UPDATE', `Username updated to ${clean}`);
    }
    return { message: 'Username updated successfully.', username: clean };
  },

  // --- PROJECTS & HEALTH ---
  getProjects: async () => {
    return clientStore.getProjects();
  },

  createProject: async (projectData) => {
    const projects = clientStore.getProjects();
    const newProject = {
      id: Date.now(),
      name: projectData.name || 'New AI Project',
      createdAt: new Date().toISOString()
    };
    projects.push(newProject);
    clientStore.setProjects(projects);

    // Seed default initial health metrics
    const healthStore = clientStore.getHealth();
    healthStore[newProject.id] = {
      id: newProject.id,
      project: newProject,
      riskScore: 25,
      bugTrend: 'decreasing',
      sprintVelocity: 35,
      technicalDebt: 'low',
      codeQualityIndex: 90,
      teamProductivity: 'high',
      projectProgress: 10,
      timestamp: new Date().toISOString()
    };
    clientStore.setHealth(healthStore);
    return newProject;
  },

  getProjectHealth: async (projectId) => {
    const healthStore = clientStore.getHealth();
    return healthStore[projectId] || {
      id: projectId,
      riskScore: 30,
      bugTrend: 'stable',
      sprintVelocity: 38,
      technicalDebt: 'low',
      codeQualityIndex: 85,
      teamProductivity: 'high',
      projectProgress: 50,
      timestamp: new Date().toISOString()
    };
  },

  getProjectHealthHistory: async (projectId) => {
    const current = await firebaseService.getProjectHealth(projectId);
    return [
      { ...current, timestamp: new Date(Date.now() - 86400000 * 14).toISOString(), riskScore: current.riskScore + 10 },
      { ...current, timestamp: new Date(Date.now() - 86400000 * 7).toISOString(), riskScore: current.riskScore + 5 },
      current
    ];
  },

  predictRisk: async (metrics) => {
    let score = 30;
    if (metrics.bugTrend === 'increasing') score += 25;
    if (metrics.bugTrend === 'stable') score += 10;
    if (metrics.technicalDebt === 'high') score += 30;
    if (metrics.technicalDebt === 'medium') score += 15;
    if (metrics.codeQualityIndex < 70) score += 20;
    if (metrics.sprintVelocity < 25) score += 15;

    score = Math.max(5, Math.min(95, score));
    const riskLevel = score >= 70 ? 'High' : score >= 45 ? 'Medium' : 'Low';

    return {
      riskScore: score,
      riskLevel,
      recommendations: [
        score > 50 ? 'Increase unit test coverage to contain defect propagation.' : 'Codebase quality is healthy.',
        'Prioritize technical debt reduction during sprint retrospectives.',
        'Review sprint backlog sizing to normalize team velocity.'
      ],
      factorAnalysis: [
        { factor: 'Bug Trend', impact: metrics.bugTrend === 'increasing' ? 'Negative' : 'Positive', score: metrics.bugTrend === 'increasing' ? 80 : 30 },
        { factor: 'Code Quality', impact: metrics.codeQualityIndex < 75 ? 'Negative' : 'Positive', score: 100 - metrics.codeQualityIndex },
        { factor: 'Technical Debt', impact: metrics.technicalDebt === 'high' ? 'High Concern' : 'Normal', score: metrics.technicalDebt === 'high' ? 85 : 40 }
      ]
    };
  },

  evaluateProjectRisk: async (projectId, metrics) => {
    const result = await firebaseService.predictRisk(metrics);
    const healthStore = clientStore.getHealth();
    healthStore[projectId] = {
      ...healthStore[projectId],
      ...metrics,
      riskScore: result.riskScore,
      timestamp: new Date().toISOString()
    };
    clientStore.setHealth(healthStore);
    return result;
  },

  // --- AI MODULE ENGINES (100% Client/Mobile Compatible) ---
  analyzeRequirements: async ({ text }) => {
    const content = text || '';
    const sentences = content.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
    const words = content.split(/\s+/).filter(Boolean);

    const functionalKeywords = ['shall', 'must', 'can', 'allow', 'enable', 'provide', 'display', 'create', 'update', 'delete', 'export', 'generate'];
    const nonFunctionalKeywords = ['security', 'encrypt', 'auth', 'performance', 'latency', 'scale', 'reliable', 'speed', 'compliance', 'privacy', 'aes', 'jwt', 'bcrypt'];
    const ambiguousKeywords = ['fast', 'user-friendly', 'easy', 'robust', 'seamless', 'efficient', 'real-time', 'modern', 'scalable'];

    const functionalRequirements = [];
    const nonFunctionalRequirements = [];
    const ambiguousTermsFound = [];

    sentences.forEach((sentence, idx) => {
      const lower = sentence.toLowerCase();
      const isNfr = nonFunctionalKeywords.some(kw => lower.includes(kw));
      const isFr = functionalKeywords.some(kw => lower.includes(kw));

      if (isNfr) {
        nonFunctionalRequirements.push({
          id: `NFR-${nonFunctionalRequirements.length + 1}`,
          text: sentence,
          category: lower.includes('security') || lower.includes('encrypt') || lower.includes('jwt') ? 'Security' : 'Performance',
          priority: 'High'
        });
      } else if (isFr || sentence.length > 15) {
        functionalRequirements.push({
          id: `FR-${functionalRequirements.length + 1}`,
          text: sentence,
          priority: 'Medium'
        });
      }

      ambiguousKeywords.forEach(term => {
        if (lower.includes(term)) {
          ambiguousTermsFound.push({
            term,
            sentence,
            recommendation: `Define measurable acceptance criteria for "${term}".`
          });
        }
      });
    });

    const qualityScore = Math.max(40, Math.min(100, Math.round(100 - (ambiguousTermsFound.length * 8) + (sentences.length * 4))));

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      qualityScore,
      qualityRating: qualityScore >= 80 ? 'High' : qualityScore >= 60 ? 'Good' : 'Needs Clarification',
      analysisSummary: `Parsed ${sentences.length} requirements. Identified ${functionalRequirements.length} functional, ${nonFunctionalRequirements.length} non-functional, and ${ambiguousTermsFound.length} ambiguous items.`,
      functionalRequirements,
      nonFunctionalRequirements,
      ambiguousTermsFound,
      extractedUserStories: functionalRequirements.map((fr, idx) => ({
        id: `US-${idx + 1}`,
        title: `Story for: ${fr.text.slice(0, 45)}...`,
        storyPoints: 3 + (idx % 5) * 2,
        acceptanceCriteria: [`Verify ${fr.text.slice(0, 30)} works as expected.`]
      }))
    };
  },

  planSprint: async ({ backlogText, teamCapacity = 40, sprintLengthWeeks = 2 }) => {
    const rawItems = (backlogText || '').split('\n').map(i => i.trim()).filter(Boolean);
    const items = rawItems.length > 0 ? rawItems : ['User Authentication', 'Project Health KPIs', 'AI Requirement Engine'];

    const sprintBacklog = items.map((item, index) => ({
      id: `TASK-${100 + index}`,
      title: item,
      storyPoints: [2, 3, 5, 8, 5][index % 5],
      priority: index === 0 ? 'Highest' : index === 1 ? 'High' : 'Medium',
      assignedRole: index % 2 === 0 ? 'Frontend Engineer' : 'Backend Engineer'
    }));

    const totalEstimatedStoryPoints = sprintBacklog.reduce((acc, curr) => acc + curr.storyPoints, 0);
    const recommendedSprintCount = Math.max(1, Math.ceil(totalEstimatedStoryPoints / (teamCapacity || 30)));

    return {
      totalEstimatedStoryPoints,
      teamCapacity,
      recommendedSprintCount,
      estimatedWeeks: recommendedSprintCount * sprintLengthWeeks,
      sprintBacklog,
      velocityTrend: 'Stable (+5% projected delivery accuracy)'
    };
  },

  recommendArchitecture: async (criteria = {}) => {
    const scale = criteria.expectedScale || 'Medium';
    const latency = criteria.latencyRequirement || 'Standard (<500ms)';
    const teamSize = criteria.teamSize || 4;

    let arch = 'Modular Monolith';
    if (scale === 'High' || teamSize > 8) arch = 'Microservices Architecture';
    else if (latency.includes('Ultra')) arch = 'Event-Driven / Reactive Architecture';
    else if (criteria.cloudPreference?.includes('Serverless')) arch = 'Serverless Architecture';

    return {
      recommendedArchitecture: arch,
      confidenceScore: 88,
      suitabilityReason: `Selected ${arch} based on team size (${teamSize}), target scale (${scale}), and latency expectations.`,
      pros: [
        'High maintainability with clear domain boundaries',
        'Streamlined CI/CD pipeline deployment',
        'Optimal resource cost and operational overhead'
      ],
      cons: [
        'Requires rigorous discipline to avoid architectural erosion',
        'Cross-boundary integration testing required'
      ],
      topologyDiagram: `graph TD\n  Client[React Mobile/Web UI] --> API[API Gateway / Auth Layer]\n  API --> Service[Core Intelligence Engine]\n  Service --> DB[(Cloud Database / Firestore)]`,
      technologyStack: {
        'Frontend': 'React.js (SPA on Vercel)',
        'Database': 'Cloud Firestore / H2 Embedded',
        'Authentication': 'Firebase Auth / JWT Bearer',
        'AI/ML': 'Python scikit-learn & Client NLP Engines'
      }
    };
  },

  generateCustomArchitectureDiagram: async ({ prompt, style }) => {
    return {
      diagramSyntax: `graph TD\n  User[User Client] --> Gateway[API Gateway]\n  Gateway --> Auth[Auth Service]\n  Gateway --> Engine[Synaptech Intelligence Engine]\n  Engine --> Store[(Persistent Cloud Store)]`,
      style: style || 'topology'
    };
  },

  reviewCode: async ({ code, language }) => {
    const lines = (code || '').split('\n');
    const length = lines.length;
    const cyclomaticComplexity = Math.max(1, Math.min(25, Math.floor(length / 8) + (code.match(/if|for|while|switch|catch/g) || []).length));
    
    return {
      codeQualityScore: Math.max(50, Math.min(96, 100 - cyclomaticComplexity * 2)),
      cyclomaticComplexity,
      maintainabilityIndex: cyclomaticComplexity > 12 ? 'Moderate' : 'High',
      securitySmellsDetected: (code.match(/password|secret|eval|exec/gi) || []).length,
      recommendations: [
        'Break down high cyclomatic complexity methods into single-responsibility helpers.',
        'Ensure input sanitization and strict parameter typing are enforced.',
        'Add comprehensive unit test coverage for edge boundary cases.'
      ]
    };
  },

  chatWithCopilot: async ({ message, history }) => {
    const lower = (message || '').toLowerCase();
    let reply = `I'm Synaptech Copilot. I'm analyzing your architecture and engineering metrics. `;
    if (lower.includes('risk')) {
      reply += `Project Alpha is currently showing a stable risk score of 35/100, while Project Beta needs attention due to medium technical debt.`;
    } else if (lower.includes('architecture')) {
      reply += `For low-latency applications with small to mid-sized teams, a Modular Monolith or Clean Architecture delivers the fastest time to market with minimal DevOps overhead.`;
    } else if (lower.includes('sprint') || lower.includes('velocity')) {
      reply += `Current sprint velocity is tracking at ~42 story points. Recommend maintaining this cadence to avoid team fatigue.`;
    } else {
      reply += `You can ask me to evaluate project risks, recommend architectures, plan sprints, or review code snippets.`;
    }
    return { reply };
  },

  // --- ADMIN CONSOLE OPERATIONS ---
  getAllUsers: async (page = 0, size = 10, sort = 'id,asc', search = '') => {
    let users = clientStore.getUsers();
    if (search) {
      users = users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()));
    }
    return {
      content: users,
      totalElements: users.length,
      totalPages: Math.ceil(users.length / size) || 1,
      size,
      number: page
    };
  },

  createUserByAdmin: async (userData) => {
    return firebaseService.register(userData);
  },

  deleteUser: async (userId) => {
    const current = await firebaseService.getCurrentUser();
    if (current && (current.id === userId || current.username === 'admin' && userId === 1)) {
      throw new Error('Admin cannot delete their own account.');
    }

    const users = clientStore.getUsers();
    const filtered = users.filter(u => u.id !== userId && u.id !== Number(userId));
    if (filtered.length === users.length) {
      throw new Error('User not found.');
    }

    clientStore.setUsers(filtered);
    return { message: 'User deleted successfully.' };
  },

  updateUserRoles: async (userId, roles) => {
    const users = clientStore.getUsers();
    const userIndex = users.findIndex(u => u.id === userId || u.id === Number(userId));
    if (userIndex === -1) throw new Error('User not found.');

    users[userIndex].roles = roles;
    clientStore.setUsers(users);
    return users[userIndex];
  },

  updateUserPassword: async (userId, newPassword) => {
    const users = clientStore.getUsers();
    const userIndex = users.findIndex(u => u.id === userId || u.id === Number(userId));
    if (userIndex === -1) throw new Error('User not found.');

    users[userIndex].password = newPassword;
    clientStore.setUsers(users);
    return { message: 'Password updated successfully.' };
  },

  getAllRoles: async () => {
    return ['ROLE_USER', 'ROLE_ADMIN', 'ROLE_DEVELOPER', 'ROLE_ARCHITECT'];
  },

  impersonateUser: async (userId) => {
    const users = clientStore.getUsers();
    const target = users.find(u => u.id === userId || u.id === Number(userId));
    if (!target) throw new Error('Target user not found.');

    const token = createClientJwt(target);
    return { accessToken: token, token };
  },

  getUserActivity: async (userId) => {
    const activities = clientStore.getActivities().filter(a => a.userId === userId || a.userId === Number(userId));
    return { content: activities, totalElements: activities.length };
  }
};
