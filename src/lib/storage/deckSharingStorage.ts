
// Deck sharing functionality
import { SharedDeckExport, Deck } from './types';
import { createDeck } from './deckStorage';
import { createTheme } from './themeStorage';
import { createFlashcard } from './flashcardStorage';
import { getUser } from './userStorage';

/**
 * Import a deck from JSON export
 */
export function importDeckFromJson(exportData: SharedDeckExport, userId: string): string {
  const currentUser = getUser();
  if (!currentUser || currentUser.id !== userId) throw new Error("User not authenticated");
  
  // Créer le nouveau deck
  const newDeck = createDeck({
    title: exportData.title,
    description: exportData.description,
    authorId: currentUser.id,
    authorName: currentUser.username,
    isPublic: false,
    isShared: true, // Marquer comme deck partagé importé
    originalId: exportData.originalId
  });
  
  // Créer des maps pour associer les anciens IDs aux nouveaux
  const themeIdMap = new Map();
  
  // Importer les thèmes
  for (const theme of exportData.themes) {
    const newTheme = createTheme({
      deckId: newDeck.id,
      title: theme.title,
      description: theme.description,
    });
    
    themeIdMap.set(theme.id, newTheme.id);
  }
  
  // Importer les flashcards
  for (const card of exportData.flashcards) {
    // Mapper l'ancien themeId avec le nouveau si disponible
    const newThemeId = card.themeId ? themeIdMap.get(card.themeId) : undefined;
    
    // Importer la flashcard
    createFlashcard({
      deckId: newDeck.id,
      themeId: newThemeId,
      front: card.front,
      back: card.back,
      difficulty: card.difficulty,
    });
  }
  
  return newDeck.id;
}
