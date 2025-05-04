
import { Info } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export const SessionInfoSection = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="mt-8 sm:mt-16 p-4 sm:p-6 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-xl border border-indigo-200/20 dark:border-indigo-800/20 max-w-2xl w-full mx-auto">
      <div className="flex items-center gap-2 mb-3">
        <Info className="h-5 w-5 text-indigo-500" />
        <h3 className="text-lg font-medium">À propos des clés de session</h3>
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground text-left">
        Les clés de session sont la façon la plus simple de sauvegarder vos progrès dans CDS Flashcard-Base. 
        Chaque clé est unique et vous permet d'accéder à vos decks et flashcards depuis n'importe quel appareil. 
        Conservez votre clé en lieu sûr ou exportez vos données pour une sauvegarde supplémentaire.
      </p>
    </div>
  );
};
