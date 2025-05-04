
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateSessionKey, saveSessionKey } from '@/lib/sessionManager';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface HeroSectionProps {
  setSessionKey: (key: string) => void;
}

export const HeroSection = ({ setSessionKey }: HeroSectionProps) => {
  const isMobile = useIsMobile();
  
  const handleGenerateKey = () => {
    const newKey = generateSessionKey();
    saveSessionKey(newKey);
    setSessionKey(newKey);
    
    toast({
      title: "Nouvelle clé générée!",
      description: "N'oubliez pas de la sauvegarder pour accéder à vos données ultérieurement.",
    });
  };

  return (
    <>
      <div className={`flex items-center gap-${isMobile ? '2' : '4'} mb-6`}>
        <span className={`text-${isMobile ? '4xl' : '5xl'}`}>🎭</span>
        <h1 className={`text-${isMobile ? '4xl' : '5xl'} font-bold bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent`}>
          CDS<br />FLASHCARD-<br />BASE
        </h1>
        <span className={`text-${isMobile ? '4xl' : '5xl'}`}>🎭</span>
      </div>
      
      <p className={`text-${isMobile ? 'lg' : 'xl'} mb-${isMobile ? '8' : '12'} max-w-lg px-2`}>
        Créez des flashcards sur les verses de votre choix et accédez aux notes de d'autres quizzeurs ⚡
      </p>
      
      <Button 
        size={isMobile ? "default" : "lg"}
        asChild
        className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white transition-all duration-300 mb-8 group shadow-lg hover:shadow-xl w-full sm:w-auto max-w-[300px]"
      >
        <Link to="/explore">
          Commencer l'aventure <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </Button>
      
      <div className="flex flex-wrap gap-4 justify-center mb-8 px-2">
        <Link 
          to="/login" 
          className="text-foreground hover:text-primary flex items-center transition-colors"
        >
          <Key className="mr-2 h-4 w-4" />
          <span className="underline-offset-4 hover:underline">Avez-vous une clé de session?</span>
        </Link>
        <span className="hidden sm:inline text-muted-foreground">ou</span>
        <button 
          onClick={handleGenerateKey}
          className="text-foreground hover:text-primary flex items-center transition-colors underline-offset-4 hover:underline"
        >
          générer une nouvelle clé
        </button>
      </div>
    </>
  );
};
