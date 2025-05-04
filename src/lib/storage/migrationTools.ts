
// Migration tools for storage optimization
import { getFlashcards, updateFlashcard } from './flashcardStorage';
import { isBase64String } from './utils';
import { 
  storeImage,
  storeAudio,
  base64ToBlob,
  generateMediaId,
  migrateToCompressedFormat
} from '../indexedDBStorage';

/**
 * Migre les médias existants des flashcards vers IndexedDB
 * @returns Promesse avec le nombre d'éléments migrés
 */
export async function migrateExistingMediaToIndexedDB(): Promise<number> {
  console.log('Début de la migration des médias existants vers IndexedDB...');
  
  try {
    const flashcards = getFlashcards();
    let migratedCount = 0;
    
    // Traitement par lots pour éviter de surcharger la mémoire
    const BATCH_SIZE = 10;
    
    for (let i = 0; i < flashcards.length; i += BATCH_SIZE) {
      const batch = flashcards.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (card) => {
        let updated = false;
        
        // Migrer le front
        if (isBase64String(card.front.image) && !card.front.imageId) {
          const imageId = generateMediaId('img');
          const contentType = card.front.image!.split(';')[0].split(':')[1];
          const imageBlob = base64ToBlob(card.front.image!, contentType);
          const success = await storeImage(imageId, imageBlob);
          
          if (success) {
            card.front.imageId = imageId;
            updated = true;
          }
        }
        
        if (isBase64String(card.front.audio) && !card.front.audioId) {
          const audioId = generateMediaId('aud');
          const contentType = card.front.audio!.split(';')[0].split(':')[1];
          const audioBlob = base64ToBlob(card.front.audio!, contentType);
          const success = await storeAudio(audioId, audioBlob);
          
          if (success) {
            card.front.audioId = audioId;
            updated = true;
          }
        }
        
        // Migrer le back
        if (isBase64String(card.back.image) && !card.back.imageId) {
          const imageId = generateMediaId('img');
          const contentType = card.back.image!.split(';')[0].split(':')[1];
          const imageBlob = base64ToBlob(card.back.image!, contentType);
          const success = await storeImage(imageId, imageBlob);
          
          if (success) {
            card.back.imageId = imageId;
            updated = true;
          }
        }
        
        if (isBase64String(card.back.audio) && !card.back.audioId) {
          const audioId = generateMediaId('aud');
          const contentType = card.back.audio!.split(';')[0].split(':')[1];
          const audioBlob = base64ToBlob(card.back.audio!, contentType);
          const success = await storeAudio(audioId, audioBlob);
          
          if (success) {
            card.back.audioId = audioId;
            updated = true;
          }
        }
        
        if (updated) {
          updateFlashcard(card.id, card);
          migratedCount++;
        }
      }));
      
      // Petite pause pour permettre au navigateur de respirer
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log(`Migration en cours: ${Math.min(i + BATCH_SIZE, flashcards.length)}/${flashcards.length} flashcards traitées`);
    }
    
    // Migrer les médias existants vers le format compressé
    const compressedCount = await migrateToCompressedFormat();
    console.log(`Migration vers le format compressé terminée: ${compressedCount} fichiers compressés`);
    
    console.log(`Migration terminée: ${migratedCount} flashcards mises à jour`);
    return migratedCount;
  } catch (error) {
    console.error('Erreur lors de la migration des médias existants:', error);
    return 0;
  }
};

/**
 * Check for flashcards that need media migration
 */
export async function checkForMigrationNeeded(): Promise<number> {
  try {
    const flashcards = getFlashcards();
    let count = 0;
    
    for (const card of flashcards) {
      if (
        (isBase64String(card.front.image) && !card.front.imageId) ||
        (isBase64String(card.front.audio) && !card.front.audioId) ||
        (isBase64String(card.back.image) && !card.back.imageId) ||
        (isBase64String(card.back.audio) && !card.back.audioId)
      ) {
        count++;
      }
    }
    
    return count;
  } catch (error) {
    console.error('Erreur lors de la vérification de migration:', error);
    return 0;
  }
}

/**
 * Clean up redundant base64 data after migration
 */
export async function cleanupMigratedData(): Promise<number> {
  try {
    const flashcards = getFlashcards();
    let count = 0;
    
    // Traitement par lots pour éviter de surcharger la mémoire
    const BATCH_SIZE = 20;
    
    for (let i = 0; i < flashcards.length; i += BATCH_SIZE) {
      const batch = flashcards.slice(i, i + BATCH_SIZE);
      
      for (const card of batch) {
        let updated = false;
        
        // Vérifier et nettoyer les médias front
        if (card.front.imageId && isBase64String(card.front.image)) {
          card.front.image = undefined;
          updated = true;
        }
        
        if (card.front.audioId && isBase64String(card.front.audio)) {
          card.front.audio = undefined;
          updated = true;
        }
        
        // Vérifier et nettoyer les médias back
        if (card.back.imageId && isBase64String(card.back.image)) {
          card.back.image = undefined;
          updated = true;
        }
        
        if (card.back.audioId && isBase64String(card.back.audio)) {
          card.back.audio = undefined;
          updated = true;
        }
        
        // Mettre à jour la flashcard si nécessaire
        if (updated) {
          updateFlashcard(card.id, card);
          count++;
        }
      }
      
      // Petite pause pour permettre au navigateur de respirer
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return count;
  } catch (error) {
    console.error('Erreur lors du nettoyage:', error);
    return 0;
  }
}

/**
 * Calcule les statistiques de stockage des données
 */
export async function getStorageStats(): Promise<{
  flashcardCount: number;
  mediaCount: number;
  storageSize: number;
  optimizationPotential: number;
}> {
  try {
    const flashcards = getFlashcards();
    let base64MediaCount = 0;
    let totalBase64Size = 0;
    
    // Analyser les données dans les flashcards
    for (const card of flashcards) {
      // Vérifier les médias front
      if (isBase64String(card.front.image)) {
        base64MediaCount++;
        totalBase64Size += card.front.image!.length;
      }
      
      if (isBase64String(card.front.audio)) {
        base64MediaCount++;
        totalBase64Size += card.front.audio!.length;
      }
      
      // Vérifier les médias back
      if (isBase64String(card.back.image)) {
        base64MediaCount++;
        totalBase64Size += card.back.image!.length;
      }
      
      if (isBase64String(card.back.audio)) {
        base64MediaCount++;
        totalBase64Size += card.back.audio!.length;
      }
    }
    
    // Estimation du potentiel d'optimisation
    // Les données base64 sont ~33% plus grandes que les données binaires,
    // et la compression peut réduire encore de ~50%
    const optimizationPotential = Math.round(totalBase64Size * 0.6);
    
    return {
      flashcardCount: flashcards.length,
      mediaCount: base64MediaCount,
      storageSize: Math.round(totalBase64Size / 1024), // Taille en KB
      optimizationPotential: Math.round(optimizationPotential / 1024) // Potentiel en KB
    };
  } catch (error) {
    console.error('Erreur lors du calcul des statistiques de stockage:', error);
    return {
      flashcardCount: 0,
      mediaCount: 0,
      storageSize: 0,
      optimizationPotential: 0
    };
  }
}
