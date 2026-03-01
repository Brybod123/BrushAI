import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, orderBy, limit, where } from 'firebase/firestore';

// Firebase configuration - replace with your config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo_key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo_project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'demo_app_id'
};

// Check if we have real Firebase config
const isDemoMode = !import.meta.env.VITE_FIREBASE_API_KEY || 
                   import.meta.env.VITE_FIREBASE_API_KEY === 'your_firebase_api_key_here';

// Initialize Firebase
let app: any;
let auth: any;
let db: any;

if (!isDemoMode) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.warn('Firebase initialization failed, running in demo mode:', error);
  }
}

// Authentication functions
export const signInWithGoogle = async () => {
  if (isDemoMode || !auth) {
    console.warn('Demo mode: Sign in not available');
    return null;
  }
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const signOutUser = async () => {
  if (isDemoMode || !auth) {
    console.warn('Demo mode: Sign out not available');
    return;
  }
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const getCurrentUser = (): User | null => {
  if (isDemoMode || !auth) {
    return null;
  }
  return auth.currentUser;
};

// Firestore functions
export const createProject = async (projectData: any) => {
  if (isDemoMode || !db) {
    console.warn('Demo mode: Project creation not available');
    return 'demo-project-id';
  }
  try {
    const docRef = await addDoc(collection(db, 'projects'), {
      ...projectData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

export const getProjects = async (userId?: string) => {
  if (isDemoMode || !db) {
    console.warn('Demo mode: Returning sample projects');
    return [
      {
        id: 'demo-1',
        name: 'Sample Project 1',
        author: 'Demo User',
        description: 'This is a sample project in demo mode.',
        userId: 'demo',
        createdAt: new Date()
      },
      {
        id: 'demo-2',
        name: 'Sample Project 2',
        author: 'Demo User',
        description: 'Another sample project for demonstration.',
        userId: 'demo',
        createdAt: new Date()
      }
    ];
  }
  try {
    const projectsRef = collection(db, 'projects');
    let q;
    
    if (userId) {
      q = query(projectsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    } else {
      q = query(projectsRef, orderBy('createdAt', 'desc'), limit(10));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting projects:', error);
    throw error;
  }
};

export const updateProject = async (projectId: string, projectData: any) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      ...projectData,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

export const deleteProject = async (projectId: string) => {
  try {
    await deleteDoc(doc(db, 'projects', projectId));
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

// User profile functions
export const createUserProfile = async (userId: string, userData: any) => {
  if (isDemoMode || !db) {
    console.warn('Demo mode: User profile creation not available');
    return 'demo-profile-id';
  }
  try {
    const docRef = await addDoc(collection(db, 'users'), {
      userId,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (userId: string) => {
  if (isDemoMode || !db) {
    console.warn('Demo mode: Returning demo user profile');
    return {
      id: 'demo-profile',
      userId,
      username: 'Demo User',
      followers: 10,
      views: 5097
    };
  }
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    return {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data()
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export { auth, db };
