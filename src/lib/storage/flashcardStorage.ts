
// Flashcard management functionality
import { Flashcard, generateId } from './types';
import { getLocalStorageItem, setLocalStorageItem } from './utils';
import { processFlashcardMedia, loadFlashcardMedia } from './mediaStorage';
import { deleteImage, deleteAudio } from '../indexedDBStorage';

/**
 * Create a new flashcard
 */
export function createFlashcard(flashcardData: Partial<Flashcard> & { deckId: string }): Flashcard {
  const flashcards = getLocalStorageItem('flashcards') || {};
  
  const id = generateId();
  const timestamp = Date.now();
  
  const newFlashcard: Flashcard = {
    id,
    deckId: flashcardData.deckId,
    themeId: flashcardData.themeId,
    front: flashcardData.front || { text: "" },
    back: flashcardData.back || { text: "" },
    createdAt: timestamp,
    updatedAt: timestamp,
    lastReviewed: flashcardData.lastReviewed,
    reviewCount: flashcardData.reviewCount || 0,
    difficulty: flashcardData.difficulty,
  };
  
  // Traiter les médias de façon asynchrone
  (async () => {
    try {
      // Traiter les médias front
      newFlashcard.front = await processFlashcardMedia(newFlashcard.front);
      
      // Traiter les médias back
      newFlashcard.back = await processFlashcardMedia(newFlashcard.back);
      
      // Mettre à jour la flashcard dans localStorage
      flashcards[id] = { ...newFlashcard };
      setLocalStorageItem('flashcards', flashcards);
    } catch (error) {
      console.error('Erreur lors du traitement des médias:', error);
    }
  })();
  
  flashcards[id] = newFlashcard;
  setLocalStorageItem('flashcards', flashcards);
  
  return newFlashcard;
}

/**
 * Get a flashcard by ID
 */
export function getFlashcard(flashcardId: string): Flashcard | null {
  const flashcards = getLocalStorageItem('flashcards') || {};
  const flashcard = flashcards[flashcardId];
  
  if (!flashcard) return null;
  
  // Charger les médias de façon asynchrone
  (async () => {
    try {
      if (flashcard) {
        // Charger les médias front
        const updatedFront = await loadFlashcardMedia(flashcard.front);
        flashcard.front = updatedFront;
        
        // Charger les médias back
        const updatedBack = await loadFlashcardMedia(flashcard.back);
        flashcard.back = updatedBack;
      }
    } catch (error) {
      console.error('Erreur lors du chargement des médias:', error);
    }
  })();
  
  return flashcard;
}

/**
 * Get all flashcards
 */
export function getFlashcards(): Flashcard[] {
  const flashcards = getLocalStorageItem('flashcards') || {};
  return Object.values(flashcards) as Flashcard[];
}

/**
 * Get flashcards by deck ID
 */
export function getFlashcardsByDeck(deckId: string): Flashcard[] {
  const flashcards = getLocalStorageItem('flashcards') || {};
  return (Object.values(flashcards) as Flashcard[]).filter((card: Flashcard) => card.deckId === deckId);
}

/**
 * Get flashcards by theme ID
 */
export function getFlashcardsByTheme(themeId: string): Flashcard[] {
  const flashcards = getLocalStorageItem('flashcards') || {};
  return (Object.values(flashcards) as Flashcard[]).filter((card: Flashcard) => card.themeId === themeId);
}

/**
 * Update a flashcard
 */
export function updateFlashcard(flashcardId: string, updates: Partial<Flashcard>): Flashcard | null {
  const flashcards = getLocalStorageItem('flashcards') || {};
  const flashcard = flashcards[flashcardId];
  
  if (!flashcard) return null;
  
  // Créer la flashcard mise à jour
  const updatedFlashcard = {
    ...flashcard,
    ...updates,
    updatedAt: Date.now()
  };
  
  // Traiter les médias de façon asynchrone
  (async () => {
    try {
      // Traiter les médias front si mis à jour
      if (updates.front) {
        updatedFlashcard.front = await processFlashcardMedia(updatedFlashcard.front);
      }
      
      // Traiter les médias back si mis à jour
      if (updates.back) {
        updatedFlashcard.back = await processFlashcardMedia(updatedFlashcard.back);
      }
      
      // Mettre à jour la flashcard dans localStorage
      flashcards[flashcardId] = { ...updatedFlashcard };
      setLocalStorageItem('flashcards', flashcards);
    } catch (error) {
      console.error('Erreur lors du traitement des médias:', error);
    }
  })();
  
  flashcards[flashcardId] = updatedFlashcard;
  setLocalStorageItem('flashcards', flashcards);
  
  return updatedFlashcard;
}

/**
 * Delete a flashcard
 */
export function deleteFlashcard(flashcardId: string): boolean {
  const flashcards = getLocalStorageItem('flashcards') || {};
  const flashcard = flashcards[flashcardId];
  
  if (!flashcard) return false;
  
  // Suppression des médias associés
  (async () => {
    try {
      // Supprimer les médias front
      if (flashcard.front.imageId) {
        await deleteImage(flashcard.front.imageId);
      }
      if (flashcard.front.audioId) {
        await deleteAudio(flashcard.front.audioId);
      }
      
      // Supprimer les médias back
      if (flashcard.back.imageId) {
        await deleteImage(flashcard.back.imageId);
      }
      if (flashcard.back.audioId) {
        await deleteAudio(flashcard.back.audioId);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression des médias:', error);
    }
  })();
  
  delete flashcards[flashcardId];
  setLocalStorageItem('flashcards', flashcards);
  
  return true;
}
