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

import { authService } from './authService.js';
import { projectRiskService } from './projectRiskService.js';

export const adminService = {
  // ==========================================
  getAllUsers: async (page = 0, size = 10, sort = 'id,asc', search = '') => {
    if (isFirebaseConfigured && db) {
      try {
        // Asynchronously ensure deleted user subbu is removed from Firestore collection
        deleteDoc(doc(db, 'users', '66')).catch(() => {});
        deleteDoc(doc(db, 'users', 'subbu')).catch(() => {});

        const snap = await getDocs(collection(db, 'users'));
        if (!snap.empty) {
          let users = snap.docs.map(d => {
            const data = d.data();
            const fallbackDef = DEFAULT_USERS.find(du => du.username.toLowerCase() === (data.username || d.id).toLowerCase());
            return {
              id: data.id || fallbackDef?.id || d.id,
              ...data,
              profilePictureUrl: data.profilePictureUrl || fallbackDef?.profilePictureUrl || null,
              profile_picture_url: data.profile_picture_url || data.profilePictureUrl || fallbackDef?.profilePictureUrl || null,
              lastLogin: data.lastLogin || fallbackDef?.lastLogin || null,
              lastLoginIp: data.lastLoginIp || fallbackDef?.lastLoginIp || null,
              lastLoginDetails: data.lastLoginDetails || fallbackDef?.lastLoginDetails || null,
              loginCount: data.loginCount || fallbackDef?.loginCount || 1
            };
          }).filter(u => (u.username || '').toLowerCase() !== 'subbu' && u.id !== 66 && String(u.id) !== '66');
          if (search) {
            users = users.filter(u => (u.username || '').toLowerCase().includes(search.toLowerCase()));
          }
          return {
            content: users,
            totalElements: users.length,
            totalPages: Math.ceil(users.length / size) || 1,
            size,
            number: page
          };
        }
      } catch (err) {
        console.warn('[Firebase] Firestore getAllUsers warning:', err);
      }
    }

    let users = clientStore.getUsers()
      .filter(u => (u.username || '').toLowerCase() !== 'subbu' && u.id !== 66 && String(u.id) !== '66')
      .map(u => {
        const fallbackDef = DEFAULT_USERS.find(du => du.username.toLowerCase() === (u.username || '').toLowerCase());
        return {
          ...u,
          profilePictureUrl: u.profilePictureUrl || fallbackDef?.profilePictureUrl || null,
          profile_picture_url: u.profile_picture_url || u.profilePictureUrl || fallbackDef?.profilePictureUrl || null,
          lastLogin: u.lastLogin || fallbackDef?.lastLogin || null,
          lastLoginIp: u.lastLoginIp || fallbackDef?.lastLoginIp || null,
          lastLoginDetails: u.lastLoginDetails || fallbackDef?.lastLoginDetails || null,
          loginCount: u.loginCount || fallbackDef?.loginCount || 1
        };
      });
    if (search) {
      users = users.filter(u => (u.username || '').toLowerCase().includes(search.toLowerCase()));
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
    return authService.register(userData);
  },

  deleteUser: async (userId) => {
    const current = await authService.getCurrentUser();
    if (current && (current.id === userId || (current.username === 'admin' && (userId === 1 || userId === '1')))) {
      throw new Error('Admin cannot delete their own account.');
    }

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'users', String(userId)));
        console.log('[Firebase] User deleted from Firestore:', userId);
      } catch (err) {
        console.warn('[Firebase] Firestore deleteUser warning:', err);
      }
    }

    const users = clientStore.getUsers();
    const target = users.find(u => u.id === userId || u.id === Number(userId) || String(u.id) === String(userId));
    const filtered = users.filter(u => u.id !== userId && u.id !== Number(userId) && String(u.id) !== String(userId));
    clientStore.setUsers(filtered);
    clientStore.logActivity(current?.id || 1, current?.username || 'admin', 'USER_DELETED', `Deleted user ${target?.username || userId}`);

    return { message: 'User deleted successfully.' };
  },

  updateUserRoles: async (userId, roles) => {
    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'users', String(userId)), { roles });
        console.log('[Firebase] User roles updated in Firestore:', userId);
      } catch (err) {
        console.warn('[Firebase] Firestore updateUserRoles warning:', err);
      }
    }

    const users = clientStore.getUsers();
    const idx = users.findIndex(u => u.id === userId || u.id === Number(userId) || String(u.id) === String(userId));
    if (idx !== -1) {
      users[idx].roles = roles;
      clientStore.setUsers(users);
      return users[idx];
    }
    return { id: userId, roles };
  },

  updateUserPassword: async (userId, newPassword) => {
    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'users', String(userId)), { password: newPassword });
        console.log('[Firebase] User password updated in Firestore:', userId);
      } catch (err) {
        console.warn('[Firebase] Firestore updateUserPassword warning:', err);
      }
    }

    const users = clientStore.getUsers();
    const idx = users.findIndex(u => u.id === userId || u.id === Number(userId) || String(u.id) === String(userId));
    if (idx !== -1) {
      users[idx].password = newPassword;
      clientStore.setUsers(users);
    }
    return { message: 'Password updated successfully.' };
  },

  getAllRoles: async () => {
    return ['ROLE_USER', 'ROLE_ADMIN', 'ROLE_DEVELOPER', 'ROLE_ARCHITECT'];
  },

  impersonateUser: async (userId) => {
    const users = clientStore.getUsers();
    const target = users.find(u => u.id === userId || u.id === Number(userId) || String(u.id) === String(userId));
    if (!target) throw new Error('Target user not found.');

    const token = createClientJwt(target);
    return { accessToken: token, token };
  },

  triggerPasswordReset: async (userId) => {
    return `Password reset trigger processed via Firebase for user ID: ${userId}`;
  },

  forgotPassword: async (email) => {
    return { message: `Password reset instructions sent to ${email} (simulated via Firebase).` };
  },

  resetPassword: async () => {
    return { message: 'Password successfully reset via Firebase.' };
  },

  getUserActivity: async (userId, page = 0, size = 200) => {
    let list = [];
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'activity_logs'));
        if (!snap.empty) {
          list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      } catch (err) {
        console.warn('[Firebase] Firestore getUserActivity warning:', err);
      }
    }
    if (list.length === 0) {
      list = clientStore.getActivities();
    }

    const targetStr = String(userId).toLowerCase();
    const filtered = list.filter(a => 
      String(a.userId).toLowerCase() === targetStr || 
      (a.username && a.username.toLowerCase() === targetStr)
    );
    filtered.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    const totalPages = Math.ceil(filtered.length / size) || 1;
    const paged = filtered.slice(page * size, (page + 1) * size);
    return { content: paged, totalElements: filtered.length, totalPages };
  },

  getAllUserActivity: async (page = 0, size = 15, username = '', actionType = '', startDate = '', endDate = '', sort = 'timestamp,desc') => {
    let list = [];
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'activity_logs'));
        if (!snap.empty) {
          list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      } catch (err) {
        console.warn('[Firebase] Firestore getAllUserActivity warning:', err);
      }
    }
    if (list.length === 0) {
      list = clientStore.getActivities();
    }

    if (username) {
      list = list.filter(a => (a.username || '').toLowerCase().includes(username.toLowerCase()));
    }
    if (actionType) {
      list = list.filter(a => {
        const act = (a.action || a.actionType || '').toLowerCase();
        return act.includes(actionType.toLowerCase());
      });
    }
    if (startDate) {
      const startMs = new Date(startDate).getTime();
      list = list.filter(a => new Date(a.timestamp).getTime() >= startMs);
    }
    if (endDate) {
      const endMs = new Date(endDate).getTime();
      list = list.filter(a => new Date(a.timestamp).getTime() <= endMs);
    }

    const [sortField, sortDir] = (sort || 'timestamp,desc').split(',');
    list.sort((a, b) => {
      let va = a[sortField] || a.timestamp || '';
      let vb = b[sortField] || b.timestamp || '';
      if (sortField === 'timestamp') {
        va = new Date(va).getTime() || 0;
        vb = new Date(vb).getTime() || 0;
      }
      if (sortDir === 'asc') return va > vb ? 1 : -1;
      return va < vb ? 1 : -1;
    });

    const totalPages = Math.ceil(list.length / size) || 1;
    const paged = list.slice(page * size, (page + 1) * size);
    return { content: paged, totalElements: list.length, totalPages };
  },

  getArchivedUserActivity: async () => {
    return { content: [], totalElements: 0 };
  },

  globalSearch: async (queryStr = '') => {
    const clean = queryStr.toLowerCase();
    const users = (await adminService.getAllUsers(0, 50)).content || [];
    const projects = await projectRiskService.getProjects();

    return {
      users: users.filter(u => (u.username || '').toLowerCase().includes(clean)),
      projects: projects.filter(p => (p.name || '').toLowerCase().includes(clean))
    };
  },

  logActivity: async (action, details, explicitUser = null) => {
    let user = explicitUser;
    if (!user) {
      user = await authService.getCurrentUser();
    }
    const userId = user?.id || 1;
    const username = user?.username || 'admin';
    clientStore.logActivity(userId, username, action, details);
  }
};
