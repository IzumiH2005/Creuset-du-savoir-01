
import { useEffect } from 'react';
import { isBase64String } from '@/lib/storage/utils';
import { migrateBase64MediaToIndexedDB } from '@/lib/storage/mediaStorage';

/**
 * Hook qui optimise le stockage en migrant automatiquement les médias base64 vers IndexedDB
 */
export function useOptimizeStorage(mediaItems: { 
  id: string, 
  data: string | undefined,
  type: 'image' | 'audio'
}[]) {
  useEffect(() => {
    // Filtrer uniquement les éléments qui sont des chaînes base64
    const base64Items = mediaItems.filter(
      item => item.data && isBase64String(item.data)
    );
    
    if (base64Items.length === 0) return;
    
    // Afficher un message console pour informer de l'optimisation
    console.log(`Optimizing storage for ${base64Items.length} media items...`);
    
    // Migrer chaque élément vers IndexedDB
    const migrateItems = async () => {
      for (const item of base64Items) {
        try {
          const result = await migrateBase64MediaToIndexedDB(
            item.type === 'image' ? item.data : undefined,
            item.type === 'audio' ? item.data : undefined
          );
          
          if ((item.type === 'image' && result.imageId) || 
              (item.type === 'audio' && result.audioId)) {
            console.log(`Successfully migrated ${item.type} with ID ${item.id}`);
          }
        } catch (error) {
          console.error(`Failed to migrate ${item.type} with ID ${item.id}:`, error);
        }
      }
    };
    
    migrateItems();
    
    // Cleanup function
    return () => {
      // Aucun nettoyage nécessaire
    };
  }, [mediaItems]);
}

export default useOptimizeStorage;
