import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';
import { getDatabase, ref, push, set, remove, get } from 'firebase/database';

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
let database: any;

if (!isDemoMode) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    database = getDatabase(app);
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

// Realtime Database functions
export const createProject = async (projectData: any) => {
  console.log('🔥 Starting Firebase project creation:', { name: projectData.name, userId: projectData.userId });
  
  if (isDemoMode || !database) {
    console.warn('⚠️ Demo mode: Project creation not available');
    return 'demo-project-id';
  }
  try {
    console.log('📝 Creating Firebase reference...');
    const projectsRef = ref(database, 'projects');
    const newProjectRef = push(projectsRef);
    console.log('🆔 Generated project key:', newProjectRef.key);
    
    const projectToSave = {
      ...projectData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('💾 Saving project to Firebase:', projectToSave);
    await set(newProjectRef, projectToSave);
    console.log('✅ Project successfully saved to Firebase');
    
    return newProjectRef.key;
  } catch (error) {
    console.error('❌ Error creating project:', error);
    console.error('🔍 Error details:', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack
    });
    throw error;
  }
};

export const getProjects = async (userId?: string) => {
  if (isDemoMode || !database) {
    console.warn('Demo mode: Returning sample projects');
    return [
      {
        id: 'demo-1',
        name: 'Sample Project 1',
        author: 'Demo User',
        description: 'This is a sample project in demo mode.',
        userId: 'demo',
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo-2',
        name: 'Sample Project 2',
        author: 'Demo User',
        description: 'Another sample project for demonstration.',
        userId: 'demo',
        createdAt: new Date().toISOString()
      }
    ];
  }
  try {
    const projectsRef = ref(database, 'projects');
    let queryRef = projectsRef;
    
    if (userId) {
      // For user-specific projects, we'll filter on the client side
      // since Realtime Database doesn't have complex queries like Firestore
    }
    
    const snapshot = await get(queryRef);
    const projects: any[] = [];
    
    snapshot.forEach((childSnapshot) => {
      const project = {
        id: childSnapshot.key,
        ...childSnapshot.val()
      };
      
      // Filter by userId if specified
      if (!userId || project.userId === userId) {
        projects.push(project);
      }
    });
    
    // Sort by createdAt (newest first)
    return projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error getting projects:', error);
    throw error;
  }
};

export const updateProject = async (projectId: string, projectData: any) => {
  if (isDemoMode || !database) {
    console.warn('Demo mode: Project update not available');
    return;
  }
  try {
    const projectRef = ref(database, `projects/${projectId}`);
    await set(projectRef, {
      ...projectData,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

export const deleteProject = async (projectId: string) => {
  if (isDemoMode || !database) {
    console.warn('Demo mode: Project deletion not available');
    return;
  }
  try {
    const projectRef = ref(database, `projects/${projectId}`);
    await remove(projectRef);
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

// User profile functions (using Realtime Database)
export const createUserProfile = async (userId: string, userData: any) => {
  if (isDemoMode || !database) {
    console.warn('Demo mode: User profile creation not available');
    return 'demo-profile-id';
  }
  try {
    const userRef = ref(database, `users/${userId}`);
    await set(userRef, {
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return userId;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (userId: string) => {
  if (isDemoMode || !database) {
    console.warn('Demo mode: Returning demo user profile');
    return {
      id: userId,
      userId,
      username: 'Demo User',
      followers: 10,
      views: 5097
    };
  }
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      return {
        id: userId,
        ...snapshot.val()
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId: string, userData: any) => {
  if (isDemoMode || !database) {
    console.warn('Demo mode: User profile update not available');
    return;
  }
  try {
    const userRef = ref(database, `users/${userId}`);
    await set(userRef, {
      ...userData,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export { auth, database };
