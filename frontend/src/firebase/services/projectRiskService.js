import { isFirebaseConfigured, auth, db } from '../firebaseConfig.js';
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
  orderBy, 
  limit 
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updatePassword 
} from 'firebase/auth';
import { clientStore, createClientJwt, DEFAULT_USERS, DEFAULT_PROJECTS, DEFAULT_HEALTH, DEFAULT_REQUIREMENTS } from '../clientStore.js';

export const projectRiskService = {
  getProjects: async () => {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'projects'));
        if (!snap.empty) {
          return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } else {
          // Seed defaults into Firestore
          for (const p of DEFAULT_PROJECTS) {
            await addDoc(collection(db, 'projects'), p);
          }
          const seededSnap = await getDocs(collection(db, 'projects'));
          return seededSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      } catch (err) {
        console.warn('[Firebase] Firestore getProjects warning, fallback to local store:', err);
      }
    }
    return clientStore.getProjects();
  },

  createProject: async (projectData) => {
    const newProject = {
      name: projectData.name || 'New AI Project',
      createdAt: new Date().toISOString()
    };

    let createdId = Date.now();

    if (isFirebaseConfigured && db) {
      try {
        const docRef = await addDoc(collection(db, 'projects'), newProject);
        createdId = docRef.id;
        
        // Seed default health metrics doc in Firestore
        await setDoc(doc(db, 'project_health', String(createdId)), {
          id: createdId,
          project: { id: createdId, name: newProject.name },
          riskScore: 25,
          bugTrend: 'decreasing',
          sprintVelocity: 35,
          technicalDebt: 'low',
          codeQualityIndex: 90,
          teamProductivity: 'high',
          projectProgress: 10,
          recommendations: ['Maintain unit test coverage.', 'Keep modular architecture.'],
          factorAnalysis: {
            'Bug Influx Rate': 'Favorable (-15% risk)',
            'Velocity Throughput': 'High Performance (-12% risk)',
            'Technical Debt': 'Low (-12% risk)',
            'Code Quality Index': 'Healthy (90/100)'
          },
          timestamp: new Date().toISOString()
        });
        console.log('[Firebase] New project & health record created in Firestore:', createdId);
      } catch (err) {
        console.warn('[Firebase] Firestore createProject warning:', err);
      }
    }

    const projects = clientStore.getProjects();
    const finalObj = { id: createdId, ...newProject };
    projects.push(finalObj);
    clientStore.setProjects(projects);

    const healthStore = clientStore.getHealth();
    healthStore[createdId] = {
      id: createdId,
      project: finalObj,
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

    return finalObj;
  },

  getProjectHealth: async (projectId) => {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'project_health', String(projectId));
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          return { id: snap.id, ...snap.data() };
        }
      } catch (err) {
        console.warn('[Firebase] Firestore getProjectHealth warning:', err);
      }
    }

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
    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, 'project_health_history'), 
          where('projectId', '==', String(projectId)),
          orderBy('timestamp', 'desc'),
          limit(20)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      } catch (err) {
        console.warn('[Firebase] Firestore getProjectHealthHistory warning:', err);
      }
    }

    const current = await projectRiskService.getProjectHealth(projectId);
    return [
      { ...current, timestamp: new Date(Date.now() - 86400000 * 14).toISOString(), riskScore: Math.min(95, current.riskScore + 10) },
      { ...current, timestamp: new Date(Date.now() - 86400000 * 7).toISOString(), riskScore: Math.min(95, current.riskScore + 5) },
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
    const failureProbabilityPercent = parseFloat((score * 0.92).toFixed(1));

    return {
      riskScore: score,
      riskLevel,
      failureProbabilityPercent,
      recommendations: [
        score > 50 ? 'Increase unit test coverage to contain defect propagation.' : 'Codebase quality is healthy.',
        'Prioritize technical debt reduction during sprint retrospectives.',
        'Review sprint backlog sizing to normalize team velocity.'
      ],
      factorAnalysis: {
        'Bug Influx Rate': metrics.bugTrend === 'increasing' ? 'High (+25% risk) - Defects accumulating faster than resolution.' : metrics.bugTrend === 'decreasing' ? 'Favorable (-15% risk) - Active bugs steadily declining.' : 'Neutral (+10% risk) - Defect rate steady.',
        'Velocity Throughput': metrics.sprintVelocity < 25 ? 'Critical Delay (+15% risk) - Velocity is below sustainable pace.' : metrics.sprintVelocity > 45 ? 'High Performance (-12% risk) - Story delivery is rapid.' : 'Stable (0% risk) - Velocity matches target baseline.',
        'Technical Debt': metrics.technicalDebt === 'high' ? 'Critical (+30% risk) - High architectural coupling and debt.' : metrics.technicalDebt === 'medium' ? 'Moderate (+15% risk) - Manageable debt requiring scheduled maintenance.' : 'Low (-12% risk) - Clean modular architecture.',
        'Code Quality Index': metrics.codeQualityIndex < 70 ? `Warning (${metrics.codeQualityIndex}/100) - Code smell density exceeds thresholds.` : `Healthy (${metrics.codeQualityIndex}/100) - Clean code with solid test coverage.`
      }
    };
  },

  evaluateProjectRisk: async (projectId, metrics) => {
    const result = await projectRiskService.predictRisk(metrics);
    const updatedHealth = {
      id: projectId,
      projectId: String(projectId),
      ...metrics,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      recommendations: result.recommendations,
      factorAnalysis: result.factorAnalysis,
      timestamp: new Date().toISOString()
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'project_health', String(projectId)), updatedHealth);
        await addDoc(collection(db, 'project_health_history'), updatedHealth);
        console.log('[Firebase] Evaluated risk snapshot stored in Cloud Firestore for project:', projectId);
      } catch (err) {
        console.warn('[Firebase] Firestore evaluateProjectRisk warning:', err);
      }
    }

    const healthStore = clientStore.getHealth();
    healthStore[projectId] = updatedHealth;
    clientStore.setHealth(healthStore);

    return updatedHealth;
  },

};
