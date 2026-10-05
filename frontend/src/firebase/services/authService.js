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

export const authService = {
  login: async ({ username, password }) => {
    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    // 1. Try Firestore
    if (isFirebaseConfigured && db) {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', cleanUsername));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const docData = snapshot.docs[0].data();
          const userObj = { id: snapshot.docs[0].id, ...docData };

          if (userObj.password === cleanPassword || userObj.password === password) {
            clientStore.logActivity(userObj.id, userObj.username, 'USER_LOGIN', 'User logged in via Firebase Firestore.');
            const token = createClientJwt(userObj);
            return { token, accessToken: token, user: userObj };
          }
        }
      } catch (err) {
        console.warn('[Firebase] Firestore login lookup warning:', err);
      }
    }

    // 2. ClientStore / Seed account fallback
    const users = clientStore.getUsers();
    let foundUser = users.find(u => (u.username || '').toLowerCase() === cleanUsername);

    // Auto-heal default seeded accounts if matched
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
    const cleanUsername = (username || '').trim().toLowerCase();
    if (!cleanUsername || !password) {
      throw new Error('Username and password are required.');
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

    // Save to Cloud Firestore
    if (isFirebaseConfigured && db) {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', cleanUsername));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          throw new Error(`Username "${cleanUsername}" is already taken in Firebase.`);
        }
        await addDoc(usersRef, newUser);
        if (auth && email) {
          try {
            await createUserWithEmailAndPassword(auth, email, password);
          } catch (e) {
            console.warn('[Firebase] Firebase Auth registration skipped:', e.message);
          }
        }
        console.log('[Firebase] User document persisted to Cloud Firestore:', cleanUsername);
      } catch (err) {
        console.warn('[Firebase] Firestore registration warning:', err);
        if (err.message && err.message.includes('already taken')) {
          throw err;
        }
      }
    }

    // Keep clientStore in sync
    const users = clientStore.getUsers();
    if (users.some(u => (u.username || '').toLowerCase() === cleanUsername)) {
      throw new Error(`Username "${cleanUsername}" is already taken.`);
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
      const fallbackDef = DEFAULT_USERS.find(du => du.username.toLowerCase() === (payload.username || '').toLowerCase());
      
      // Try fetching active record from Firestore
      if (isFirebaseConfigured && db && payload.username) {
        try {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('username', '==', payload.username.toLowerCase()));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const data = snap.docs[0].data();
            return {
              id: data.id || snap.docs[0].id,
              ...data,
              profilePictureUrl: data.profilePictureUrl || fallbackDef?.profilePictureUrl || null,
              profile_picture_url: data.profile_picture_url || data.profilePictureUrl || fallbackDef?.profilePictureUrl || null
            };
          }
        } catch (err) {
          console.warn('[Firebase] Failed to fetch current user from Firestore:', err);
        }
      }

      const users = clientStore.getUsers();
      const current = users.find(u => u.username === payload.username || u.id === payload.id);
      if (current) {
        return {
          ...current,
          profilePictureUrl: current.profilePictureUrl || fallbackDef?.profilePictureUrl || null,
          profile_picture_url: current.profile_picture_url || current.profilePictureUrl || fallbackDef?.profilePictureUrl || null
        };
      }
      return {
        ...payload,
        profilePictureUrl: fallbackDef?.profilePictureUrl || null,
        profile_picture_url: fallbackDef?.profile_picture_url || null
      };
    } catch {
      return null;
    }
  },

  changePassword: async ({ oldPassword, newPassword }) => {
    const current = await authService.getCurrentUser();
    if (!current) throw new Error('Not authenticated.');

    if (isFirebaseConfigured && db) {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', (current.username || '').toLowerCase()));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docRef = doc(db, 'users', snap.docs[0].id);
          const data = snap.docs[0].data();
          if (data.password && data.password !== oldPassword) {
            throw new Error('Current password does not match.');
          }
          await updateDoc(docRef, { password: newPassword });
        }
      } catch (err) {
        if (err.message && err.message.includes('does not match')) throw err;
        console.warn('[Firebase] Firestore changePassword warning:', err);
      }
    }

    const users = clientStore.getUsers();
    const userIndex = users.findIndex(u => u.id === current.id || u.username === current.username);
    if (userIndex !== -1) {
      if (users[userIndex].password && users[userIndex].password !== oldPassword) {
        throw new Error('Current password does not match.');
      }
      users[userIndex].password = newPassword;
      clientStore.setUsers(users);
    }
    clientStore.logActivity(current.id, current.username, 'PASSWORD_CHANGE', 'Password updated successfully.');
    return { message: 'Password updated successfully.' };
  },

  changeUsername: async ({ newUsername }) => {
    const current = await authService.getCurrentUser();
    if (!current) throw new Error('Not authenticated.');

    const clean = newUsername.trim().toLowerCase();
    if (!clean) throw new Error('New username cannot be empty.');

    if (isFirebaseConfigured && db) {
      try {
        const usersRef = collection(db, 'users');
        const checkQ = query(usersRef, where('username', '==', clean));
        const checkSnap = await getDocs(checkQ);
        if (!checkSnap.empty && checkSnap.docs[0].id !== String(current.id)) {
          throw new Error('Username is already taken.');
        }
        const currQ = query(usersRef, where('username', '==', (current.username || '').toLowerCase()));
        const currSnap = await getDocs(currQ);
        if (!currSnap.empty) {
          await updateDoc(doc(db, 'users', currSnap.docs[0].id), { username: clean });
        }
      } catch (err) {
        if (err.message && err.message.includes('already taken')) throw err;
        console.warn('[Firebase] Firestore changeUsername warning:', err);
      }
    }

    const users = clientStore.getUsers();
    if (users.some(u => u.id !== current.id && (u.username || '').toLowerCase() === clean)) {
      throw new Error('Username is already taken.');
    }
    const idx = users.findIndex(u => u.id === current.id || u.username === current.username);
    if (idx !== -1) {
      users[idx].username = clean;
      clientStore.setUsers(users);
    }
    clientStore.logActivity(current.id, clean, 'USERNAME_UPDATE', `Username changed to ${clean}.`);
    return { message: 'Username updated successfully.', username: clean };
  },

  uploadProfilePicture: async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const dataUrl = reader.result;
          const current = await authService.getCurrentUser();
          if (current) {
            current.profilePictureUrl = dataUrl;
            
            // Save to Firestore
            if (isFirebaseConfigured && db) {
              try {
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('username', '==', (current.username || '').toLowerCase()));
                const snap = await getDocs(q);
                if (!snap.empty) {
                  await updateDoc(doc(db, 'users', snap.docs[0].id), { profilePictureUrl: dataUrl });
                  console.log('[Firebase] Profile picture saved in Firestore document.');
                }
              } catch (e) {
                console.warn('[Firebase] Failed to persist profile picture to Firestore:', e);
              }
            }

            const users = clientStore.getUsers();
            const idx = users.findIndex(u => u.id === current.id || u.username === current.username);
            if (idx !== -1) {
              users[idx].profilePictureUrl = dataUrl;
              clientStore.setUsers(users);
            }
          }
          resolve({ profilePictureUrl: dataUrl, profile_picture_url: dataUrl });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

};
