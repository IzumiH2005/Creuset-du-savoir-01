
// Fonctionnalités d'exportation et d'importation des données
import { getLocalStorageItem, setLocalStorageItem } from './utils';
import { getUser, setUser } from './userStorage';
import { getImage, getAudio, storeImage, storeAudio } from '../indexedDBStorage';
import { migrateBase64MediaToIndexedDB } from './mediaStorage';

// Structure des données exportées
interface ExportedData {
  version: string;
  timestamp: number;
  user?: Record<string, any>;
  decks?: Record<string, any>;
  flashcards?: Record<string, any>;
  themes?: Record<string, any>;
  studySessions?: Record<string, any>;
  shareCodes?: Record<string, any>;
  mediaIds?: string[];
}

/**
 * Exporte toutes les données de l'utilisateur
 */
export async function exportAllData(): Promise<ExportedData> {
  const user = getUser();
  const decks = getLocalStorageItem('decks') || {};
  const flashcards = getLocalStorageItem('flashcards') || {};
  const themes = getLocalStorageItem('themes') || {};
  const studySessions = getLocalStorageItem('studySessions') || {};
  const shareCodes = getLocalStorageItem('shareCodes') || {};
  
  // Collecter tous les IDs de médias pour les inclure
  const mediaIds: string[] = [];
  
  // À partir des decks
  Object.values(decks).forEach((deck: any) => {
    if (deck.coverImageId) mediaIds.push(deck.coverImageId);
  });
  
  // À partir des flashcards
  Object.values(flashcards).forEach((card: any) => {
    if (card.front?.imageId) mediaIds.push(card.front.imageId);
    if (card.front?.audioId) mediaIds.push(card.front.audioId);
    if (card.back?.imageId) mediaIds.push(card.back.imageId);
    if (card.back?.audioId) mediaIds.push(card.back.audioId);
  });
  
  // À partir des thèmes
  Object.values(themes).forEach((theme: any) => {
    if (theme.coverImageId) mediaIds.push(theme.coverImageId);
  });
  
  return {
    version: '1.0',
    timestamp: Date.now(),
    user: user ? { [user.id]: user } : {},
    decks,
    flashcards,
    themes,
    studySessions,
    shareCodes,
    mediaIds: [...new Set(mediaIds)] // Supprimer les doublons
  };
}

/**
 * Importe des données précédemment exportées
 */
export async function importAllData(data: ExportedData): Promise<boolean> {
  try {
    // Validation des données
    if (!data || !data.version || !data.timestamp) {
      console.error('Format de données invalide');
      return false;
    }
    
    // Importer les données utilisateur si présentes
    if (data.user && Object.keys(data.user).length > 0) {
      const userId = Object.keys(data.user)[0];
      const userData = data.user[userId];
      if (userData) {
        const users = getLocalStorageItem('users') || {};
        users[userId] = userData;
        setLocalStorageItem('users', users);
      }
    }
    
    // Importer les decks
    if (data.decks) {
      const currentDecks = getLocalStorageItem('decks') || {};
      setLocalStorageItem('decks', { ...currentDecks, ...data.decks });
    }
    
    // Importer les flashcards
    if (data.flashcards) {
      const currentFlashcards = getLocalStorageItem('flashcards') || {};
      setLocalStorageItem('flashcards', { ...currentFlashcards, ...data.flashcards });
    }
    
    // Importer les thèmes
    if (data.themes) {
      const currentThemes = getLocalStorageItem('themes') || {};
      setLocalStorageItem('themes', { ...currentThemes, ...data.themes });
    }
    
    // Importer les sessions d'étude
    if (data.studySessions) {
      const currentSessions = getLocalStorageItem('studySessions') || {};
      setLocalStorageItem('studySessions', { ...currentSessions, ...data.studySessions });
    }
    
    // Importer les codes de partage
    if (data.shareCodes) {
      const currentShareCodes = getLocalStorageItem('shareCodes') || {};
      setLocalStorageItem('shareCodes', { ...currentShareCodes, ...data.shareCodes });
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'importation des données:', error);
    return false;
  }
}
