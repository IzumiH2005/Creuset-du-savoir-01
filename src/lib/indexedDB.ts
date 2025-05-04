import { 
  Deck, 
  Flashcard, 
  Theme,
  getThemes
} from './localStorage';

// Définition des constantes pour les stores IndexedDB
const DB_NAME = 'cds-flashcard-db';
const DB_VERSION = 1;
const STORES = {
  DECKS: 'decks',
  FLASHCARDS: 'flashcards',
  THEMES: 'themes',
  USERS: 'users',
  MEDIA: 'media' // Nouveau store pour les médias (images, audio, etc.)
};

// Configuration pour augmenter la capacité de stockage (en octets)
const DEFAULT_QUOTA = 100 * 1024 * 1024; // 100 MB par défaut

// Fonction pour demander plus d'espace de stockage si disponible
const requestStorageQuota = async () => {
  if (navigator.storage && navigator.storage.persist) {
    const isPersisted = await navigator.storage.persist();
    console.log(`Le stockage persistant est ${isPersisted ? 'activé' : 'non activé'}`);
    
    if (navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      console.log(`Utilisation du stockage: ${Math.round(estimate.usage / 1024 / 1024)}MB sur ${Math.round(estimate.quota / 1024 / 1024)}MB`);
    }
  }
};

// Initialisation de la base de données
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error("Erreur d'ouverture de la base IndexedDB:", event);
      reject("Impossible d'ouvrir la base IndexedDB");
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Création des object stores si nécessaire
      if (!db.objectStoreNames.contains(STORES.DECKS)) {
        db.createObjectStore(STORES.DECKS, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.FLASHCARDS)) {
        db.createObjectStore(STORES.FLASHCARDS, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.THEMES)) {
        db.createObjectStore(STORES.THEMES, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.USERS)) {
        db.createObjectStore(STORES.USERS, { keyPath: 'id' });
      }
      
      // Nouveau store pour les médias avec un index pour les recherches rapides
      if (!db.objectStoreNames.contains(STORES.MEDIA)) {
        const mediaStore = db.createObjectStore(STORES.MEDIA, { keyPath: 'id' });
        mediaStore.createIndex('type', 'type', { unique: false });
        mediaStore.createIndex('relatedId', 'relatedId', { unique: false });
      }
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      // Demander plus d'espace de stockage si possible
      requestStorageQuota().catch(console.error);
      resolve(db);
    };
  });
};

// Structure pour les médias
export interface MediaItem {
  id: string;
  type: 'image' | 'audio' | 'video';
  data: Blob | string; // URL ou données binaires
  relatedId?: string; // ID du deck ou de la flashcard associée
  createdAt: string;
}

// Fonction générique pour ajouter un élément
export const addItem = async <T>(storeName: string, item: T): Promise<T> => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(item);
    
    request.onerror = (event) => {
      console.error(`Erreur lors de l'ajout à ${storeName}:`, event);
      reject(`Échec de l'ajout à ${storeName}`);
    };
    
    request.onsuccess = () => {
      resolve(item);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// Fonction générique pour mettre à jour un élément
export const updateItem = async <T>(storeName: string, item: T): Promise<T> => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);
    
    request.onerror = (event) => {
      console.error(`Erreur lors de la mise à jour dans ${storeName}:`, event);
      reject(`Échec de la mise à jour dans ${storeName}`);
    };
    
    request.onsuccess = () => {
      resolve(item);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// Fonction générique pour récupérer un élément par ID
export const getItemById = async <T>(storeName: string, id: string): Promise<T | null> => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);
    
    request.onerror = (event) => {
      console.error(`Erreur lors de la récupération depuis ${storeName}:`, event);
      reject(`Échec de la récupération depuis ${storeName}`);
    };
    
    request.onsuccess = () => {
      resolve(request.result || null);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// Fonction générique pour récupérer tous les éléments
export const getAllItems = async <T>(storeName: string): Promise<T[]> => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onerror = (event) => {
      console.error(`Erreur lors de la récupération de tous les éléments depuis ${storeName}:`, event);
      reject(`Échec de la récupération de tous les éléments depuis ${storeName}`);
    };
    
    request.onsuccess = () => {
      resolve(request.result || []);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// Fonction générique pour supprimer un élément
export const deleteItem = async (storeName: string, id: string): Promise<boolean> => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    
    request.onerror = (event) => {
      console.error(`Erreur lors de la suppression depuis ${storeName}:`, event);
      reject(`Échec de la suppression depuis ${storeName}`);
    };
    
    request.onsuccess = () => {
      resolve(true);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// Fonctions spécifiques pour les decks
export const addDeck = (deck: Deck): Promise<Deck> => {
  return addItem<Deck>(STORES.DECKS, deck);
};

export const updateDeck = (deck: Deck): Promise<Deck> => {
  return updateItem<Deck>(STORES.DECKS, deck);
};

export const getDeck = (id: string): Promise<Deck | null> => {
  return getItemById<Deck>(STORES.DECKS, id);
};

export const getAllDecks = (): Promise<Deck[]> => {
  return getAllItems<Deck>(STORES.DECKS);
};

export const deleteDeck = (id: string): Promise<boolean> => {
  return deleteItem(STORES.DECKS, id);
};

// Fonctions spécifiques pour les flashcards
export const addFlashcard = (flashcard: Flashcard): Promise<Flashcard> => {
  return addItem<Flashcard>(STORES.FLASHCARDS, flashcard);
};

export const updateFlashcard = (flashcard: Flashcard): Promise<Flashcard> => {
  return updateItem<Flashcard>(STORES.FLASHCARDS, flashcard);
};

export const getFlashcard = (id: string): Promise<Flashcard | null> => {
  return getItemById<Flashcard>(STORES.FLASHCARDS, id);
};

export const getFlashcardsByDeck = async (deckId: string): Promise<Flashcard[]> => {
  const allFlashcards = await getAllItems<Flashcard>(STORES.FLASHCARDS);
  return allFlashcards.filter(card => card.deckId === deckId);
};

export const getFlashcardsByTheme = async (themeId: string): Promise<Flashcard[]> => {
  const allFlashcards = await getAllItems<Flashcard>(STORES.FLASHCARDS);
  return allFlashcards.filter(card => card.themeId === themeId);
};

export const deleteFlashcard = (id: string): Promise<boolean> => {
  return deleteItem(STORES.FLASHCARDS, id);
};

// Fonctions spécifiques pour les themes
export const addTheme = (theme: Theme): Promise<Theme> => {
  return addItem<Theme>(STORES.THEMES, theme);
};

export const updateTheme = (theme: Theme): Promise<Theme> => {
  return updateItem<Theme>(STORES.THEMES, theme);
};

export const getTheme = (id: string): Promise<Theme | null> => {
  return getItemById<Theme>(STORES.THEMES, id);
};

export const getAllThemes = (): Promise<Theme[]> => {
  return getAllItems<Theme>(STORES.THEMES);
};

export const getThemesByDeck = async (deckId: string): Promise<Theme[]> => {
  const allThemes = await getAllItems<Theme>(STORES.THEMES);
  return allThemes.filter(theme => theme.deckId === deckId);
};

export const deleteTheme = (id: string): Promise<boolean> => {
  return deleteItem(STORES.THEMES, id);
};

// Fonctions spécifiques pour les médias
export const addMedia = (media: MediaItem): Promise<MediaItem> => {
  return addItem<MediaItem>(STORES.MEDIA, media);
};

export const updateMedia = (media: MediaItem): Promise<MediaItem> => {
  return updateItem<MediaItem>(STORES.MEDIA, media);
};

export const getMedia = (id: string): Promise<MediaItem | null> => {
  return getItemById<MediaItem>(STORES.MEDIA, id);
};

export const getAllMedia = (): Promise<MediaItem[]> => {
  return getAllItems<MediaItem>(STORES.MEDIA);
};

export const getMediaByType = async (type: 'image' | 'audio' | 'video'): Promise<MediaItem[]> => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.MEDIA, 'readonly');
    const store = transaction.objectStore(STORES.MEDIA);
    const index = store.index('type');
    const request = index.getAll(type);
    
    request.onerror = (event) => {
      console.error(`Erreur lors de la récupération des médias de type ${type}:`, event);
      reject(`Échec de la récupération des médias de type ${type}`);
    };
    
    request.onsuccess = () => {
      resolve(request.result || []);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
};

export const getMediaByRelatedId = async (relatedId: string): Promise<MediaItem[]> => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.MEDIA, 'readonly');
    const store = transaction.objectStore(STORES.MEDIA);
    const index = store.index('relatedId');
    const request = index.getAll(relatedId);
    
    request.onerror = (event) => {
      console.error(`Erreur lors de la récupération des médias associés à ${relatedId}:`, event);
      reject(`Échec de la récupération des médias associés à ${relatedId}`);
    };
    
    request.onsuccess = () => {
      resolve(request.result || []);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
};

export const deleteMedia = (id: string): Promise<boolean> => {
  return deleteItem(STORES.MEDIA, id);
};

// Fonction améliorée pour la migration des données
export const migrateLocalStorageToIndexedDB = async (): Promise<boolean> => {
  try {
    // Importer les fonctions de localStorage
    const { getDecks, getFlashcards } = await import('./localStorage');
    
    // Récupérer toutes les données de localStorage
    const decks = getDecks();
    const flashcards = getFlashcards();
    const themes = getThemes(); // Utilisation de la fonction getThemes maintenant disponible
    
    console.log(`Migration: ${decks.length} decks, ${flashcards.length} flashcards, ${themes.length} thèmes`);
    
    // Stocker les decks dans IndexedDB
    for (const deck of decks) {
      await addDeck(deck);
    }
    
    // Stocker les flashcards dans IndexedDB
    for (const flashcard of flashcards) {
      await addFlashcard(flashcard);
    }
    
    // Stocker les themes dans IndexedDB
    for (const theme of themes) {
      await addTheme(theme);
    }
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la migration des données:", error);
    return false;
  }
};

// Vérifier la capacité de stockage disponible
export const checkStorageCapacity = async (): Promise<{ usage: number, quota: number, percentUsed: number }> => {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || DEFAULT_QUOTA;
    const percentUsed = Math.round((usage / quota) * 100);
    
    return { usage, quota, percentUsed };
  }
  
  return { usage: 0, quota: DEFAULT_QUOTA, percentUsed: 0 };
};

// Fonction pour vérifier si l'IndexedDB est disponible
export const isIndexedDBAvailable = (): boolean => {
  return window.indexedDB !== undefined && window.indexedDB !== null;
};

// Fonction pour nettoyer les données obsolètes
export const cleanupOldData = async (): Promise<number> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString();
    
    // Récupérer les vieux média non utilisés
    const allMedia = await getAllMedia();
    const oldMediaCount = allMedia.filter(media => media.createdAt < cutoffDate).length;
    
    // Suppression pourrait être implémentée ici si nécessaire
    
    return oldMediaCount;
  } catch (error) {
    console.error("Erreur lors du nettoyage des données:", error);
    return 0;
  }
};
