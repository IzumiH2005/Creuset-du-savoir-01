/**
 * Service de gestion du stockage des médias dans IndexedDB avec compression
 */

// Constantes de configuration de la base de données
const DB_NAME = 'MediaDB';
const DB_VERSION = 2; // Augmenté la version pour gérer la migration
const IMAGES_STORE = 'imagesStore';
const AUDIO_STORE = 'audioStore';
const COMPRESSED_STORE = 'compressedStore'; // Nouveau store pour les données compressées

// Importation de la bibliothèque de compression (intégrée nativement dans les navigateurs modernes)
const compressionSupported = 'CompressionStream' in window;

// Interface pour la gestion des erreurs
interface DBError {
  message: string;
  error?: Error;
}

// Type pour les callbacks de résultats
type ResultCallback<T> = (result: T | null, error: DBError | null) => void;

/**
 * Ouvre une connexion à la base de données IndexedDB
 */
const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Erreur lors de l\'ouverture de la base de données:', request.error);
      reject(request.error);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      
      // Création des object stores si besoin
      if (!db.objectStoreNames.contains(IMAGES_STORE)) {
        db.createObjectStore(IMAGES_STORE);
      }
      
      if (!db.objectStoreNames.contains(AUDIO_STORE)) {
        db.createObjectStore(AUDIO_STORE);
      }
      
      // Nouveau store pour les données compressées
      if (!db.objectStoreNames.contains(COMPRESSED_STORE)) {
        db.createObjectStore(COMPRESSED_STORE);
      }
    };

    request.onsuccess = (event) => {
      const db = request.result;
      
      db.onerror = (event) => {
        console.error('Erreur de base de données:', (event.target as IDBRequest).error);
      };
      
      resolve(db);
    };
  });
};

/**
 * Compresse un Blob en utilisant CompressionStream si disponible
 */
async function compressBlob(blob: Blob): Promise<Blob> {
  // Si la compression n'est pas supportée, retourner le blob original
  if (!compressionSupported) {
    return blob;
  }
  
  try {
    // Créer un readableStream à partir du blob
    const blobStream = (blob as any).stream();
    
    // Compresser le stream avec GZIP
    const compressedStream = blobStream.pipeThrough(new CompressionStream('gzip'));
    
    // Convertir le stream compressé en Blob
    return new Response(compressedStream).blob();
  } catch (error) {
    console.error('Erreur lors de la compression:', error);
    return blob; // En cas d'erreur, retourner le blob non compressé
  }
}

/**
 * Décompresse un Blob en utilisant DecompressionStream si disponible
 */
async function decompressBlob(compressedBlob: Blob): Promise<Blob> {
  // Si la décompression n'est pas supportée, retourner le blob original
  if (!compressionSupported) {
    return compressedBlob;
  }
  
  try {
    // Créer un readableStream à partir du blob compressé
    const compressedStream = (compressedBlob as any).stream();
    
    // Décompresser le stream avec GZIP
    const decompressedStream = compressedStream.pipeThrough(new DecompressionStream('gzip'));
    
    // Convertir le stream décompressé en Blob
    return new Response(decompressedStream).blob();
  } catch (error) {
    console.error('Erreur lors de la décompression:', error);
    return compressedBlob; // En cas d'erreur, retourner le blob compressé
  }
}

/**
 * Optimise une image avant stockage (redimensionnement et compression)
 */
async function optimizeImage(imageBlob: Blob): Promise<Blob> {
  // Si c'est une image de moins de 50KB, pas besoin d'optimiser
  if (imageBlob.size <= 50 * 1024) {
    return imageBlob;
  }
  
  try {
    // Créer une URL d'objet pour l'image
    const blobUrl = URL.createObjectURL(imageBlob);
    
    // Créer une nouvelle image
    const img = new Image();
    
    // Attendre que l'image soit chargée
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = blobUrl;
    });
    
    // Libérer l'URL
    URL.revokeObjectURL(blobUrl);
    
    // Calculer les nouvelles dimensions (max 800px de large ou haut)
    const MAX_SIZE = 800;
    let width = img.width;
    let height = img.height;
    
    if (width > MAX_SIZE || height > MAX_SIZE) {
      if (width > height) {
        height = Math.round((height * MAX_SIZE) / width);
        width = MAX_SIZE;
      } else {
        width = Math.round((width * MAX_SIZE) / height);
        height = MAX_SIZE;
      }
    }
    
    // Créer un canvas pour le redimensionnement
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    // Dessiner l'image redimensionnée
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(img, 0, 0, width, height);
    
    // Convertir en blob avec compression
    const optimizedBlob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.85);
    });
    
    return optimizedBlob;
  } catch (error) {
    console.error('Erreur lors de l\'optimisation de l\'image:', error);
    return imageBlob; // En cas d'erreur, retourner l'image originale
  }
}

/**
 * Stocke une image (Blob) dans IndexedDB avec optimisation
 */
export const storeImage = async (imageId: string, imageBlob: Blob): Promise<boolean> => {
  try {
    // Optimiser l'image avant stockage
    const optimizedBlob = await optimizeImage(imageBlob);
    
    // Compresser le blob optimisé
    const compressedBlob = await compressBlob(optimizedBlob);
    
    // Déterminer dans quel store sauvegarder le blob
    const storeName = compressionSupported ? COMPRESSED_STORE : IMAGES_STORE;
    
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Stocker le blob avec un préfixe pour identifier le type
      const request = store.put(compressedBlob, `img_${imageId}`);
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => {
        console.error('Erreur lors du stockage de l\'image:', request.error);
        reject(request.error);
      };
      
      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error('Erreur dans storeImage:', error);
    return false;
  }
};

/**
 * Stocke un fichier audio (Blob) dans IndexedDB avec compression
 */
export const storeAudio = async (audioId: string, audioBlob: Blob): Promise<boolean> => {
  try {
    // Compresser le blob audio
    const compressedBlob = await compressBlob(audioBlob);
    
    // Déterminer dans quel store sauvegarder le blob
    const storeName = compressionSupported ? COMPRESSED_STORE : AUDIO_STORE;
    
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Stocker le blob avec un préfixe pour identifier le type
      const request = store.put(compressedBlob, `aud_${audioId}`);
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => {
        console.error('Erreur lors du stockage de l\'audio:', request.error);
        reject(request.error);
      };
      
      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error('Erreur dans storeAudio:', error);
    return false;
  }
};

/**
 * Récupère une image depuis IndexedDB
 */
export const getImage = async (imageId: string): Promise<Blob | null> => {
  try {
    // D'abord essayer de récupérer depuis le store compressé
    if (compressionSupported) {
      const compressedBlob = await getBlobFromStore(COMPRESSED_STORE, `img_${imageId}`);
      if (compressedBlob) {
        return await decompressBlob(compressedBlob);
      }
    }
    
    // Sinon essayer depuis le store d'images non compressées
    return await getBlobFromStore(IMAGES_STORE, imageId);
  } catch (error) {
    console.error('Erreur dans getImage:', error);
    return null;
  }
};

/**
 * Récupère un fichier audio depuis IndexedDB
 */
export const getAudio = async (audioId: string): Promise<Blob | null> => {
  try {
    // D'abord essayer de récupérer depuis le store compressé
    if (compressionSupported) {
      const compressedBlob = await getBlobFromStore(COMPRESSED_STORE, `aud_${audioId}`);
      if (compressedBlob) {
        return await decompressBlob(compressedBlob);
      }
    }
    
    // Sinon essayer depuis le store d'audio non compressé
    return await getBlobFromStore(AUDIO_STORE, audioId);
  } catch (error) {
    console.error('Erreur dans getAudio:', error);
    return null;
  }
};

/**
 * Fonction générique pour récupérer un blob depuis un store
 */
async function getBlobFromStore(storeName: string, key: string): Promise<Blob | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result as Blob;
        resolve(result || null);
      };
      
      request.onerror = () => {
        console.error(`Erreur lors de la récupération depuis ${storeName}:`, request.error);
        reject(request.error);
      };
      
      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error(`Erreur dans getBlobFromStore (${storeName}):`, error);
    return null;
  }
}

/**
 * Supprime une image depuis IndexedDB
 */
export const deleteImage = async (imageId: string): Promise<boolean> => {
  try {
    let success = true;
    
    // Supprimer depuis le store compressé si disponible
    if (compressionSupported) {
      const compressedSuccess = await deleteFromStore(COMPRESSED_STORE, `img_${imageId}`);
      success = success && compressedSuccess;
    }
    
    // Supprimer également depuis le store non compressé
    const standardSuccess = await deleteFromStore(IMAGES_STORE, imageId);
    
    return success && standardSuccess;
  } catch (error) {
    console.error('Erreur dans deleteImage:', error);
    return false;
  }
};

/**
 * Supprime un fichier audio depuis IndexedDB
 */
export const deleteAudio = async (audioId: string): Promise<boolean> => {
  try {
    let success = true;
    
    // Supprimer depuis le store compressé si disponible
    if (compressionSupported) {
      const compressedSuccess = await deleteFromStore(COMPRESSED_STORE, `aud_${audioId}`);
      success = success && compressedSuccess;
    }
    
    // Supprimer également depuis le store non compressé
    const standardSuccess = await deleteFromStore(AUDIO_STORE, audioId);
    
    return success && standardSuccess;
  } catch (error) {
    console.error('Erreur dans deleteAudio:', error);
    return false;
  }
};

/**
 * Fonction générique pour supprimer un élément depuis un store
 */
async function deleteFromStore(storeName: string, key: string): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => {
        console.error(`Erreur lors de la suppression depuis ${storeName}:`, request.error);
        resolve(false); // Ne pas rejeter pour continuer si un élément n'existe pas
      };
      
      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error(`Erreur dans deleteFromStore (${storeName}):`, error);
    return false;
  }
}

/**
 * Vérifie si un média existe dans IndexedDB
 */
export const mediaExists = async (id: string, type: 'image' | 'audio'): Promise<boolean> => {
  try {
    const prefix = type === 'image' ? 'img_' : 'aud_';
    
    // Vérifier d'abord dans le store compressé
    if (compressionSupported) {
      const existsInCompressed = await checkExistsInStore(COMPRESSED_STORE, `${prefix}${id}`);
      if (existsInCompressed) return true;
    }
    
    // Vérifier dans le store standard
    const storeName = type === 'image' ? IMAGES_STORE : AUDIO_STORE;
    return await checkExistsInStore(storeName, id);
  } catch (error) {
    console.error(`Erreur dans mediaExists (${type}):`, error);
    return false;
  }
};

/**
 * Vérifie si une clé existe dans un store
 */
async function checkExistsInStore(storeName: string, key: string): Promise<boolean> {
  try {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.count(key);
      
      request.onsuccess = () => resolve(request.result > 0);
      request.onerror = () => {
        console.error(`Erreur lors de la vérification dans ${storeName}:`, request.error);
        reject(request.error);
      };
      
      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error(`Erreur dans checkExistsInStore (${storeName}):`, error);
    return false;
  }
}

/**
 * Convertit une chaîne base64 en Blob
 */
export const base64ToBlob = (base64: string, contentType: string = ''): Blob => {
  // Extrait la partie données de la chaîne base64
  const base64Data = base64.includes('base64,') 
    ? base64.split('base64,')[1] 
    : base64;
  
  // Décode la chaîne base64
  const byteCharacters = atob(base64Data);
  const byteArrays = [];
  
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  // Détermine le type MIME à partir de la chaîne base64 si non spécifié
  if (!contentType && base64.includes('data:')) {
    contentType = base64.split(';')[0].split(':')[1];
  }
  
  return new Blob(byteArrays, { type: contentType });
};

/**
 * Convertit un Blob en chaîne base64 (pour la compatibilité descendante)
 */
export const blobToBase64 = async (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Crée un ID unique pour un média
 */
export const generateMediaId = (prefix: 'img' | 'aud'): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
};

/**
 * Vérifie si une chaîne est au format base64 (pour la migration)
 */
export const isBase64String = (str: string | undefined): boolean => {
  if (!str) return false;
  return str.startsWith('data:') && str.includes('base64,');
};

/**
 * Migre les médias en base64 vers IndexedDB avec compression
 */
export const migrateBase64MediaToIndexedDB = async (
  imageBase64?: string,
  audioBase64?: string
): Promise<{ imageId?: string, audioId?: string }> => {
  const result: { imageId?: string, audioId?: string } = {};
  
  try {
    // Migre l'image si présente
    if (isBase64String(imageBase64)) {
      const imageId = generateMediaId('img');
      const contentType = imageBase64!.split(';')[0].split(':')[1];
      const imageBlob = base64ToBlob(imageBase64!, contentType);
      
      // Optimiser et compresser l'image
      const success = await storeImage(imageId, imageBlob);
      
      if (success) {
        result.imageId = imageId;
      }
    }
    
    // Migre l'audio si présent
    if (isBase64String(audioBase64)) {
      const audioId = generateMediaId('aud');
      const contentType = audioBase64!.split(';')[0].split(':')[1];
      const audioBlob = base64ToBlob(audioBase64!, contentType);
      
      // Compresser l'audio
      const success = await storeAudio(audioId, audioBlob);
      
      if (success) {
        result.audioId = audioId;
      }
    }
    
    return result;
  } catch (error) {
    console.error('Erreur lors de la migration des médias:', error);
    return result;
  }
};

/**
 * Migre les données existantes vers le format compressé
 */
export const migrateToCompressedFormat = async (): Promise<number> => {
  // Si la compression n'est pas supportée, ne rien faire
  if (!compressionSupported) {
    return 0;
  }
  
  try {
    const db = await openDatabase();
    
    // Récupérer tous les blobs d'images
    const imageBlobs = await getAllBlobs(db, IMAGES_STORE);
    let migratedCount = 0;
    
    // Migrer chaque image
    for (const [key, blob] of Object.entries(imageBlobs)) {
      // Compresser et stocker dans le nouveau format
      const compressedBlob = await compressBlob(blob);
      await storeBlobInStore(db, COMPRESSED_STORE, `img_${key}`, compressedBlob);
      migratedCount++;
    }
    
    // Récupérer tous les blobs audio
    const audioBlobs = await getAllBlobs(db, AUDIO_STORE);
    
    // Migrer chaque audio
    for (const [key, blob] of Object.entries(audioBlobs)) {
      // Compresser et stocker dans le nouveau format
      const compressedBlob = await compressBlob(blob);
      await storeBlobInStore(db, COMPRESSED_STORE, `aud_${key}`, compressedBlob);
      migratedCount++;
    }
    
    db.close();
    return migratedCount;
  } catch (error) {
    console.error('Erreur lors de la migration vers le format compressé:', error);
    return 0;
  }
};

/**
 * Récupère tous les blobs d'un store
 */
async function getAllBlobs(db: IDBDatabase, storeName: string): Promise<Record<string, Blob>> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    const keyRequest = store.getAllKeys();
    const blobs: Record<string, Blob> = {};
    
    keyRequest.onsuccess = () => {
      const keys = keyRequest.result;
      request.onsuccess = () => {
        const values = request.result;
        
        for (let i = 0; i < keys.length; i++) {
          blobs[keys[i] as string] = values[i];
        }
        
        resolve(blobs);
      };
    };
    
    request.onerror = keyRequest.onerror = () => {
      console.error(`Erreur lors de la récupération de tous les blobs depuis ${storeName}:`, request.error);
      reject(request.error);
    };
  });
}

/**
 * Stocke un blob dans un store
 */
function storeBlobInStore(
  db: IDBDatabase,
  storeName: string,
  key: string,
  blob: Blob
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(blob, key);
    
    request.onsuccess = () => resolve(true);
    request.onerror = () => {
      console.error(`Erreur lors du stockage dans ${storeName}:`, request.error);
      reject(request.error);
    };
  });
}

/**
 * Obtient des statistiques sur l'utilisation du stockage
 */
export const getStorageStats = async (): Promise<{
  compressedSize: number;
  uncompressedSize: number;
  itemCount: number;
  compressionRatio: number;
}> => {
  try {
    const db = await openDatabase();
    let compressedSize = 0;
    let uncompressedSize = 0;
    let itemCount = 0;
    
    // Calculer la taille des données compressées
    if (compressionSupported) {
      const compressedItems = await getAllBlobs(db, COMPRESSED_STORE);
      for (const blob of Object.values(compressedItems)) {
        compressedSize += blob.size;
        itemCount++;
      }
    }
    
    // Calculer la taille des données non compressées
    const imageItems = await getAllBlobs(db, IMAGES_STORE);
    for (const blob of Object.values(imageItems)) {
      uncompressedSize += blob.size;
      if (!compressionSupported) itemCount++;
    }
    
    const audioItems = await getAllBlobs(db, AUDIO_STORE);
    for (const blob of Object.values(audioItems)) {
      uncompressedSize += blob.size;
      if (!compressionSupported) itemCount++;
    }
    
    // Calculer le ratio de compression
    const totalSize = compressedSize + uncompressedSize;
    const originalSize = compressionSupported ? totalSize * 1.5 : totalSize; // Estimation
    const compressionRatio = originalSize > 0 ? totalSize / originalSize : 1;
    
    db.close();
    
    return {
      compressedSize,
      uncompressedSize,
      itemCount,
      compressionRatio
    };
  } catch (error) {
    console.error('Erreur lors du calcul des statistiques de stockage:', error);
    return {
      compressedSize: 0,
      uncompressedSize: 0,
      itemCount: 0,
      compressionRatio: 1
    };
  }
};
