
// Legacy file that re-exports the modular storage API for backward compatibility
// This allows existing code to keep using imports from localStorage.ts

import * as Storage from './storage';
import { User } from './storage/types';
import { getUser, updateUser } from './storage/userStorage';
import { hasSession, clearSessionKey } from './sessionManager';

// Re-export everything from the modular storage system
export * from './storage';

// Generate sample data on first load
Storage.generateSampleData();

// Profile management functions
export function getProfile(): User | null {
  const user = getUser();
  
  // Ensure user has all required fields for profile display
  if (user) {
    if (!user.settings) {
      user.settings = {
        darkMode: false,
        notifications: true,
        soundEffects: true
      };
    }
    if (!user.bio) {
      user.bio = "";
    }
    if (!user.displayName) {
      user.displayName = "";
    }
  }
  
  return user;
}

export function updateProfile(user: Partial<User> & { id: string }): User | null {
  const currentUser = getUser();
  if (!currentUser) return null;
  
  // Preserve required fields that might not be included in the update
  const updatedUser: User = {
    ...currentUser,
    ...user,
    password: currentUser.password,
    createdAt: currentUser.createdAt
  };
  
  return updateUser(updatedUser);
}

export function resetUserData() {
  // Clear user-related data
  localStorage.removeItem('users');
  localStorage.removeItem('sessionId');
  localStorage.removeItem('decks');
  localStorage.removeItem('flashcards');
  localStorage.removeItem('themes');
  return true;
}

// Export logout function for backward compatibility
export function logout() {
  return clearSessionKey();
}
