import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCxLT2cWnSfiUHK63kxNEsxjW_yXAjy-N8",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "synaptech-ai.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "synaptech-ai",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "synaptech-ai.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "567388738603",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:567388738603:web:d870691371d64d785c866e"
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'YOUR_API_KEY'
);

let app = null;
let auth = null;
let db = null;
let ai = null;
let geminiModel = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('[Firebase] Successfully connected to Cloud Firestore project:', firebaseConfig.projectId);

    // Initialize Firebase AI Logic (Gemini Developer API)
    try {
      ai = getAI(app, { backend: new GoogleAIBackend() });
      geminiModel = getGenerativeModel(ai, {
        model: 'gemini-flash-latest',
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
        }
      });
      console.log('[Firebase] AI Logic initialized successfully with model gemini-flash-latest');
    } catch (aiErr) {
      console.warn('[Firebase] AI Logic initialization warning:', aiErr);
    }
  } catch (err) {
    console.warn('[Firebase] Initialization error, falling back to client cloud store:', err);
  }
} else {
  console.info('[Firebase] Firebase project credentials not set. Operating in resilient Client Store mode.');
}

export { app, auth, db, ai, geminiModel };
export default firebaseConfig;
