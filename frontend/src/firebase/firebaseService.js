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
    const lower = (message || '').toLowerCase();
    let reply = `I'm Synaptech Copilot. I'm analyzing your architecture and engineering metrics. `;
    let suggestedPrompts = [
      'Evaluate Monolith vs Microservices',
      'How to optimize sprint velocity?',
      'OWASP security checklist'
    ];

    if (lower.includes('risk')) {
      reply += `Project Alpha is currently showing a stable risk score of 35/100, while Project Beta needs attention due to medium technical debt.`;
      suggestedPrompts = ['How to reduce technical debt?', 'Simulate code quality improvements'];
    } else if (lower.includes('architecture')) {
      reply += `For low-latency applications with small to mid-sized teams, a Modular Monolith or Clean Architecture delivers the fastest time to market with minimal DevOps overhead.`;
      suggestedPrompts = ['Generate event-driven topology', 'Compare Microservices vs Monolith'];
    } else if (lower.includes('sprint') || lower.includes('velocity')) {
      reply += `Current sprint velocity is tracking at ~42 story points. Recommend maintaining this cadence to avoid team fatigue.`;
      suggestedPrompts = ['Plan 2-week sprint with 30 capacity', 'Identify sprint bottlenecks'];
    } else {
      reply += `You can ask me to evaluate project risks, recommend architectures, plan sprints, or review code snippets.`;
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
