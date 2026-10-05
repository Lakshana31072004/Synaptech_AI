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

export const requirementService = {
  getProjectRequirements: async (projectId) => {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, 'project_requirements'), 
          where('projectId', '==', String(projectId))
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      } catch (err) {
        console.warn('[Firebase] Firestore getProjectRequirements warning:', err);
      }
    }
    return clientStore.getRequirements(projectId);
  },

  createProjectRequirement: async (projectId, data) => {
    const newReq = {
      projectId: String(projectId),
      reqCode: data.reqCode || `REQ-${Math.floor(100 + Math.random() * 900)}`,
      title: data.title || 'Requirement Title',
      description: data.description || '',
      category: data.category || 'FUNCTIONAL',
      priority: data.priority || 'Medium',
      status: data.status || 'ANALYZED',
      createdAt: new Date().toISOString()
    };

    let id = Date.now();
    if (isFirebaseConfigured && db) {
      try {
        const docRef = await addDoc(collection(db, 'project_requirements'), newReq);
        id = docRef.id;
        console.log('[Firebase] Requirement saved to Firestore:', id);
      } catch (err) {
        console.warn('[Firebase] Firestore createProjectRequirement warning:', err);
      }
    }

    const existing = clientStore.getRequirements(projectId);
    const obj = { id, ...newReq };
    existing.push(obj);
    clientStore.setRequirements(projectId, existing);

    return obj;
  },

};
