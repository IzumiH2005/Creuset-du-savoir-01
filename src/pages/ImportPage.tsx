import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft,
  Check,
  Download,
  AlertTriangle,
  FileQuestion
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

import { 
  getSharedDeck,
  createDeck,
  createTheme,
  createFlashcard,
  getThemesByDeck,
  getFlashcardsByDeck,
  getUser,
  Deck
} from "@/lib/localStorage";

const ImportPage = () => {
  const { code } = useParams<{ code: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  
  useEffect(() => {
    if (!code) {
      setIsLoading(false);
      return;
    }
    
    // Get the shared deck
    const sharedDeck = getSharedDeck(code);
    if (!sharedDeck) {
      toast({
        title: "Lien invalide",
        description: "Ce lien de partage n'existe pas ou a expiré",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    setDeck(sharedDeck);
    setIsLoading(false);
  }, [code, toast]);
  
  const handleImport = async () => {
    if (!deck || !code) return;
    
    setIsImporting(true);
    
    try {
      const user = getUser();
      if (!user) {
        toast({
          title: "Erreur",
          description: "Utilisateur non trouvé",
          variant: "destructive",
        });
        setIsImporting(false);
        return;
      }
      
      // Create a new deck
      const newDeck = createDeck({
        title: `${deck.title} (Importé)`,
        description: deck.description,
        coverImage: deck.coverImage,
        authorId: user.id,
        isPublic: false,
        tags: deck.tags,
      });
      
      // Get themes and flashcards from the original deck
      const originalThemes = getThemesByDeck(deck.id);
      const originalCards = getFlashcardsByDeck(deck.id);
      
      // Create a map to track new theme IDs
      const themeIdMap = new Map<string, string>();
      
      // Create themes
      for (const theme of originalThemes) {
        const newTheme = createTheme({
          deckId: newDeck.id,
          title: theme.title,
          description: theme.description,
          coverImage: theme.coverImage,
        });
        
        themeIdMap.set(theme.id, newTheme.id);
      }
      
      // Create flashcards
      for (const card of originalCards) {
        const newThemeId = card.themeId ? themeIdMap.get(card.themeId) : undefined;
        
        createFlashcard({
          deckId: newDeck.id,
          themeId: newThemeId,
          front: {
            text: card.front.text,
            image: card.front.image,
            audio: card.front.audio,
          },
          back: {
            text: card.back.text,
            image: card.back.image,
            audio: card.back.audio,
          },
        });
      }
      
      toast({
        title: "Deck importé avec succès",
        description: "Le deck a été ajouté à votre collection",
      });
      
      // Navigate to the new deck
      navigate(`/deck/${newDeck.id}`);
    } catch (error) {
      console.error("Error importing deck:", error);
      toast({
        title: "Erreur lors de l'importation",
        description: "Une erreur est survenue lors de l'importation du deck",
        variant: "destructive",
      });
      setIsImporting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container px-4 py-8 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }
  
  if (!deck || !code) {
    return (
      <div className="container px-4 py-8">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Retour à l'accueil
        </Link>
        
        <div className="max-w-lg mx-auto">
          <Card>
            <CardHeader>
              <div className="mx-auto rounded-full p-3 bg-amber-100 text-amber-600 mb-2">
                <FileQuestion className="h-6 w-6" />
              </div>
              <CardTitle className="text-center">Lien de partage invalide</CardTitle>
              <CardDescription className="text-center">
                Ce lien de partage n'existe pas ou a expiré
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
              <Button asChild>
                <Link to="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour à l'accueil
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container px-4 py-8">
      <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Retour à l'accueil
      </Link>
      
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="mx-auto rounded-full p-3 bg-green-100 text-green-600 mb-2">
              <Download className="h-6 w-6" />
            </div>
            <CardTitle className="text-center">Importer un Deck</CardTitle>
            <CardDescription className="text-center">
              Vous êtes sur le point d'importer le deck suivant dans votre collection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-start">
              {deck.coverImage ? (
                <div className="w-1/3">
                  <div className="aspect-video rounded-md overflow-hidden">
                    <img 
                      src={deck.coverImage} 
                      alt={deck.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ) : (
                <div className="w-1/3">
                  <div className="aspect-video rounded-md overflow-hidden bg-secondary flex items-center justify-center">
                    <span className="text-3xl">📚</span>
                  </div>
                </div>
              )}
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">{deck.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {deck.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {deck.tags.map((tag, index) => (
                    <span 
                      key={index} 
                      className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <Alert className="mt-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Attention</AlertTitle>
              <AlertDescription>
                En important ce deck, vous créez une copie dans votre collection. Cette copie n'est pas liée à l'original et ne recevra pas les mises à jour apportées au deck original.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link to="/">
                Annuler
              </Link>
            </Button>
            <Button onClick={handleImport} disabled={isImporting}>
              {isImporting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Importation...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Importer ce deck
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ImportPage;
