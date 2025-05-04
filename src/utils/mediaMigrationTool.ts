
import { 
  migrateExistingMediaToIndexedDB, 
  getFlashcards, 
  updateFlashcard, 
  isBase64String
} from "@/lib/storage";
import { toast } from "@/hooks/use-toast";

/**
 * Fonction utilitaire pour migrer tous les médias des flashcards vers IndexedDB
 * @returns Promesse avec le nombre d'éléments migrés
 */
export async function migrateAllFlashcardMedia(): Promise<number> {
  try {
    // Afficher une notification de début de migration
    toast({
      title: "Migration des médias en cours",
      description: "Veuillez ne pas fermer l'application pendant la migration...",
      duration: 5000,
    });
    
    // Lancer la migration
    const count = await migrateExistingMediaToIndexedDB();
    
    // Afficher une notification de fin de migration
    toast({
      title: "Migration terminée",
      description: `${count} flashcards ont été migrées vers le stockage optimisé.`,
      duration: 5000,
    });
    
    return count;
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
    
    // Afficher une notification d'erreur
    toast({
      title: "Erreur de migration",
      description: "Une erreur est survenue lors de la migration des médias.",
      variant: "destructive",
      duration: 5000,
    });
    
    return 0;
  }
}

/**
 * Vérifie si des médias nécessitent une migration
 * @returns Promesse avec le nombre d'éléments à migrer
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
 * Nettoie les données base64 des flashcards dont les médias ont été migrés vers IndexedDB
 * Recommandé à exécuter après confirmation que tout fonctionne bien
 * @returns Promesse avec le nombre d'éléments nettoyés
 */
export async function cleanupMigratedData(): Promise<number> {
  try {
    const flashcards = getFlashcards();
    let count = 0;
    
    for (const card of flashcards) {
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
    
    // Notification de nettoyage
    if (count > 0) {
      toast({
        title: "Nettoyage terminé",
        description: `${count} flashcards ont été nettoyées de leurs données redondantes.`,
        duration: 5000,
      });
    }
    
    return count;
  } catch (error) {
    console.error('Erreur lors du nettoyage:', error);
    toast({
      title: "Erreur de nettoyage",
      description: "Une erreur est survenue lors du nettoyage des données.",
      variant: "destructive",
      duration: 5000,
    });
    return 0;
  }
}
