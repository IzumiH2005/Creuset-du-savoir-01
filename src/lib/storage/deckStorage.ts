
// Deck management functionality
import { Deck, generateId, SharedDeckExport } from './types';
import { getLocalStorageItem, setLocalStorageItem, isBase64String } from './utils';
import { getUser } from './userStorage';
import { getFlashcardsByDeck } from './flashcardStorage';
import { getThemesByDeck, deleteTheme } from './themeStorage';
import { 
  storeImage, 
  deleteImage, 
  getImage, 
  blobToBase64, 
  base64ToBlob, 
  generateMediaId 
} from '../indexedDBStorage';
import { deleteFlashcard } from './flashcardStorage';

/**
 * Create a new deck
 */
export function createDeck(deckData: Partial<Deck>): Deck {
  const decks = getLocalStorageItem('decks') || {};
  const currentUser = getUser();
  
  if (!currentUser) throw new Error("User not authenticated");
  
  const id = generateId();
  const timestamp = Date.now();
  
  const newDeck: Deck = {
    id,
    title: deckData.title || "Nouveau deck",
    description: deckData.description || "",
    coverImage: deckData.coverImage,
    coverImageId: deckData.coverImageId,
    tags: deckData.tags || [],
    authorId: currentUser.id,
    authorName: currentUser.username,
    isPublic: deckData.isPublic || false,
    createdAt: timestamp,
    updatedAt: timestamp,
    isShared: deckData.isShared || false,
    originalId: deckData.originalId,
    isPublished: deckData.isPublished || false,
  };
  
  // Traiter l'image de couverture si présente
  if (isBase64String(newDeck.coverImage)) {
    // Traitement asynchrone
    (async () => {
      try {
        const coverImageId = generateMediaId('img');
        const contentType = newDeck.coverImage!.split(';')[0].split(':')[1];
        const imageBlob = base64ToBlob(newDeck.coverImage!, contentType);
        const success = await storeImage(coverImageId, imageBlob);
        
        if (success) {
          newDeck.coverImageId = coverImageId;
          // Mettre à jour le deck dans localStorage
          decks[id] = { ...newDeck };
          setLocalStorageItem('decks', decks);
        }
      } catch (error) {
        console.error('Erreur lors du traitement de l\'image de couverture:', error);
      }
    })();
  }
  
  decks[id] = newDeck;
  setLocalStorageItem('decks', decks);
  
  return newDeck;
}

/**
 * Get a deck by ID
 */
export function getDeck(deckId: string): Deck | null {
  const decks = getLocalStorageItem('decks') || {};
  const deck = decks[deckId];
  
  if (deck && deck.coverImageId) {
    // Charger l'image de couverture depuis IndexedDB de manière asynchrone
    (async () => {
      try {
        const imageBlob = await getImage(deck.coverImageId);
        if (imageBlob) {
          const base64 = await blobToBase64(imageBlob);
          deck.coverImage = base64;
          // Mettre à jour le rendu sans modifier le localStorage
          // (l'image sera chargée à nouveau lors du prochain chargement)
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'image de couverture:', error);
      }
    })();
  }
  
  return deck || null;
}

/**
 * Get all decks
 */
export function getDecks(): Deck[] {
  const decks = getLocalStorageItem('decks') || {};
  return Object.values(decks) as Deck[];
}

/**
 * Get decks by user ID
 */
export function getDecksByUser(userId: string): Deck[] {
  const decks = getLocalStorageItem('decks') || {};
  return (Object.values(decks) as Deck[]).filter((deck: Deck) => deck.authorId === userId);
}

/**
 * Update a deck
 */
export function updateDeck(deckId: string, updates: Partial<Deck>): Deck | null {
  const decks = getLocalStorageItem('decks') || {};
  const deck = decks[deckId];
  
  if (!deck) return null;
  
  // Traiter l'image de couverture si présente et modifiée
  if (isBase64String(updates.coverImage) && updates.coverImage !== deck.coverImage) {
    // Traitement asynchrone
    (async () => {
      try {
        // Supprimer l'ancienne image si elle existe
        if (deck.coverImageId) {
          await deleteImage(deck.coverImageId);
        }
        
        const coverImageId = generateMediaId('img');
        const contentType = updates.coverImage!.split(';')[0].split(':')[1];
        const imageBlob = base64ToBlob(updates.coverImage!, contentType);
        const success = await storeImage(coverImageId, imageBlob);
        
        if (success) {
          // Mettre à jour le deck avec la nouvelle référence
          deck.coverImageId = coverImageId;
          deck.coverImage = updates.coverImage;
          deck.updatedAt = Date.now();
          decks[deckId] = { ...deck };
          setLocalStorageItem('decks', decks);
        }
      } catch (error) {
        console.error('Erreur lors du traitement de l\'image de couverture:', error);
      }
    })();
    
    // Ne pas inclure coverImage dans l'objet updates pour éviter la duplication
    delete updates.coverImage;
  }
  
  const updatedDeck = {
    ...deck,
    ...updates,
    updatedAt: Date.now()
  };
  
  decks[deckId] = updatedDeck;
  setLocalStorageItem('decks', decks);
  
  return updatedDeck;
}

/**
 * Delete a deck and all associated data
 */
export function deleteDeck(deckId: string): boolean {
  const decks = getLocalStorageItem('decks') || {};
  const deck = decks[deckId];
  
  if (!deck) return false;
  
  // Suppression des médias associés à ce deck
  (async () => {
    try {
      // Supprimer l'image de couverture si elle existe
      if (deck.coverImageId) {
        await deleteImage(deck.coverImageId);
      }
      
      // Supprimer les médias de toutes les flashcards de ce deck
      const flashcards = getFlashcardsByDeck(deckId);
      for (const card of flashcards) {
        deleteFlashcard(card.id);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression des médias:', error);
    }
  })();
  
  // Supprimer également tous les thèmes associés à ce deck
  const themes = getThemesByDeck(deckId);
  themes.forEach(theme => {
    deleteTheme(theme.id);
  });
  
  delete decks[deckId];
  setLocalStorageItem('decks', decks);
  
  return true;
}

/**
 * Create a share code for a deck
 */
export function createShareCode(deckId: string, expiryDays: number = 7): string {
  const deck = getDeck(deckId);
  if (!deck) throw new Error(`Deck not found: ${deckId}`);
  
  // Création simple d'un code de partage (dans une vraie app, un système plus sécurisé serait utilisé)
  const code = `share_${deckId}_${Date.now()}_${expiryDays}`;
  
  // Stocker le code dans localStorage avec sa date d'expiration
  const shareCodes = getLocalStorageItem('shareCodes') || {};
  shareCodes[code] = {
    deckId,
    expiryDate: Date.now() + (expiryDays * 24 * 60 * 60 * 1000)
  };
  setLocalStorageItem('shareCodes', shareCodes);
  
  return code;
}

/**
 * Get a shared deck by share code
 */
export function getSharedDeck(code: string): Deck | null {
  const shareCodes = getLocalStorageItem('shareCodes') || {};
  const shareInfo = shareCodes[code] as { deckId: string; expiryDate: number } | undefined;
  
  if (!shareInfo) return null;
  
  // Vérifier si le code a expiré
  if (shareInfo.expiryDate < Date.now()) {
    // Suppression du code expiré
    delete shareCodes[code];
    setLocalStorageItem('shareCodes', shareCodes);
    return null;
  }
  
  // Récupérer le deck
  return getDeck(shareInfo.deckId);
}

/**
 * Publish a deck
 */
export function publishDeck(deckId: string): boolean {
  const deck = getDeck(deckId);
  if (!deck) return false;
  
  updateDeck(deckId, { 
    isPublic: true,
    isPublished: true
  });
  
  return true;
}

/**
 * Unpublish a deck
 */
export function unpublishDeck(deckId: string): boolean {
  const deck = getDeck(deckId);
  if (!deck) return false;
  
  updateDeck(deckId, { 
    isPublic: false,
    isPublished: false
  });
  
  return true;
}

/**
 * Update a published deck
 */
export function updatePublishedDeck(deckId: string): boolean {
  const deck = getDeck(deckId);
  if (!deck) return false;
  
  // Dans une vraie app, cela pourrait propager les mises à jour vers un serveur
  if (deck.isPublished) {
    updateDeck(deckId, { updatedAt: Date.now() });
    return true;
  }
  
  return false;
}

/**
 * Get shared imported decks
 */
export function getSharedImportedDecks(): { localDeckId: string }[] {
  const decks = getDecks();
  return decks
    .filter(deck => deck.isShared && deck.originalId)
    .map(deck => ({ localDeckId: deck.id }));
}

/**
 * Share-related functions for decks
 */
export function exportDeckToJson(deckId: string): SharedDeckExport {
  const deck = getDeck(deckId);
  if (!deck) throw new Error(`Deck not found: ${deckId}`);
  
  const themes = getThemesByDeck(deckId);
  const flashcards = getFlashcardsByDeck(deckId);
  
  const exportData: SharedDeckExport = {
    id: generateId(),
    originalId: deck.id,
    title: deck.title,
    description: deck.description,
    themes: themes.map(theme => ({
      ...theme,
      id: generateId()
    })),
    flashcards: flashcards.map(card => ({
      ...card,
      id: generateId()
    })),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  return exportData;
}

/**
 * Update a deck from imported data
 */
export function updateDeckFromJson(exportData: SharedDeckExport): boolean {
  const decks = getLocalStorageItem('decks') || {};
  
  // Chercher le deck importé par son originalId
  const importedDeck = Object.values(decks).find(
    (deck: any) => deck.isShared && deck.originalId === exportData.originalId
  ) as Deck | undefined;
  
  if (!importedDeck) return false;
  
  // Nettoyer et mettre à jour l'existant
  const flashcards = getFlashcardsByDeck(importedDeck.id);
  flashcards.forEach(card => deleteFlashcard(card.id));
  
  const themes = getThemesByDeck(importedDeck.id);
  themes.forEach(theme => deleteTheme(theme.id));
  
  // Continuer avec le processus d'importation...
  return true;
}
