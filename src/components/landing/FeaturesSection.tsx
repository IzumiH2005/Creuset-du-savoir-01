
import { Plus, BookOpen, Heart } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export const FeaturesSection = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-8 w-full px-2">
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-indigo-200/30 dark:border-indigo-800/30 shadow-md hover:shadow-lg transition-shadow">
        <div className="p-3 w-12 h-12 mb-4 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mx-auto">
          <Plus className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2 bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">Créez</h3>
        <p className="text-muted-foreground text-sm sm:text-base">
          Créez facilement vos propres flashcards avec texte, images et audio
        </p>
      </div>
      
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-indigo-200/30 dark:border-indigo-800/30 shadow-md hover:shadow-lg transition-shadow">
        <div className="p-3 w-12 h-12 mb-4 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mx-auto">
          <BookOpen className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2 bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">Apprenez</h3>
        <p className="text-muted-foreground text-sm sm:text-base">
          Étudiez efficacement avec des modes d'apprentissage adaptés à votre style
        </p>
      </div>
      
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-indigo-200/30 dark:border-indigo-800/30 shadow-md hover:shadow-lg transition-shadow">
        <div className="p-3 w-12 h-12 mb-4 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mx-auto">
          <Heart className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2 bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">Partagez</h3>
        <p className="text-muted-foreground text-sm sm:text-base">
          Partagez vos decks avec d'autres utilisateurs grâce à un simple code
        </p>
      </div>
    </div>
  );
};
