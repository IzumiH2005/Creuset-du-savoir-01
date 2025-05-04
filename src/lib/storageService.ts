import {
  Deck,
  Flashcard,
  Theme,
  User,
  getUser as getLocalUser,
  getDeck as getLocalDeck,
  getDecks as getLocalDecks,
  createDeck as createLocalDeck,
  updateDeck as updateLocalDeck,
  deleteDeck as deleteLocalDeck,
  getFlashcards as getLocalFlashcards,
  getFlashcardsByDeck as getLocalFlashcardsByDeck,
  createFlashcard as createLocalFlashcard,
  updateFlashcard as updateLocalFlashcard,
  deleteFlashcard as deleteLocalFlashcard,
  getThemesByDeck as getLocalThemesByDeck,
  createTheme as createLocalTheme,
  updateTheme as updateLocalTheme,
  deleteTheme as deleteLocalTheme,
} from './localStorage';

import {
  isIndexedDBAvailable,
  migrateLocalStorageToIndexedDB,
  getAllDecks as getIndexedDBDecks,
  getDeck as getIndexedDBDeck,
  addDeck as addIndexedDBDeck,
  updateDeck as updateIndexedDBDeck,
  deleteDeck as deleteIndexedDBDeck,
  getFlashcardsByDeck as getIndexedDBFlashcardsByDeck,
  getFlashcard as getIndexedDBFlashcard,
  addFlashcard as addIndexedDBFlashcard,
  updateFlashcard as updateIndexedDBFlashcard,
  deleteFlashcard as deleteIndexedDBFlashcard,
  getThemesByDeck as getIndexedDBThemesByDeck,
  getTheme as getIndexedDBTheme,
  addTheme as addIndexedDBTheme,
  updateTheme as updateIndexedDBTheme,
  deleteTheme as deleteIndexedDBTheme,
} from './indexedDB';

// Variable pour stocker l'état d'initialisation de IndexedDB
let indexedDBInitialized = false;
let useIndexedDB = false;

// Fonction d'initialisation à appeler au démarrage de l'application
export const initStorage = async (): Promise<void> => {
  useIndexedDB = isIndexedDBAvailable();
  
  if (useIndexedDB && !indexedDBInitialized) {
    try {
      // Migrer les données de localStorage vers IndexedDB
      await migrateLocalStorageToIndexedDB();
      indexedDBInitialized = true;
      console.log('IndexedDB initialized and data migrated successfully');
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      useIndexedDB = false;
    }
  }
};

// Fonctions utilisateur (rester sur localStorage car données légères)
export const getUser = (): User | null => {
  return getLocalUser();
};

// Fonctions pour les decks (hybride)
export const getDecks = async (): Promise<Deck[]> => {
  if (useIndexedDB) {
    try {
      return await getIndexedDBDecks();
    } catch (error) {
      console.error('Error getting decks from IndexedDB, falling back to localStorage:', error);
    }
  }
  return getLocalDecks();
};

export const getDeck = async (id: string): Promise<Deck | null> => {
  if (useIndexedDB) {
    try {
      return await getIndexedDBDeck(id);
    } catch (error) {
      console.error('Error getting deck from IndexedDB, falling back to localStorage:', error);
    }
  }
  return getLocalDeck(id);
};

export const createDeck = async (deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deck> => {
  const now = Date.now();
  const newDeck: Deck = {
    ...deck,
    id: `deck_${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  
  if (useIndexedDB) {
    try {
      await addIndexedDBDeck(newDeck);
    } catch (error) {
      console.error('Error adding deck to IndexedDB, falling back to localStorage:', error);
      return createLocalDeck(deck);
    }
  } else {
    return createLocalDeck(deck);
  }
  
  return newDeck;
};

export const updateDeck = async (id: string, deckData: Partial<Deck>): Promise<Deck | null> => {
  const existingDeck = await getDeck(id);
  
  if (!existingDeck) {
    return null;
  }
  
  const updatedDeck: Deck = {
    ...existingDeck,
    ...deckData,
    updatedAt: Date.now(),
  };
  
  if (useIndexedDB) {
    try {
      await updateIndexedDBDeck(updatedDeck);
    } catch (error) {
      console.error('Error updating deck in IndexedDB, falling back to localStorage:', error);
      return updateLocalDeck(id, deckData);
    }
  } else {
    return updateLocalDeck(id, deckData);
  }
  
  return updatedDeck;
};

export const deleteDeck = async (id: string): Promise<boolean> => {
  if (useIndexedDB) {
    try {
      await deleteIndexedDBDeck(id);
      
      // Supprimer aussi les flashcards et thèmes associés
      const flashcards = await getFlashcardsByDeck(id);
      for (const flashcard of flashcards) {
        await deleteFlashcard(flashcard.id);
      }
      
      const themes = await getThemesByDeck(id);
      for (const theme of themes) {
        await deleteTheme(theme.id);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting deck from IndexedDB, falling back to localStorage:', error);
    }
  }
  
  return deleteLocalDeck(id);
};

// Fonctions pour les flashcards (hybride)
export const getFlashcardsByDeck = async (deckId: string): Promise<Flashcard[]> => {
  if (useIndexedDB) {
    try {
      return await getIndexedDBFlashcardsByDeck(deckId);
    } catch (error) {
      console.error('Error getting flashcards from IndexedDB, falling back to localStorage:', error);
    }
  }
  return getLocalFlashcardsByDeck(deckId);
};

export const createFlashcard = async (flashcard: Omit<Flashcard, 'id' | 'createdAt' | 'updatedAt'>): Promise<Flashcard> => {
  const now = Date.now();
  const newFlashcard: Flashcard = {
    ...flashcard,
    id: `card_${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  
  if (useIndexedDB) {
    try {
      await addIndexedDBFlashcard(newFlashcard);
    } catch (error) {
      console.error('Error adding flashcard to IndexedDB, falling back to localStorage:', error);
      return createLocalFlashcard(flashcard);
    }
  } else {
    return createLocalFlashcard(flashcard);
  }
  
  return newFlashcard;
};

export const updateFlashcard = async (id: string, cardData: Partial<Flashcard>): Promise<Flashcard | null> => {
  let existingCard: Flashcard | null = null;
  
  if (useIndexedDB) {
    try {
      existingCard = await getIndexedDBFlashcard(id);
    } catch (error) {
      console.error('Error getting flashcard from IndexedDB, falling back to localStorage:', error);
    }
  }
  
  if (!existingCard) {
    const flashcards = getLocalFlashcards();
    existingCard = flashcards.find(card => card.id === id) || null;
  }
  
  if (!existingCard) {
    return null;
  }
  
  const updatedCard: Flashcard = {
    ...existingCard,
    ...cardData,
    updatedAt: Date.now(),
  };
  
  if (useIndexedDB) {
    try {
      await updateIndexedDBFlashcard(updatedCard);
    } catch (error) {
      console.error('Error updating flashcard in IndexedDB, falling back to localStorage:', error);
      return updateLocalFlashcard(id, cardData);
    }
  } else {
    return updateLocalFlashcard(id, cardData);
  }
  
  return updatedCard;
};

export const deleteFlashcard = async (id: string): Promise<boolean> => {
  if (useIndexedDB) {
    try {
      await deleteIndexedDBFlashcard(id);
      return true;
    } catch (error) {
      console.error('Error deleting flashcard from IndexedDB, falling back to localStorage:', error);
    }
  }
  
  return deleteLocalFlashcard(id);
};

// Fonctions pour les thèmes (hybride)
export const getThemesByDeck = async (deckId: string): Promise<Theme[]> => {
  if (useIndexedDB) {
    try {
      return await getIndexedDBThemesByDeck(deckId);
    } catch (error) {
      console.error('Error getting themes from IndexedDB, falling back to localStorage:', error);
    }
  }
  return getLocalThemesByDeck(deckId);
};

export const createTheme = async (theme: Omit<Theme, 'id' | 'createdAt' | 'updatedAt'>): Promise<Theme> => {
  const now = Date.now();
  const newTheme: Theme = {
    ...theme,
    id: `theme_${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  
  if (useIndexedDB) {
    try {
      await addIndexedDBTheme(newTheme);
    } catch (error) {
      console.error('Error adding theme to IndexedDB, falling back to localStorage:', error);
      return createLocalTheme(theme);
    }
  } else {
    return createLocalTheme(theme);
  }
  
  return newTheme;
};

export const updateTheme = async (id: string, themeData: Partial<Theme>): Promise<Theme | null> => {
  let existingTheme: Theme | null = null;
  
  if (useIndexedDB) {
    try {
      existingTheme = await getIndexedDBTheme(id);
    } catch (error) {
      console.error('Error getting theme from IndexedDB, falling back to localStorage:', error);
    }
  }
  
  if (!existingTheme) {
    const localTheme = getLocalThemesByDeck('');
    existingTheme = localTheme.find(t => t.id === id) || null;
  }
  
  if (!existingTheme) {
    return null;
  }
  
  const updatedTheme: Theme = {
    ...existingTheme,
    ...themeData,
    updatedAt: Date.now(),
  };
  
  if (useIndexedDB) {
    try {
      await updateIndexedDBTheme(updatedTheme);
    } catch (error) {
      console.error('Error updating theme in IndexedDB, falling back to localStorage:', error);
      return updateLocalTheme(id, themeData);
    }
  } else {
    return updateLocalTheme(id, themeData);
  }
  
  return updatedTheme;
};

export const deleteTheme = async (id: string): Promise<boolean> => {
  if (useIndexedDB) {
    try {
      await deleteIndexedDBTheme(id);
      return true;
    } catch (error) {
      console.error('Error deleting theme from IndexedDB, falling back to localStorage:', error);
    }
  }
  
  return deleteLocalTheme(id);
};
