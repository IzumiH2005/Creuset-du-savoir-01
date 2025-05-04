
// Theme management functionality
import { Theme, generateId } from './types';
import { getLocalStorageItem, setLocalStorageItem, isBase64String } from './utils';
import { 
  storeImage, 
  deleteImage, 
  getImage, 
  blobToBase64, 
  base64ToBlob, 
  generateMediaId 
} from '../indexedDBStorage';

/**
 * Create a new theme
 */
export function createTheme(themeData: Partial<Theme> & { deckId: string }): Theme {
  const themes = getLocalStorageItem('themes') || {};
  
  const id = generateId();
  const timestamp = Date.now();
  
  const newTheme: Theme = {
    id,
    deckId: themeData.deckId,
    title: themeData.title || "Nouveau thème",
    description: themeData.description || "",
    coverImage: themeData.coverImage,
    coverImageId: themeData.coverImageId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  
  // Traiter l'image de couverture si présente
  if (isBase64String(newTheme.coverImage)) {
    // Traitement asynchrone
    (async () => {
      try {
        const coverImageId = generateMediaId('img');
        const contentType = newTheme.coverImage!.split(';')[0].split(':')[1];
        const imageBlob = base64ToBlob(newTheme.coverImage!, contentType);
        const success = await storeImage(coverImageId, imageBlob);
        
        if (success) {
          newTheme.coverImageId = coverImageId;
          // Mettre à jour le thème dans localStorage
          themes[id] = { ...newTheme };
          setLocalStorageItem('themes', themes);
        }
      } catch (error) {
        console.error('Erreur lors du traitement de l\'image de couverture:', error);
      }
    })();
  }
  
  themes[id] = newTheme;
  setLocalStorageItem('themes', themes);
  
  return newTheme;
}

/**
 * Get a theme by ID
 */
export function getTheme(themeId: string): Theme | null {
  const themes = getLocalStorageItem('themes') || {};
  const theme = themes[themeId];
  
  if (theme && theme.coverImageId) {
    // Charger l'image de couverture depuis IndexedDB de manière asynchrone
    (async () => {
      try {
        const imageBlob = await getImage(theme.coverImageId);
        if (imageBlob) {
          const base64 = await blobToBase64(imageBlob);
          theme.coverImage = base64;
          // Mettre à jour le rendu sans modifier le localStorage
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'image de couverture:', error);
      }
    })();
  }
  
  return theme || null;
}

/**
 * Get all themes
 */
export function getThemes(): Theme[] {
  const themes = getLocalStorageItem('themes') || {};
  return Object.values(themes) as Theme[];
}

/**
 * Get themes by deck ID
 */
export function getThemesByDeck(deckId: string): Theme[] {
  const themes = getLocalStorageItem('themes') || {};
  return (Object.values(themes) as Theme[]).filter((theme: Theme) => theme.deckId === deckId);
}

/**
 * Update a theme
 */
export function updateTheme(themeId: string, updates: Partial<Theme>): Theme | null {
  const themes = getLocalStorageItem('themes') || {};
  const theme = themes[themeId];
  
  if (!theme) return null;
  
  // Traiter l'image de couverture si présente et modifiée
  if (isBase64String(updates.coverImage) && updates.coverImage !== theme.coverImage) {
    // Traitement asynchrone
    (async () => {
      try {
        // Supprimer l'ancienne image si elle existe
        if (theme.coverImageId) {
          await deleteImage(theme.coverImageId);
        }
        
        const coverImageId = generateMediaId('img');
        const contentType = updates.coverImage!.split(';')[0].split(':')[1];
        const imageBlob = base64ToBlob(updates.coverImage!, contentType);
        const success = await storeImage(coverImageId, imageBlob);
        
        if (success) {
          // Mettre à jour le thème avec la nouvelle référence
          theme.coverImageId = coverImageId;
          theme.coverImage = updates.coverImage;
          theme.updatedAt = Date.now();
          themes[themeId] = { ...theme };
          setLocalStorageItem('themes', themes);
        }
      } catch (error) {
        console.error('Erreur lors du traitement de l\'image de couverture:', error);
      }
    })();
    
    // Ne pas inclure coverImage dans l'objet updates pour éviter la duplication
    delete updates.coverImage;
  }
  
  const updatedTheme = {
    ...theme,
    ...updates,
    updatedAt: Date.now()
  };
  
  themes[themeId] = updatedTheme;
  setLocalStorageItem('themes', themes);
  
  return updatedTheme;
}

/**
 * Delete a theme
 */
export function deleteTheme(themeId: string): boolean {
  const themes = getLocalStorageItem('themes') || {};
  const theme = themes[themeId];
  
  if (!theme) return false;
  
  // Suppression de l'image de couverture si elle existe
  if (theme.coverImageId) {
    deleteImage(theme.coverImageId).catch(error => {
      console.error('Erreur lors de la suppression de l\'image de couverture:', error);
    });
  }
  
  delete themes[themeId];
  setLocalStorageItem('themes', themes);
  
  return true;
}
