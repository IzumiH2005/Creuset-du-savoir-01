// User management functionality
import { User } from './types';
import { getLocalStorageItem, setLocalStorageItem } from './utils';
import { generateId } from './types';
import { blobToBase64, getImage } from '../indexedDBStorage';

/**
 * Create a new user account
 */
export function createUser(username: string, email: string, password: string): User {
  const users = getLocalStorageItem('users') || {};
  
  const id = generateId();
  const newUser: User = {
    id,
    username,
    email,
    password,
    createdAt: Date.now(),
    settings: {
      darkMode: false,
      notifications: true,
      soundEffects: true
    },
    bio: "",
    displayName: "",
  };
  
  users[id] = newUser;
  setLocalStorageItem('users', users);
  
  return newUser;
}

/**
 * Get the currently logged in user
 */
export function getUser(): User | null {
  const sessionId = getLocalStorageItem('sessionId');
  if (!sessionId) return null;
  
  const users = getLocalStorageItem('users') || {};
  const user = users[sessionId] || null;
  
  // Initialize default values for new fields if they don't exist
  if (user) {
    if (!user.settings) {
      user.settings = {
        darkMode: false,
        notifications: true,
        soundEffects: true
      };
    }
    if (user.bio === undefined) {
      user.bio = "";
    }
    if (user.displayName === undefined) {
      user.displayName = "";
    }
    
    // Charger l'avatar si présent
    if (user.avatarId) {
      loadUserAvatar(user);
    }
  }
  
  return user;
}

/**
 * Load user avatar from IndexedDB
 */
async function loadUserAvatar(user: User): Promise<void> {
  if (!user || !user.avatarId) return;
  
  try {
    const imageBlob = await getImage(user.avatarId);
    if (imageBlob) {
      user.avatar = await blobToBase64(imageBlob);
    }
  } catch (error) {
    console.error('Erreur lors du chargement de l\'avatar:', error);
  }
}

/**
 * Set a user and create a session
 */
export function setUser(user: User): void {
  const users = getLocalStorageItem('users') || {};
  users[user.id] = user;
  setLocalStorageItem('users', users);
  setLocalStorageItem('sessionId', user.id);
}

/**
 * Update user information
 */
export function updateUser(updates: User): User | null {
  const currentUser = getUser();
  if (!currentUser) return null;
  
  const users = getLocalStorageItem('users') || {};
  
  users[updates.id] = updates;
  setLocalStorageItem('users', users);
  
  return updates;
}

/**
 * Check if there is an active session
 */
export function hasSession(): boolean {
  const sessionId = getLocalStorageItem('sessionId');
  if (!sessionId) return false;
  
  const users = getLocalStorageItem('users') || {};
  return !!users[sessionId];
}

/**
 * Log in a user with email and password
 */
export function login(email: string, password: string): User | null {
  const users = getLocalStorageItem('users') || {};
  
  const user = Object.values(users).find(
    (u: any) => u.email === email && u.password === password
  ) as User | undefined;
  
  if (user) {
    setLocalStorageItem('sessionId', user.id);
    return user;
  }
  
  return null;
}

/**
 * Log out the current user
 */
export function logout(): boolean {
  localStorage.removeItem('sessionId');
  return true;
}
