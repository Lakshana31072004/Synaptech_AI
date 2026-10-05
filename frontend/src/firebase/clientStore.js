import { isFirebaseConfigured, db } from './firebaseConfig.js';
import { collection, addDoc } from 'firebase/firestore';

// Helper to create a compliant JWT token for AuthContext and jwtDecode
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

// Seed baseline accounts
const DEFAULT_USERS = [
  { 
    id: 1, 
    username: 'admin', 
    password: 'admin123', 
    email: 'admin@synaptech.ai', 
    roles: ['ROLE_USER', 'ROLE_ADMIN'], 
    roleTitle: 'System Administrator & Security Governance Lead',
    profilePictureUrl: '/uploads/953c7178-aa6b-4503-87c7-2b7af5dcff65_WhatsApp Image 2026-08-04 at 10.03.52 AM.jpeg',
    profile_picture_url: '/uploads/953c7178-aa6b-4503-87c7-2b7af5dcff65_WhatsApp Image 2026-08-04 at 10.03.52 AM.jpeg',
    lastLogin: '2026-09-21T05:15:00.000Z',
    lastLoginIp: '192.168.1.104',
    lastLoginDetails: 'Chrome 128 on Windows 11 (IP: 192.168.1.104)',
    loginCount: 92,
    createdAt: new Date().toISOString()
  },
  { 
    id: 2, 
    username: 'developer', 
    password: 'developer123', 
    email: 'dev@synaptech.ai', 
    roles: ['ROLE_USER', 'ROLE_DEVELOPER'], 
    roleTitle: 'Lead Full-Stack & Security Engineer',
    profilePictureUrl: '/uploads/879752d8-c6cb-4cf8-a971-36d2fe0c6515_download.jpg',
    profile_picture_url: '/uploads/879752d8-c6cb-4cf8-a971-36d2fe0c6515_download.jpg',
    lastLogin: '2026-09-21T05:35:00.000Z',
    lastLoginIp: '192.168.1.115',
    lastLoginDetails: 'VSCode Copilot on Windows 11 (IP: 192.168.1.115)',
    loginCount: 81,
    createdAt: new Date().toISOString()
  },
  { 
    id: 33, 
    username: 'sahana', 
    password: 'sahana123', 
    email: 'sahana@synaptech.ai', 
    roles: ['ROLE_USER', 'ROLE_PROJECT_MANAGER'], 
    roleTitle: 'Product Owner & Requirements Intelligence Lead',
    profilePictureUrl: '/uploads/6dda8cea-c36c-4691-9abd-0af0f74b4f67_WhatsApp Image 2026-09-03 at 2.04.10 PM.jpeg',
    profile_picture_url: '/uploads/6dda8cea-c36c-4691-9abd-0af0f74b4f67_WhatsApp Image 2026-09-03 at 2.04.10 PM.jpeg',
    lastLogin: '2026-09-21T04:45:00.000Z',
    lastLoginIp: '192.168.1.120',
    lastLoginDetails: 'Firefox 130 on Windows 11 (IP: 192.168.1.120)',
    loginCount: 66,
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_ACTIVITIES = [
  // --- RECENT LOGIN & SESSION ACTIVITIES ---
  {
    id: 2001,
    userId: 1,
    username: 'admin',
    action: 'USER_LOGIN',
    actionType: 'USER_LOGIN',
    timestamp: '2026-09-21T05:15:00.000Z',
    details: 'Admin authenticated via Firebase Cloud Console (IP: 192.168.1.104, Chrome 128 / Windows 11). Session token issued.'
  },
  {
    id: 2011,
    userId: 2,
    username: 'developer',
    action: 'USER_LOGIN',
    actionType: 'USER_LOGIN',
    timestamp: '2026-09-21T05:35:00.000Z',
    details: 'Developer authenticated via Dev Workspace (IP: 192.168.1.115, VSCode Copilot / Windows 11).'
  },
  {
    id: 2021,
    userId: 33,
    username: 'sahana',
    action: 'USER_LOGIN',
    actionType: 'USER_LOGIN',
    timestamp: '2026-09-21T04:45:00.000Z',
    details: 'User sahana authenticated via Cloud SSO (IP: 192.168.1.120, Firefox 130 / Windows 11).'
  },
  {
    id: 2002,
    userId: 1,
    username: 'admin',
    action: 'SESSION_REFRESH',
    actionType: 'SESSION_REFRESH',
    timestamp: '2026-09-21T04:00:00.000Z',
    details: 'Admin active session renewed. JWT Bearer token refresh completed successfully.'
  },
  {
    id: 2012,
    userId: 2,
    username: 'developer',
    action: 'SESSION_REFRESH',
    actionType: 'SESSION_REFRESH',
    timestamp: '2026-09-21T03:00:00.000Z',
    details: 'Developer session token auto-extended for continuous AST code scan.'
  },
  {
    id: 2022,
    userId: 33,
    username: 'sahana',
    action: 'SESSION_REFRESH',
    actionType: 'SESSION_REFRESH',
    timestamp: '2026-09-21T02:00:00.000Z',
    details: 'Session token renewed for REQ-201 IoT telemetry requirements evaluation.'
  },
  {
    id: 2003,
    userId: 1,
    username: 'admin',
    action: 'USER_LOGIN',
    actionType: 'USER_LOGIN',
    timestamp: '2026-09-21T01:00:00.000Z',
    details: 'Administrator authenticated from workstation (IP: 127.0.0.1, Port 3000, Chrome 128).'
  },
  {
    id: 2013,
    userId: 2,
    username: 'developer',
    action: 'USER_LOGIN',
    actionType: 'USER_LOGIN',
    timestamp: '2026-09-21T00:00:00.000Z',
    details: 'Developer authenticated via Web Portal (IP: 192.168.1.115, Chrome 128 / Windows 11).'
  },
  {
    id: 2014,
    userId: 2,
    username: 'developer',
    action: 'USER_LOGOUT',
    actionType: 'USER_LOGOUT',
    timestamp: '2026-09-20T14:00:00.000Z',
    details: 'Developer session closed after Sprint 24 backlog commitment.'
  },
  {
    id: 2004,
    userId: 1,
    username: 'admin',
    action: 'USER_LOGOUT',
    actionType: 'USER_LOGOUT',
    timestamp: '2026-09-20T13:00:00.000Z',
    details: 'Administrator session terminated cleanly. Local access tokens purged.'
  },
  {
    id: 2023,
    userId: 33,
    username: 'sahana',
    action: 'USER_LOGOUT',
    actionType: 'USER_LOGOUT',
    timestamp: '2026-09-20T12:00:00.000Z',
    details: 'User sahana logged out successfully.'
  },
  {
    id: 2005,
    userId: 1,
    username: 'admin',
    action: 'USER_LOGIN',
    actionType: 'USER_LOGIN',
    timestamp: '2026-09-20T08:00:00.000Z',
    details: 'Administrator authenticated via SSO Gateway (IP: 192.168.1.104, Chrome 128 / Windows 11).'
  },
  {
    id: 2015,
    userId: 2,
    username: 'developer',
    action: 'USER_LOGIN',
    actionType: 'USER_LOGIN',
    timestamp: '2026-09-20T06:00:00.000Z',
    details: 'Developer authenticated via Web Portal (IP: 192.168.1.115, Chrome 128 / Windows 11).'
  },
  {
    id: 2024,
    userId: 33,
    username: 'sahana',
    action: 'USER_LOGIN',
    actionType: 'USER_LOGIN',
    timestamp: '2026-09-20T05:00:00.000Z',
    details: 'User sahana authenticated via Cloud SSO (IP: 192.168.1.120, Firefox 130 / Windows 11).'
  },
  {
    id: 2006,
    userId: 1,
    username: 'admin',
    action: 'USER_LOGOUT',
    actionType: 'USER_LOGOUT',
    timestamp: '2026-09-19T13:00:00.000Z',
    details: 'Admin signed out after completing quarterly security audit.'
  },
  {
    id: 2025,
    userId: 33,
    username: 'sahana',
    action: 'USER_LOGOUT',
    actionType: 'USER_LOGOUT',
    timestamp: '2026-09-19T12:00:00.000Z',
    details: 'User sahana session ended.'
  },
  {
    id: 2007,
    userId: 1,
    username: 'admin',
    action: 'USER_LOGIN',
    actionType: 'USER_LOGIN',
    timestamp: '2026-09-19T06:00:00.000Z',
    details: 'Admin authenticated via Firebase Cloud Console (IP: 192.168.1.104, Chrome 128 / Windows 11).'
  },
  {
    id: 2016,
    userId: 2,
    username: 'developer',
    action: 'USER_LOGIN',
    actionType: 'USER_LOGIN',
    timestamp: '2026-09-19T05:00:00.000Z',
    details: 'Developer signed in to Synaptech engineering workspace (IP: 192.168.1.115).'
  },
  {
    id: 2026,
    userId: 33,
    username: 'sahana',
    action: 'USER_LOGIN',
    actionType: 'USER_LOGIN',
    timestamp: '2026-09-19T05:00:00.000Z',
    details: 'User sahana authenticated via Cloud SSO (IP: 192.168.1.120, Firefox 130 / Windows 11).'
  },

  // --- SYSTEM & PROJECT DOMAIN ACTIVITIES ---
  {
    id: 1001,
    userId: 1,
    username: 'admin',
    action: 'SYSTEM_INITIALIZED',
    actionType: 'SYSTEM_INITIALIZED',
    timestamp: '2026-09-20T06:00:00.000Z',
    details: 'Synaptech platform connected to Google Cloud Firestore database.'
  },
  {
    id: 1003,
    userId: 1,
    username: 'admin',
    action: 'PROFILE_PICTURE_UPDATED',
    actionType: 'PROFILE_PICTURE_UPDATED',
    timestamp: '2026-09-20T10:00:00.000Z',
    details: 'Updated executive avatar in system directory.'
  },
  {
    id: 1004,
    userId: 1,
    username: 'admin',
    action: 'PROJECT_CREATED',
    actionType: 'PROJECT_CREATED',
    timestamp: '2026-09-20T12:00:00.000Z',
    details: 'Created Project Alpha: Enterprise Cloud AI Architecture.'
  },
  {
    id: 1005,
    userId: 1,
    username: 'admin',
    action: 'SECURITY_AUDIT',
    actionType: 'SECURITY_AUDIT',
    timestamp: '2026-09-20T18:00:00.000Z',
    details: 'Executed quarterly RBAC permissions & role audit for user group.'
  },
  {
    id: 1007,
    userId: 2,
    username: 'developer',
    action: 'PROFILE_PICTURE_UPDATED',
    actionType: 'PROFILE_PICTURE_UPDATED',
    timestamp: '2026-09-20T15:00:00.000Z',
    details: 'Developer profile photo updated and synchronized.'
  },
  {
    id: 1008,
    userId: 2,
    username: 'developer',
    action: 'SPRINT_PLANNED',
    actionType: 'SPRINT_PLANNED',
    timestamp: '2026-09-20T20:00:00.000Z',
    details: 'Committed 12 backlog items to Sprint 24. Target velocity: 42 points.'
  },
  {
    id: 1009,
    userId: 2,
    username: 'developer',
    action: 'CODE_QUALITY_CHECK',
    actionType: 'CODE_QUALITY_CHECK',
    timestamp: '2026-09-21T00:00:00.000Z',
    details: 'Triggered automated AST static analysis and technical debt scan.'
  },
  {
    id: 1011,
    userId: 33,
    username: 'sahana',
    action: 'PROFILE_PICTURE_UPDATED',
    actionType: 'PROFILE_PICTURE_UPDATED',
    timestamp: '2026-09-20T17:00:00.000Z',
    details: 'Profile image updated with personalized avatar.'
  },
  {
    id: 1012,
    userId: 33,
    username: 'sahana',
    action: 'REQUIREMENT_ANALYSIS',
    actionType: 'REQUIREMENT_ANALYSIS',
    timestamp: '2026-09-20T22:00:00.000Z',
    details: 'Submitted REQ-201 IoT sensor telemetry requirements for AI evaluation.'
  },
  {
    id: 1013,
    userId: 33,
    username: 'sahana',
    action: 'RISK_EVALUATION',
    actionType: 'RISK_EVALUATION',
    timestamp: '2026-09-21T02:00:00.000Z',
    details: 'Evaluated Project Beta risk score: 60 (Medium). Added debt mitigation notes.'
  },
  {
    id: 1018,
    userId: 1,
    username: 'admin',
    action: 'USER_DELETED',
    actionType: 'USER_DELETED',
    timestamp: '2026-10-05T05:20:00.000Z',
    details: 'User subbu (Principal Solutions Architect & Resilience Lead, ID: #66) permanently deleted by System Administrator.'
  }
];

const DEFAULT_PROJECTS = [
  { id: 1, name: 'Project Alpha', createdAt: new Date().toISOString() },
  { id: 2, name: 'Project Beta', createdAt: new Date().toISOString() }
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
    recommendations: ['Codebase quality is healthy.', 'Maintain current 42-point velocity.'],
    factorAnalysis: {
      'Bug Influx Rate': 'Favorable (-15% risk) - Active bugs steadily declining.',
      'Velocity Throughput': 'High Performance (-12% risk) - Story delivery is rapid.',
      'Technical Debt': 'Low (-12% risk) - Clean modular architecture.',
      'Code Quality Index': 'Healthy (88/100) - Clean code with solid test coverage.'
    },
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
    recommendations: ['Prioritize technical debt reduction during sprint retrospectives.'],
    factorAnalysis: {
      'Bug Influx Rate': 'Neutral (+10% risk) - Defect rate steady.',
      'Velocity Throughput': 'Stable (0% risk) - Velocity matches target baseline.',
      'Technical Debt': 'Moderate (+15% risk) - Manageable debt requiring scheduled maintenance.',
      'Code Quality Index': 'Warning (72/100) - Code smell density exceeds thresholds.'
    },
    timestamp: new Date().toISOString()
  }
};

const DEFAULT_REQUIREMENTS = {
  1: [
    {
      id: 101,
      projectId: 1,
      reqCode: 'REQ-101',
      title: 'Real-time Payment Gateway Integration',
      description: 'System shall securely process credit card transactions via PCI-DSS compliant API within 250ms.',
      category: 'SECURITY',
      priority: 'High',
      status: 'ANALYZED',
      createdAt: new Date().toISOString()
    },
    {
      id: 102,
      projectId: 1,
      reqCode: 'REQ-102',
      title: 'Automated Daily Financial Reconciliation',
      description: 'The batch scheduler shall reconcile all journal entries against bank settlements daily at 00:00 UTC.',
      category: 'FUNCTIONAL',
      priority: 'High',
      status: 'ANALYZED',
      createdAt: new Date().toISOString()
    }
  ],
  2: [
    {
      id: 201,
      projectId: 2,
      reqCode: 'REQ-201',
      title: 'IoT Sensor Stream Telemetry Ingestion',
      description: 'Platform must ingest telemetry readings from up to 10,000 edge sensors with latency under 100ms.',
      category: 'PERFORMANCE',
      priority: 'High',
      status: 'ANALYZED',
      createdAt: new Date().toISOString()
    }
  ]
};

// ClientStore provides instant offline/fallback state caching
class ClientStore {
  constructor() {
    this.initStore();
  }

  initStore() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      const existingUsers = localStorage.getItem('synaptech_users');
      if (!existingUsers) {
        localStorage.setItem('synaptech_users', JSON.stringify(DEFAULT_USERS));
      } else {
        try {
          let parsed = JSON.parse(existingUsers);
          let modified = false;

          // Automatically purge deleted user 'subbu' if found in localStorage
          if (parsed.some(u => (u.username || '').toLowerCase() === 'subbu' || u.id === 66 || String(u.id) === '66')) {
            parsed = parsed.filter(u => (u.username || '').toLowerCase() !== 'subbu' && u.id !== 66 && String(u.id) !== '66');
            modified = true;
          }

          parsed.forEach(u => {
            const def = DEFAULT_USERS.find(d => d.username.toLowerCase() === (u.username || '').toLowerCase());
            if (def) {
              if (!u.profilePictureUrl || u.profilePictureUrl === null) {
                u.profilePictureUrl = def.profilePictureUrl;
                u.profile_picture_url = def.profile_picture_url;
                modified = true;
              }
              if (!u.lastLogin) {
                u.lastLogin = def.lastLogin;
                u.lastLoginIp = def.lastLoginIp;
                u.lastLoginDetails = def.lastLoginDetails;
                u.loginCount = def.loginCount;
              }
              if (!u.roleTitle || u.roleTitle !== def.roleTitle) {
                u.roleTitle = def.roleTitle;
                u.roles = def.roles;
                modified = true;
              }
            }
          });
          if (modified) {
            localStorage.setItem('synaptech_users', JSON.stringify(parsed));
          }
        } catch {}
      }

      if (!localStorage.getItem('synaptech_projects')) {
        localStorage.setItem('synaptech_projects', JSON.stringify(DEFAULT_PROJECTS));
      }
      if (!localStorage.getItem('synaptech_health')) {
        localStorage.setItem('synaptech_health', JSON.stringify(DEFAULT_HEALTH));
      }
      if (!localStorage.getItem('synaptech_requirements')) {
        localStorage.setItem('synaptech_requirements', JSON.stringify(DEFAULT_REQUIREMENTS));
      }
      if (!localStorage.getItem('synaptech_simulations')) {
        localStorage.setItem('synaptech_simulations', JSON.stringify({}));
      }

      const existingActivities = localStorage.getItem('synaptech_activities');
      if (existingActivities) {
        try {
          let acts = JSON.parse(existingActivities);
          if (acts.some(a => (a.username || '').toLowerCase() === 'subbu' || a.userId === 66 || String(a.userId) === '66')) {
            acts = acts.filter(a => (a.username || '').toLowerCase() !== 'subbu' && a.userId !== 66 && String(a.userId) !== '66');
            acts.unshift({
              id: Date.now(),
              userId: 1,
              username: 'admin',
              action: 'USER_DELETED',
              actionType: 'USER_DELETED',
              timestamp: new Date().toISOString(),
              details: 'User subbu (Principal Solutions Architect & Resilience Lead, ID: #66) permanently deleted by System Administrator.'
            });
            localStorage.setItem('synaptech_activities', JSON.stringify(acts.slice(0, 100)));
          }
        } catch {}
      } else {
        localStorage.setItem('synaptech_activities', JSON.stringify(DEFAULT_ACTIVITIES));
      }
    } catch (e) {
      console.warn('[ClientStore] LocalStorage error:', e);
    }
  }

  getUsers() {
    try {
      const users = JSON.parse(localStorage.getItem('synaptech_users') || '[]');
      return users.filter(u => (u.username || '').toLowerCase() !== 'subbu' && u.id !== 66 && String(u.id) !== '66');
    } catch {
      return DEFAULT_USERS;
    }
  }

  setUsers(users) {
    try {
      const cleaned = (users || []).filter(u => (u.username || '').toLowerCase() !== 'subbu' && u.id !== 66 && String(u.id) !== '66');
      localStorage.setItem('synaptech_users', JSON.stringify(cleaned));
    } catch {}
  }

  getProjects() {
    try {
      return JSON.parse(localStorage.getItem('synaptech_projects') || '[]');
    } catch {
      return DEFAULT_PROJECTS;
    }
  }

  setProjects(projects) {
    try {
      localStorage.setItem('synaptech_projects', JSON.stringify(projects));
    } catch {}
  }

  getHealth() {
    try {
      return JSON.parse(localStorage.getItem('synaptech_health') || '{}');
    } catch {
      return DEFAULT_HEALTH;
    }
  }

  setHealth(health) {
    try {
      localStorage.setItem('synaptech_health', JSON.stringify(health));
    } catch {}
  }

  getRequirements(projectId) {
    try {
      const all = JSON.parse(localStorage.getItem('synaptech_requirements') || '{}');
      return all[projectId] || DEFAULT_REQUIREMENTS[projectId] || [];
    } catch {
      return DEFAULT_REQUIREMENTS[projectId] || [];
    }
  }

  setRequirements(projectId, reqs) {
    try {
      const all = JSON.parse(localStorage.getItem('synaptech_requirements') || '{}');
      all[projectId] = reqs;
      localStorage.setItem('synaptech_requirements', JSON.stringify(all));
    } catch {}
  }

  getSimulations(projectId) {
    try {
      const all = JSON.parse(localStorage.getItem('synaptech_simulations') || '{}');
      return all[projectId] || [];
    } catch {
      return [];
    }
  }

  addSimulation(projectId, sim) {
    try {
      const all = JSON.parse(localStorage.getItem('synaptech_simulations') || '{}');
      const list = all[projectId] || [];
      list.unshift(sim);
      all[projectId] = list.slice(0, 50);
      localStorage.setItem('synaptech_simulations', JSON.stringify(all));
    } catch {}
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
      userId: userId || 1,
      username: username || 'system',
      action: action || 'ACTION',
      actionType: action || 'ACTION',
      details: details || '',
      timestamp: new Date().toISOString()
    };
    activities.unshift(newLog);
    try {
      localStorage.setItem('synaptech_activities', JSON.stringify(activities.slice(0, 100)));
    } catch {}

    // Persist to Cloud Firestore
    if (isFirebaseConfigured && db) {
      try {
        addDoc(collection(db, 'activity_logs'), newLog).catch(e => {
          console.warn('[Firebase] Firestore activity log write warning:', e);
        });
      } catch (e) {}
    }
  }
}

const clientStore = new ClientStore();


export { clientStore, createClientJwt, DEFAULT_USERS, DEFAULT_ACTIVITIES, DEFAULT_PROJECTS, DEFAULT_HEALTH, DEFAULT_REQUIREMENTS };
