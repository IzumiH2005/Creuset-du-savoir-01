
// Media handling functionality
import { isBase64String } from './utils';
import { FlashcardSide, Flashcard } from './types';
import {
  storeImage,
  storeAudio,
  getImage,
  getAudio,
  deleteImage,
  deleteAudio,
  mediaExists,
  base64ToBlob,
  blobToBase64,
  generateMediaId
} from '../indexedDBStorage';

/**
 * Process and store media from a flashcard side
 */
export async function processFlashcardMedia(side: FlashcardSide): Promise<FlashcardSide> {
  const result = { ...side };

  try {
    // Traitement de l'image
    if (isBase64String(side.image)) {
      // L'image est en base64, la migrer vers IndexedDB
      const imageId = generateMediaId('img');
      const contentType = side.image!.split(';')[0].split(':')[1];
      const imageBlob = base64ToBlob(side.image!, contentType);
      const success = await storeImage(imageId, imageBlob);
      
      if (success) {
        result.imageId = imageId;
        // Garde une référence temporaire à l'image pour l'affichage immédiat
        // mais elle sera supprimée lors du chargement suivant
        result.image = side.image;
      }
    } else if (side.imageId) {
      // L'imageId existe déjà, vérifier si l'image existe dans IndexedDB
      const exists = await mediaExists(side.imageId, 'image');
      if (!exists && side.image) {
        // L'image n'existe pas dans IndexedDB mais nous avons une image en base64
        if (isBase64String(side.image)) {
          const contentType = side.image.split(';')[0].split(':')[1];
          const imageBlob = base64ToBlob(side.image, contentType);
          await storeImage(side.imageId, imageBlob);
        }
      }
    }
    
    // Traitement de l'audio
    if (isBase64String(side.audio)) {
      // L'audio est en base64, le migrer vers IndexedDB
      const audioId = generateMediaId('aud');
      const contentType = side.audio!.split(';')[0].split(':')[1];
      const audioBlob = base64ToBlob(side.audio!, contentType);
      const success = await storeAudio(audioId, audioBlob);
      
      if (success) {
        result.audioId = audioId;
        // Garde une référence temporaire à l'audio pour l'affichage immédiat
        result.audio = side.audio;
      }
    } else if (side.audioId) {
      // L'audioId existe déjà, vérifier si l'audio existe dans IndexedDB
      const exists = await mediaExists(side.audioId, 'audio');
      if (!exists && side.audio) {
        // L'audio n'existe pas dans IndexedDB mais nous avons un audio en base64
        if (isBase64String(side.audio)) {
          const contentType = side.audio.split(';')[0].split(':')[1];
          const audioBlob = base64ToBlob(side.audio, contentType);
          await storeAudio(side.audioId, audioBlob);
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors du traitement des médias:', error);
  }

  return result;
}

/**
 * Load media for a flashcard from IndexedDB
 */
export async function loadFlashcardMedia(card: Flashcard): Promise<Flashcard> {
  const result = { ...card };

  try {
    // Chargement des médias front
    if (card.front.imageId) {
      const imageBlob = await getImage(card.front.imageId);
      if (imageBlob) {
        result.front.image = await blobToBase64(imageBlob);
      }
    }
    
    if (card.front.audioId) {
      const audioBlob = await getAudio(card.front.audioId);
      if (audioBlob) {
        result.front.audio = await blobToBase64(audioBlob);
      }
    }
    
    // Chargement des médias back
    if (card.back.imageId) {
      const imageBlob = await getImage(card.back.imageId);
      if (imageBlob) {
        result.back.image = await blobToBase64(imageBlob);
      }
    }
    
    if (card.back.audioId) {
      const audioBlob = await getAudio(card.back.audioId);
      if (audioBlob) {
        result.back.audio = await blobToBase64(audioBlob);
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des médias:', error);
  }

  return result;
}

/**
 * Migrate base64 media to IndexedDB
 */
export async function migrateBase64MediaToIndexedDB(
  imageBase64?: string,
  audioBase64?: string
): Promise<{ imageId?: string; audioId?: string }> {
  const result: { imageId?: string; audioId?: string } = {};
  
  try {
    // Traiter l'image si présente
    if (isBase64String(imageBase64)) {
      const imageId = generateMediaId('img');
      const contentType = imageBase64!.split(';')[0].split(':')[1];
      const imageBlob = base64ToBlob(imageBase64!, contentType);
      const success = await storeImage(imageId, imageBlob);
      
      if (success) {
        result.imageId = imageId;
      }
    }
    
    // Traiter l'audio si présent
    if (isBase64String(audioBase64)) {
      const audioId = generateMediaId('aud');
      const contentType = audioBase64!.split(';')[0].split(':')[1];
      const audioBlob = base64ToBlob(audioBase64!, contentType);
      const success = await storeAudio(audioId, audioBlob);
      
      if (success) {
        result.audioId = audioId;
      }
    }
  } catch (error) {
    console.error('Erreur lors de la migration des médias:', error);
  }
  
  return result;
}
