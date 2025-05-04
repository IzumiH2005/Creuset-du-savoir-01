
import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Database, HardDrive, Check, RefreshCw, Trash2 } from "lucide-react";
import { migrateAllFlashcardMedia, checkForMigrationNeeded, cleanupMigratedData } from "@/utils/mediaMigrationTool";
import { useToast } from "@/hooks/use-toast";
import { Heading } from "@/components/ui/typography";

/**
 * Composant pour gérer la migration des médias vers IndexedDB
 */
const StorageMigrationTool = () => {
  const { toast } = useToast();
  const [isMigrating, setIsMigrating] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [itemsToMigrate, setItemsToMigrate] = useState<number>(0);
  const [migrationProgress, setMigrationProgress] = useState(0);

  useEffect(() => {
    checkMigrationStatus();
  }, []);

  const checkMigrationStatus = async () => {
    const count = await checkForMigrationNeeded();
    setItemsToMigrate(count);
  };

  const handleMigration = async () => {
    try {
      setIsMigrating(true);
      setMigrationProgress(0);
      
      // Simuler la progression avec des intervalles
      const interval = setInterval(() => {
        setMigrationProgress((prev) => {
          const newValue = prev + Math.random() * 10;
          return newValue >= 90 ? 90 : newValue;
        });
      }, 500);
      
      const migratedCount = await migrateAllFlashcardMedia();
      
      clearInterval(interval);
      setMigrationProgress(100);
      
      // Mettre à jour le statut après migration
      await checkMigrationStatus();
      
      toast({
        title: "Migration terminée",
        description: `${migratedCount} médias ont été migrés vers IndexedDB.`
      });
      
      // Réinitialiser après un délai
      setTimeout(() => {
        setMigrationProgress(0);
        setIsMigrating(false);
      }, 2000);
      
    } catch (error) {
      console.error('Erreur lors de la migration:', error);
      toast({
        title: "Erreur de migration",
        description: "Une erreur est survenue lors de la migration des médias.",
        variant: "destructive"
      });
      setIsMigrating(false);
      setMigrationProgress(0);
    }
  };

  const handleCleanup = async () => {
    try {
      setIsCleaning(true);
      
      const cleanedCount = await cleanupMigratedData();
      
      toast({
        title: "Nettoyage terminé",
        description: `${cleanedCount} flashcards ont été nettoyées.`
      });
      
      setIsCleaning(false);
      
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error);
      toast({
        title: "Erreur de nettoyage",
        description: "Une erreur est survenue lors du nettoyage des données.",
        variant: "destructive"
      });
      setIsCleaning(false);
    }
  };

  return (
    <div className="space-y-4 border p-4 rounded-lg bg-background/50">
      <Heading as="h3" size="lg" className="flex items-center gap-2">
        <Database className="h-5 w-5" />
        Gestion du stockage des médias
      </Heading>
      
      {itemsToMigrate > 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-serif">Médias à optimiser</AlertTitle>
          <AlertDescription>
            {itemsToMigrate} flashcard(s) contiennent des médias qui peuvent être optimisés en les déplaçant vers IndexedDB.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle className="font-serif">Stockage optimisé</AlertTitle>
          <AlertDescription>
            Tous vos médias utilisent déjà le stockage hybride optimisé.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex gap-2 flex-wrap">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={checkMigrationStatus}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Vérifier
        </Button>
        
        <Button 
          onClick={handleMigration} 
          size="sm"
          disabled={isMigrating || itemsToMigrate === 0}
          className="flex items-center gap-2"
        >
          <HardDrive className="h-4 w-4" />
          {isMigrating ? "Migration en cours..." : "Optimiser le stockage"}
        </Button>
        
        <Button 
          variant="outline"
          size="sm"
          onClick={handleCleanup}
          disabled={isCleaning || itemsToMigrate > 0}
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          {isCleaning ? "Nettoyage en cours..." : "Nettoyer les données redondantes"}
        </Button>
      </div>
      
      {migrationProgress > 0 && (
        <div className="space-y-2">
          <Progress value={migrationProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Migration en cours: {Math.round(migrationProgress)}%
          </p>
        </div>
      )}
      
      <div className="text-xs text-muted-foreground mt-2 space-y-1">
        <p>
          <span className="font-semibold font-serif">Stockage hybride:</span> Les médias (images, audio) sont stockés dans IndexedDB pour économiser l'espace dans localStorage.
        </p>
        <p>
          <span className="font-semibold font-serif">Avantages:</span> Permet de stocker beaucoup plus de flashcards sans atteindre les limites de stockage du navigateur.
        </p>
      </div>
    </div>
  );
};

export default StorageMigrationTool;
