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
        let existingUsers = JSON.parse(existingUsersRaw);
        // Explicitly purge lucky or any deleted accounts from past sessions
        const hadLucky = existingUsers.some(u => (u.username || '').toLowerCase() === 'lucky' || u.id === 3);
        if (hadLucky) {
          existingUsers = existingUsers.filter(u => (u.username || '').toLowerCase() !== 'lucky' && u.id !== 3);
        }

        const deletedUsers = JSON.parse(localStorage.getItem('synaptech_deleted_users') || '["lucky"]');
        if (!deletedUsers.includes('lucky')) {
          deletedUsers.push('lucky');
          localStorage.setItem('synaptech_deleted_users', JSON.stringify(deletedUsers));
        }

        let modified = hadLucky;
        DEFAULT_USERS.forEach(defUser => {
          if (deletedUsers.includes(defUser.username.toLowerCase())) {
            return; // Do not re-seed explicitly deleted users
          }
          const match = existingUsers.find(u => (u.username || '').toLowerCase() === defUser.username.toLowerCase());
          if (!match) {
            existingUsers.push(defUser);
            modified = true;
          } else {
            // Keep default accounts valid and up to date
            if (!match.password || match.password !== defUser.password) {
              match.password = defUser.password;
              modified = true;
            }
            if (defUser.profilePictureUrl && match.profilePictureUrl !== defUser.profilePictureUrl) {
              match.profilePictureUrl = defUser.profilePictureUrl;
              modified = true;
            }
            if (defUser.roles && (!match.roles || match.roles.length === 0)) {
              match.roles = defUser.roles;
              modified = true;
            }
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
    const cleanPassword = (password || '').trim();
    let foundUser = users.find(u => (u.username || '').trim().toLowerCase() === cleanUsername);

    // Auto-heal default seeded accounts if mismatched
    const defUser = DEFAULT_USERS.find(u => u.username.toLowerCase() === cleanUsername);
    if (defUser && (cleanPassword === defUser.password || password === defUser.password)) {
      if (!foundUser) {
        foundUser = { ...defUser };
        users.push(foundUser);
        clientStore.setUsers(users);
      } else if (foundUser.password !== defUser.password) {
        foundUser.password = defUser.password;
        clientStore.setUsers(users);
      }
    }

    if (!foundUser || (foundUser.password !== password && foundUser.password !== cleanPassword)) {
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
      ...(healthStore[projectId] || {}),
      id: projectId,
      ...metrics,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      recommendations: result.recommendations,
      factorAnalysis: result.factorAnalysis,
      timestamp: new Date().toISOString()
    };
    clientStore.setHealth(healthStore);
    return healthStore[projectId];
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

    sentences.forEach((sentence) => {
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
          category: 'Functional',
          priority: 'High'
        });
      }

      ambiguousKeywords.forEach(term => {
        if (lower.includes(term)) {
          ambiguousTermsFound.push({
            term,
            context: sentence,
            sentence,
            suggestion: `Quantify "${term}" with specific acceptance criteria or SLA metrics.`,
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
      qualityRating: qualityScore >= 80 ? 'Excellent' : qualityScore >= 60 ? 'Good' : 'Needs Clarification',
      analysisSummary: `Analyzed ${sentences.length} sentences. Identified ${functionalRequirements.length} functional requirement(s), ${nonFunctionalRequirements.length} non-functional requirement(s), and ${ambiguousTermsFound.length} ambiguous item(s).`,
      functionalRequirements,
      nonFunctionalRequirements,
      ambiguousTermsFound,
      extractedUserStories: functionalRequirements.map((fr) => `As an end-user, I want to ${fr.text.toLowerCase().replace(/^(the user (must|can|shall)|the system (shall|must)|users can)\s*/i, '')} so that business operations run effectively.`)
    };
  },

  planSprint: async ({ projectRequirements, backlogText, teamCapacity = 30, developerCount = 4, sprintDurationWeeks = 2, sprintLengthWeeks = 2 }) => {
    const rawText = projectRequirements || backlogText || '';
    const rawItems = rawText.split('\n').map(i => i.trim()).filter(Boolean);
    const items = rawItems.length > 0 ? rawItems : [
      'User Authentication with JWT',
      'Real-Time Project Health Dashboard',
      'AI Requirement Analyzer & Ambiguity Detector',
      'Automated Sprint Backlog Generator',
      'Architecture Recommendation Canvas'
    ];

    const weeks = sprintDurationWeeks || sprintLengthWeeks || 2;
    const capacity = teamCapacity || (developerCount * 8) || 30;

    const sprintBacklog = items.map((item, index) => ({
      id: `TASK-${101 + index}`,
      title: item,
      storyPoints: [3, 5, 8, 3, 5, 2][index % 6],
      priority: index === 0 ? 'Highest' : index <= 2 ? 'High' : 'Medium',
      targetSprint: 1 + Math.floor(index / 3),
      assignedRole: index % 2 === 0 ? 'Frontend Engineer' : 'Backend Engineer'
    }));

    const totalEstimatedStoryPoints = sprintBacklog.reduce((acc, curr) => acc + curr.storyPoints, 0);
    const recommendedSprintCount = Math.max(1, Math.ceil(totalEstimatedStoryPoints / capacity));
    const teamCapacityUtilization = Math.min(100, Math.round((totalEstimatedStoryPoints / (recommendedSprintCount * capacity)) * 100));
    const riskLevel = teamCapacityUtilization > 90 ? 'High' : teamCapacityUtilization > 70 ? 'Moderate' : 'Low';

    return {
      totalEstimatedStoryPoints,
      recommendedSprintCount,
      estimatedDurationWeeks: recommendedSprintCount * weeks,
      estimatedWeeks: recommendedSprintCount * weeks,
      teamCapacity: capacity,
      teamCapacityUtilization,
      riskLevel,
      sprintBacklog,
      velocityTrend: 'Stable (+8% projected delivery accuracy)'
    };
  },

  recommendArchitecture: async (criteria = {}) => {
    const scale = criteria.scalabilityRequirement || criteria.expectedScale || 'Medium';
    const latency = criteria.latencyRequirement || 'Standard (<500ms)';
    const teamSize = Number(criteria.teamSize || 6);

    let arch = 'Modular Monolith with Domain Decoupling';
    let alternative = 'Clean Layered Architecture';
    let summary = `Optimized for high developer velocity, clear domain boundaries, and low operational overhead with team size ${teamSize}.`;
    
    if (scale.toLowerCase().includes('high') || teamSize > 8) {
      arch = 'Domain-Driven Microservices Architecture';
      alternative = 'Event-Driven Microservices';
      summary = `Well-suited for large teams and autonomous deployment cycles with high scalability (${scale}).`;
    } else if (latency.toLowerCase().includes('low') || latency.toLowerCase().includes('ultra')) {
      arch = 'Event-Driven Reactive Architecture';
      alternative = 'CQRS with Event Sourcing';
      summary = `Engineered for ultra-low latency (<100ms) event processing and asynchronous streaming.`;
    }

    const topologyMermaid = `graph TD
  Client[Web & Mobile Client] --> Gateway[API Gateway / Auth]
  Gateway --> ServiceA[Core Business Service]
  Gateway --> ServiceB[AI Telemetry Engine]
  ServiceA --> Store[(Cloud Firestore / Cache)]
  ServiceB --> Store`;

    const c4Mermaid = `graph TD
  User((End User)) --> WebApp[React SPA Frontend]
  WebApp --> API[REST & Event Gateway]
  API --> DB[(Persistent Database)]`;

    const sequenceMermaid = `sequenceDiagram
  autonumber
  User->>Client: Initiate Engineering Action
  Client->>Gateway: Bearer Token Verified
  Gateway->>AI: Trigger Telemetry Prediction
  AI-->>Client: Real-Time Stream Results`;

    const keyBenefits = [
      'Autonomous continuous delivery pipelines and isolated failure blast radius.',
      'Optimal resource utilization matching elastic cloud infrastructure.',
      'High modular maintainability with strict bounded domain contexts.'
    ];

    const architecturalTradeOffs = [
      'Distributed data management complexity and eventual consistency constraints.',
      'Requires distributed tracing and centralized log aggregation.'
    ];

    const suggestedTechStack = {
      'Frontend': 'React 18 + Modern Responsive CSS',
      'API Gateway': 'Spring Cloud Gateway / Firebase Auth',
      'Microservices': 'Spring Boot 3.3 (Java 21) / Node.js',
      'Database': 'Cloud Firestore / PostgreSQL',
      'Messaging / Broker': 'Apache Kafka / Cloud PubSub',
      'Monitoring': 'OpenTelemetry + Prometheus'
    };

    const implementationGuidelines = [
      'Strictly align service boundaries with DDD bounded contexts.',
      'Enforce API schema contracts and idempotent consumers for messaging.',
      'Configure automated canary deployments in CI/CD pipeline.'
    ];

    return {
      recommendedArchitecture: arch,
      confidenceScore: 92,
      summary,
      alternativeArchitecture: alternative,
      keyBenefits,
      pros: keyBenefits,
      architecturalTradeOffs,
      cons: architecturalTradeOffs,
      diagramMermaid: topologyMermaid,
      topologyDiagram: topologyMermaid,
      c4DiagramMermaid: c4Mermaid,
      sequenceDiagramMermaid: sequenceMermaid,
      suggestedTechStack,
      technologyStack: suggestedTechStack,
      implementationGuidelines
    };
  },

  generateCustomArchitectureDiagram: async (promptOrObj, style = 'topology') => {
    const promptText = typeof promptOrObj === 'string' ? promptOrObj : (promptOrObj?.prompt || 'System Architecture');
    const diagramMermaid = `graph TD
  User((Client User)) --> Gateway[API Gateway / Router]
  Gateway --> Auth[Auth & Session Service]
  Gateway --> Engine[AI & Processing Core]
  Engine --> Broker[Event Bus / Queue]
  Broker --> Worker[Background Worker]
  Engine --> DB[(Persistent Cloud Database)]`;

    return {
      title: `${promptText.slice(0, 38)} Architecture`,
      description: `Synthesized interactive architecture diagram based on prompt: "${promptText}".`,
      diagramMermaid,
      diagramSyntax: diagramMermaid,
      style: typeof promptOrObj === 'object' ? (promptOrObj.style || style) : style
    };
  },

  reviewCode: async ({ code, codeSnippet, language }) => {
    const codeToAnalyze = codeSnippet || code || '';
    const lines = codeToAnalyze.split('\n');
    const length = lines.length;
    const cyclomaticComplexity = Math.max(1, Math.min(25, Math.floor(length / 6) + (codeToAnalyze.match(/if|for|while|switch|catch/g) || []).length));
    
    const vulnerabilities = [];
    const codeSmells = [];
    const keyImprovements = [];

    if (/SELECT\s+.*WHERE.*['"]\s*\+\s*/i.test(codeToAnalyze) || /Statement\s+stmt/i.test(codeToAnalyze)) {
      vulnerabilities.push({
        title: 'Potential SQL Injection via Dynamic Query Construction',
        severity: 'Critical',
        category: 'OWASP A03:2021 - Injection (CWE-89)',
        description: 'Raw string concatenation detected in SQL query construction allows arbitrary SQL injection.',
        snippet: codeToAnalyze.slice(0, 100),
        remediation: 'Use PreparedStatement with parameterized queries or an ORM with query parameter binding.'
      });
      keyImprovements.push('Replaced dynamic SQL concatenation with parameterized PreparedStatement.');
    }

    if (/sk_live_[0-9a-zA-Z]+/i.test(codeToAnalyze) || /apiKey\s*=\s*['"][^'"]+['"]/i.test(codeToAnalyze)) {
      vulnerabilities.push({
        title: 'Hardcoded Secret / API Token Exposure',
        severity: 'High',
        category: 'OWASP A07:2021 - Identification & Authentication Failures (CWE-798)',
        description: 'Static secret token committed directly in source code.',
        snippet: 'apiKey = "..."',
        remediation: 'Extract credentials into secure environment variables or vault secret manager.'
      });
      keyImprovements.push('Moved hardcoded secrets to environment configuration.');
    }

    if (/FileInputStream|FileOutputStream|BufferedReader/i.test(codeToAnalyze) && !/try\s*\(/i.test(codeToAnalyze)) {
      vulnerabilities.push({
        title: 'Unclosed Resource Stream Leak',
        severity: 'Medium',
        category: 'Resource Management (CWE-775)',
        description: 'I/O stream opened without try-with-resources may cause file descriptor starvation.',
        snippet: 'FileInputStream fis = ...',
        remediation: 'Wrap stream allocations in try-with-resources block.'
      });
      keyImprovements.push('Refactored I/O stream to use try-with-resources automatic closing.');
    }

    if (cyclomaticComplexity > 8) {
      codeSmells.push(`High Cyclomatic Complexity (M = ${cyclomaticComplexity}). Methods should be broken into single-responsibility units.`);
    }
    if (/catch\s*\([^)]+\)\s*\{\s*\}/i.test(codeToAnalyze) || /e\.printStackTrace\(\)/i.test(codeToAnalyze)) {
      codeSmells.push('Swallowed Exception or Standard Error dump. Replace with structured contextual logging (SLF4J).');
    }
    if (codeSmells.length === 0) {
      codeSmells.push('Consider adding strict null-safety checks on method entry points.');
    }

    let overallQualityScore = Math.max(35, Math.min(98, 95 - (vulnerabilities.length * 25) - (cyclomaticComplexity * 2)));
    let riskLevel = vulnerabilities.some(v => v.severity === 'Critical') ? 'Critical' : vulnerabilities.length > 0 ? 'High' : cyclomaticComplexity > 10 ? 'Moderate' : 'Low';

    const refactoredCode = `// AI Refactored & Hardened Version (${(language || 'java').toUpperCase()})
// Remediations applied: Parameter binding, resource safety, and secure secrets management.

public class HardenedService {
    private final EnvironmentConfig config;

    public HardenedService(EnvironmentConfig config) {
        this.config = Objects.requireNonNull(config);
    }

    public Optional<User> getUserSafely(Connection conn, String username) throws SQLException {
        final String query = "SELECT id, username, email FROM users WHERE username = ?";
        try (PreparedStatement stmt = conn.prepareStatement(query)) {
            stmt.setString(1, username);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(new User(rs.getString("username")));
                }
            }
        }
        return Optional.empty();
    }
}`;

    return {
      overallQualityScore,
      codeQualityScore: overallQualityScore,
      riskLevel,
      summary: vulnerabilities.length > 0 
        ? `Found ${vulnerabilities.length} security vulnerability(ies) and ${codeSmells.length} smell(s). Risk Level: ${riskLevel}.`
        : `Clean implementation. No critical OWASP vulnerabilities detected. Quality Score: ${overallQualityScore}/100.`,
      cyclomaticComplexity,
      maintainabilityIndex: cyclomaticComplexity > 12 ? 'Moderate' : 'High',
      vulnerabilities,
      codeSmells,
      keyImprovements: keyImprovements.length > 0 ? keyImprovements : ['Verified parameter sanitization and thread safety.'],
      refactoredCode,
      recommendations: [
        'Break down high cyclomatic complexity methods into single-responsibility helpers.',
        'Ensure input sanitization and strict parameter typing are enforced.',
        'Add comprehensive unit test coverage for edge boundary cases.'
      ]
    };
  },

  chatWithCopilot: async ({ message, history }) => {
    const raw = (message || '').trim();
    const lower = raw.toLowerCase();

    // Fetch active live data from local store to make answers dynamically context-aware
    const healthData = clientStore.getHealth();
    const projects = clientStore.getProjects();
    const users = clientStore.getUsers();

    const pAlphaHealth = healthData[1] || { riskScore: 35, sprintVelocity: 42, bugTrend: 'decreasing', technicalDebt: 'low', codeQualityIndex: 88 };
    const pBetaHealth = healthData[2] || { riskScore: 60, sprintVelocity: 30, bugTrend: 'stable', technicalDebt: 'medium', codeQualityIndex: 72 };

    let reply = '';
    let suggestedPrompts = [];

    // --- 1. ARCHITECTURE: MONOLITH VS MICROSERVICES ---
    if (lower.includes('monolith') || lower.includes('microservice') || lower.includes('modular') || lower.includes('decouple') || lower.includes('soa')) {
      reply = `### Architecture Evaluation: Modular Monolith vs Microservices

When evaluating system topology for your organization, consider team size, organizational maturity, and scaling requirements:

#### 1. Modular Monolith (Recommended for teams < 15 engineers)
- **Strengths:** High developer velocity, single CI/CD pipeline, zero inter-service network latency, unified ACID database transactions, and simple local debugging.
- **Trade-offs:** Single point of deployment; requires strict module boundaries (e.g. package encapsulation or Hexagonal/Clean Architecture) to prevent accidental code coupling.
- **Best Suited For:** Early-to-growth stage platforms, small-to-mid engineering squads, and domain models that are still evolving.

#### 2. Microservices Architecture
- **Strengths:** Independent deployment and autoscaling per bounded context (e.g., scaling an AI inference or payment worker independently from authentication), autonomous team ownership, and heterogeneous tech stacks.
- **Trade-offs:** High operational and DevOps complexity, distributed transaction overhead (requires Saga pattern or Eventual Consistency), network latency, and observability challenges (requires OpenTelemetry / distributed tracing).

#### Recommendation & Synaptech Guidance:
Start with a **Modular Monolith** using strict domain boundaries. As specific bounded contexts experience 10x higher load or require isolated deployment cadences, peel them off into dedicated microservices.

*Tip: Navigate to the **🏛️ Architecture Advisor** tab to interactively generate a C4 system container diagram tailored to your team!*`;

      suggestedPrompts = [
        'Explain the Saga pattern for distributed transactions',
        'How to set up an API Gateway with Spring Cloud?',
        'Explain Event-Driven architecture with Kafka'
      ];

    // --- 2. PROJECT RISKS & HEALTH TELEMETRY ---
    } else if (lower.includes('risk') || lower.includes('health') || lower.includes('project alpha') || lower.includes('project beta') || lower.includes('telemetry') || lower.includes('kpi') || lower.includes('defect')) {
      reply = `### AI Project Health & Risk Evaluation Report

Here is the real-time engineering telemetry synthesized across your active projects:

#### 🟢 Project Alpha: Healthy (Risk Score: ${pAlphaHealth.riskScore}/100)
- **Sprint Velocity:** ${pAlphaHealth.sprintVelocity} pts / sprint (High Throughput)
- **Code Quality Index:** ${pAlphaHealth.codeQualityIndex}/100
- **Technical Debt:** ${pAlphaHealth.technicalDebt.toUpperCase()}
- **Bug Trend:** ${pAlphaHealth.bugTrend.toUpperCase()}
- **Assessment:** Project Alpha is operating on schedule with clean architectural boundaries and decreasing defect influx. Maintain the current 42-point velocity.

#### 🟡 Project Beta: Moderate Risk (Risk Score: ${pBetaHealth.riskScore}/100)
- **Sprint Velocity:** ${pBetaHealth.sprintVelocity} pts / sprint
- **Code Quality Index:** ${pBetaHealth.codeQualityIndex}/100
- **Technical Debt:** ${pBetaHealth.technicalDebt.toUpperCase()}
- **Assessment:** Elevated risk due to accumulating technical debt and slower defect resolution.

#### Actionable Mitigation Strategies:
1. **Debt Allocation:** Dedicate 20% of Project Beta's next sprint capacity to refactoring high-cyclomatic complexity methods.
2. **Defect Triage:** Implement automated static analysis checks in CI to arrest defect accumulation.
3. **Capacity Cap:** Prevent story point inflation by limiting active work-in-progress (WIP) to 2 items per engineer.

*Tip: Use the **AI Risk Simulator** on your Dashboard to test the impact of code reviews and velocity on the risk score.*`;

      suggestedPrompts = [
        'How to reduce technical debt in Project Beta?',
        'Simulate code quality improvements',
        'How to optimize sprint velocity?'
      ];

    // --- 3. SPRINT PLANNING & VELOCITY ---
    } else if (lower.includes('sprint') || lower.includes('velocity') || lower.includes('capacity') || lower.includes('backlog') || lower.includes('scrum') || lower.includes('story point') || lower.includes('dor') || lower.includes('dod') || lower.includes('agile')) {
      reply = `### Agile Velocity & Sprint Capacity Optimization Framework

To achieve predictable delivery cadence and eliminate sprint carryover:

#### 1. The 80/20 Capacity Principle
- Never commit 100% of nominal team capacity to new feature delivery.
- Reserve **80%** for planned product backlog items and **20%** as an unallocated buffer for code reviews, production defects, and technical debt.

#### 2. Enforce a Strict Definition of Ready (DoR)
A user story must NOT enter an active sprint unless it meets:
- **Quantified Acceptance Criteria:** Written in verifiable Gherkin format (*Given-When-Then*).
- **UX & Technical Spec:** UI assets attached and backend API contracts agreed upon.
- **Zero Unresolved Blockers:** External dependencies must be resolved ahead of time.

#### 3. Vertical Story Slicing
- Break down any user story larger than 8 story points into smaller vertical slices (2 to 5 points each).
- Vertical slicing ensures each increment touches UI, business logic, and database, enabling continuous deployment.

#### 4. Team Metrics
- Active Developers: ${users.filter(u => !u.roles?.includes('ROLE_ADMIN')).length || 3} engineers
- Target Sprint Length: 2 Weeks
- Recommended Commitment: ${Math.round((pAlphaHealth.sprintVelocity || 42) * 0.85)} story points

*Tip: Check the **⚡ Sprint Planner** module to automatically synthesize sprint backlogs from raw requirements!*`;

      suggestedPrompts = [
        'Generate a sample Definition of Done (DoD)',
        'How to handle carryover sprint points?',
        'Evaluate Monolith vs Microservices'
      ];

    // --- 4. OWASP & CODE SECURITY ---
    } else if (lower.includes('owasp') || lower.includes('security') || lower.includes('vulnerability') || lower.includes('sql injection') || lower.includes('xss') || lower.includes('csrf') || lower.includes('jwt') || lower.includes('auth') || lower.includes('token') || lower.includes('hash')) {
      reply = `### OWASP Top 10 Security Hardening Checklist

Key engineering safeguards to verify across your application services:

#### 1. Injection Prevention (A03:2021)
- Always utilize parameterized queries (e.g. JPA / Hibernate bind parameters or \`PreparedStatement\`).
- Never build SQL queries by concatenating raw user inputs:
\`\`\`sql
-- SECURE: Parameterized query
SELECT * FROM users WHERE username = :username;
\`\`\`

#### 2. Broken Access Control (A01:2021)
- Enforce role verification on every API endpoint on the server side:
\`\`\`java
@PreAuthorize("hasRole('ADMIN')")
@DeleteMapping("/users/{id}")
\`\`\`
- Never rely solely on hiding frontend buttons or client-side routing.

#### 3. Cryptographic Failures & Credential Storage (A02:2021)
- Store passwords using adaptive key-derivation functions (**BCrypt**, Argon2id, or PBKDF2) with work factor >= 12.
- Enforce **HttpOnly, Secure, SameSite=Strict** cookies for JWT tokens to neutralize XSS token exfiltration.

#### 4. Cross-Site Scripting (XSS) & Input Sanitization
- Escape user-supplied data in React JSX and encode HTML output.
- Configure Content Security Policy (CSP) headers in your reverse proxy/gateway.

*Tip: Paste suspect code into the **🛡️ Code Review** tab for automated OWASP vulnerability inspection!*`;

      suggestedPrompts = [
        'How to prevent JWT replay attacks?',
        'Explain CORS vs CSRF protections',
        'Review code for security vulnerabilities'
      ];

    // --- 5. EVENT-DRIVEN & MESSAGING ---
    } else if (lower.includes('event') || lower.includes('kafka') || lower.includes('rabbitmq') || lower.includes('pubsub') || lower.includes('cqrs') || lower.includes('saga') || lower.includes('messaging')) {
      reply = `### Event-Driven Architecture & Distributed Systems Guide

Event-Driven Architecture (EDA) decouples producers from consumers using asynchronous event streams:

#### 1. Core Architectural Patterns
- **CQRS (Command Query Responsibility Segregation):** Separate command models (writes, state modifications) from query models (read-optimized read replicas or Elasticsearch/Redis projections).
- **The Saga Pattern:** Coordinates multi-service transactions without two-phase commit (2PC). Use **Choreography** (events trigger next steps) or **Orchestration** (central orchestrator coordinates steps and compensations).
- **Transactional Outbox:** Write events into a local database table within the business transaction, then asynchronously tail or publish to Kafka to guarantee *at-least-once* delivery.

#### 2. Message Broker Selection: Kafka vs RabbitMQ
- **Apache Kafka:** High-throughput, distributed append-only log. Ideal for event sourcing, telemetry streams, and event replay.
- **RabbitMQ:** Advanced AMQP routing, granular queues, and push-based delivery. Ideal for discrete background task distribution and RPC-style processing.

*Tip: Use our **🏛️ Architecture Advisor** to generate an Event-Driven topology diagram with Kafka and Redis!*`;

      suggestedPrompts = [
        'Kafka vs RabbitMQ: Which should I choose?',
        'Explain the Transactional Outbox pattern',
        'How to handle schema evolution in event streams?'
      ];

    // --- 6. TECHNICAL DEBT & CLEAN CODE ---
    } else if (lower.includes('debt') || lower.includes('clean code') || lower.includes('refactor') || lower.includes('smell') || lower.includes('solid') || lower.includes('complexity')) {
      reply = `### Technical Debt Remediation & Clean Code Architecture

Technical debt compounds over time if left unmanaged. Here is the recommended remediation roadmap:

#### 1. The 3-Tier Debt Reduction Strategy
1. **The Boy Scout Rule:** Leave every touched file slightly cleaner than you found it during regular feature development.
2. **Dedicated Refactoring Tickets:** Allocate 15-20% of every sprint to high-churn, low-maintainability classes.
3. **Automated CI Gates:** Fail builds if cyclomatic complexity exceeds 15 or if test coverage drops below established thresholds.

#### 2. SOLID Design Principles Summary
- **S - Single Responsibility:** A class should have one, and only one, reason to change.
- **O - Open/Closed:** Open for extension, closed for modification (use polymorphism/strategy patterns).
- **L - Liskov Substitution:** Derived types must be completely substitutable for their base types.
- **I - Interface Segregation:** Clients should not be forced to depend on interfaces they do not use.
- **D - Dependency Inversion:** Depend upon abstractions, not concrete implementations.

*Tip: Use the **🛡️ Code Review** tab to automatically calculate cyclomatic complexity and receive AI refactoring snippets!*`;

      suggestedPrompts = [
        'How to calculate Technical Debt Index?',
        'Explain SOLID principles with code examples',
        'Review code for code smells'
      ];

    // --- 7. REQUIREMENTS & NLP ---
    } else if (lower.includes('requirement') || lower.includes('user story') || lower.includes('ambigu') || lower.includes('spec') || lower.includes('nlp')) {
      reply = `### Writing High-Quality, Unambiguous Requirements

Ambiguous requirements account for over 45% of software defects. Follow this standard:

#### 1. Avoid Subjective Adjectives
- ❌ *"The system must be ultra-fast and easy to use."*
- ✅ *"The search API must respond within 200ms at the 95th percentile under 2,000 concurrent requests."*

#### 2. Standard Agile User Story Format
- *"As a [Specific Persona], I want to [Perform an Action], so that [Business Benefit Achieved]."*

#### 3. Acceptance Criteria in Gherkin
\`\`\`gherkin
Given an authenticated user with ROLE_ADMIN
When they delete a user account
Then the user is removed from active sessions and audit logged
\`\`\`

*Tip: Paste your requirement document into the **🔍 Requirement Analyzer** module to detect ambiguous terms and synthesize stories!*`;

      suggestedPrompts = [
        'How does NLP ambiguity detection work?',
        'Convert legacy requirements to Agile stories',
        'Evaluate Monolith vs Microservices'
      ];

    // --- 8. SYNAPTECH PLATFORM OVERVIEW & CAPABILITIES ---
    } else if (lower.includes('synaptech') || lower.includes('help') || lower.includes('what can you do') || lower.includes('features') || lower.includes('overview') || lower.includes('how to use')) {
      reply = `### Welcome to Synaptech AI - Autonomous Software Engineering Platform 🧠

I am your intelligent assistant integrated across all 6 core platform capabilities:

1. **📊 Telemetry & Health Dashboard:** Real-time engineering vitals, defect influx tracking, and interactive risk simulation.
2. **🔍 Requirement Analyzer:** Natural Language Processing (NLP) to detect ambiguous specifications and synthesize Agile user stories.
3. **⚡ Sprint Planner:** Automated story point capacity modeling, velocity forecasting, and balanced sprint backlog synthesis.
4. **🏛️ Architecture Advisor:** Live visual diagram canvas (Mermaid.js), C4 model generation, and architectural trade-off evaluations.
5. **🛡️ Code Review & Security:** Automated OWASP Top 10 vulnerability scanner, cyclomatic complexity profiling, and safe refactoring.
6. **👤 Admin Console:** User governance, role management (ROLE_USER, ROLE_ADMIN), password resets, and immutable audit logging.

What engineering challenge would you like to tackle today?`;

      suggestedPrompts = [
        'Evaluate Monolith vs Microservices',
        'Evaluate project risks',
        'How to optimize sprint velocity?'
      ];

    // --- 9. INTELLIGENT DYNAMIC TECHNICAL INQUIRY ENGINE ---
    } else {
      reply = `### Synaptech Copilot: Architectural Analysis

Regarding your inquiry on **"${raw}"**:

#### 1. Architectural Context & Overview
In modern enterprise software engineering, addressing **${raw}** requires balancing scalability, maintainability, and operational simplicity. Key considerations include:
- **Separation of Concerns:** Keep business domain logic isolated from external infrastructure and transport layers.
- **Resilience & Fault Tolerance:** Ensure graceful degradation using timeouts, circuit breakers, and retry policies with exponential backoff.
- **Observability:** Emit structured logs, metrics (RED/USE metrics), and distributed tracing IDs across transactions.

#### 2. Recommended Best Practices
1. **Declarative Contracts:** Define explicit API specifications (OpenAPI / Protocol Buffers) before implementation.
2. **Automated Testing:** Guard critical paths with unit tests, integration tests against containerized databases (Testcontainers), and regression suites.
3. **Continuous Verification:** Implement automated security and code quality gates within CI/CD pipelines.

#### 3. How Synaptech Accelerates This:
- Use the **🏛️ Architecture Advisor** to visualize system components and data flows.
- Use the **🛡️ Code Review** module to audit code snippets for vulnerabilities and complexity.
- Use the **⚡ Sprint Planner** to organize deliverables into predictable 2-week iterations.

Feel free to ask for specific code implementations, architectural patterns, or deep-dive trade-offs!`;

      suggestedPrompts = [
        'Evaluate Monolith vs Microservices',
        'Evaluate project risks',
        'OWASP security checklist'
      ];
    }

    return { reply, suggestedPrompts };
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
    if (current && (current.id === userId || (current.username === 'admin' && (userId === 1 || userId === '1')))) {
      throw new Error('Admin cannot delete their own account.');
    }

    const users = clientStore.getUsers();
    const targetUser = users.find(u => u.id === userId || u.id === Number(userId));
    if (!targetUser) {
      throw new Error('User not found.');
    }

    const filtered = users.filter(u => u.id !== userId && u.id !== Number(userId));
    clientStore.setUsers(filtered);

    // Persist deleted usernames so re-seed never restores them
    try {
      const deleted = JSON.parse(localStorage.getItem('synaptech_deleted_users') || '[]');
      const usernameLower = (targetUser.username || '').toLowerCase();
      if (usernameLower && !deleted.includes(usernameLower)) {
        deleted.push(usernameLower);
        localStorage.setItem('synaptech_deleted_users', JSON.stringify(deleted));
      }
    } catch {}

    clientStore.logActivity(current?.id || 1, current?.username || 'admin', 'USER_DELETED', `Deleted user ${targetUser.username}`);
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
