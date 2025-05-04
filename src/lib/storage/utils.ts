
// Utility functions for storage manipulation

/**
 * Gets an item from localStorage and parses it as JSON
 */
export function getLocalStorageItem(key: string) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Erreur lors de la récupération de ${key} depuis localStorage:`, error);
    return null;
  }
}

/**
 * Sets an item in localStorage after stringifying it
 */
export function setLocalStorageItem(key: string, value: any): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Erreur lors de l'enregistrement de ${key} dans localStorage:`, error);
    return false;
  }
}

/**
 * Check if a string is a base64 data URL
 */
export const isBase64String = (str: string | undefined): boolean => {
  if (!str) return false;
  return str.startsWith('data:') && str.includes('base64,');
};

/**
 * Converts a File to base64 string
 */
export async function getBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}
