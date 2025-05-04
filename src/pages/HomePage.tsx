
// Corrigeons le problème dans HomePage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDecks, getUser, Deck } from "@/lib/localStorage";
import { Button } from "@/components/ui/button";
import DeckCard from "@/components/DeckCard";
import { BookOpen, ClipboardList, PlusIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const HomePage = () => {
  const [recentDecks, setRecentDecks] = useState<Deck[]>([]);
  const [popularDecks, setPopularDecks] = useState<Deck[]>([]);
  const [user, setUser] = useState(getUser());
  const isMobile = useIsMobile();

  useEffect(() => {
    // Charger les decks
    const loadDecks = () => {
      const allDecks = getDecks();
      // Trier par date de dernière modification pour les decks récents
      const recent = [...allDecks]
        .filter(deck => deck.authorId === user?.id)
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 3);
      
      setRecentDecks(recent);
      
      // Simuler des decks populaires (dans une vraie app, cela serait basé sur des statistiques)
      setPopularDecks(allDecks.filter(deck => deck.isPublic).slice(0, 3));
    };
    
    loadDecks();
    
    // Mettre à jour régulièrement les decks
    const interval = setInterval(loadDecks, 5000);
    return () => clearInterval(interval);
  }, [user?.id]);

  return (
    <div className="container px-4 py-6 md:py-8">
      <div className="flex flex-col md:flex-row gap-8 md:gap-12 mb-8 md:mb-12">
        <div className="flex-1">
          <h1 className={`text-3xl ${isMobile ? '' : 'text-4xl'} font-bold mb-4 md:mb-6`}>
            Bienvenue sur CDS FLASHCARD-BASE
          </h1>
          <h2 className={`text-xl ${isMobile ? '' : 'text-2xl'} text-muted-foreground mb-6 md:mb-8`}>
            La plateforme pour créer et étudier des flashcards efficacement
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="border rounded-lg p-4 md:p-6 bg-background/50">
              <BookOpen className="h-6 w-6 md:h-8 md:w-8 mb-2 md:mb-3 text-primary" />
              <h3 className="text-lg md:text-xl font-medium mb-1 md:mb-2">
                Apprenez efficacement
              </h3>
              <p className="text-sm md:text-base text-muted-foreground">
                Utilisez nos méthodes de répétition espacée pour mémoriser durablement.
              </p>
            </div>
            <div className="border rounded-lg p-4 md:p-6 bg-background/50">
              <ClipboardList className="h-6 w-6 md:h-8 md:w-8 mb-2 md:mb-3 text-primary" />
              <h3 className="text-lg md:text-xl font-medium mb-1 md:mb-2">
                Organisez vos connaissances
              </h3>
              <p className="text-sm md:text-base text-muted-foreground">
                Créez des thèmes et des catégories pour structurer votre apprentissage.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 md:gap-4">
            <Button asChild className="shadow-md bg-primary hover:bg-primary/90 w-full sm:w-auto">
              <Link to="/create">
                <PlusIcon className="mr-2 h-4 w-4" />
                Créer un deck
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-primary/20 text-primary hover:bg-primary/10 w-full sm:w-auto">
              <Link to="/explore">
                Explorer
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="flex-1">
          <div className="mb-6 md:mb-8">
            <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex justify-between items-center">
              <span>Vos decks récents</span>
              <Button asChild variant="ghost" className="text-sm" size="sm">
                <Link to="/my-decks">Voir tous</Link>
              </Button>
            </h3>
            
            {user ? (
              <div className="space-y-3 md:space-y-4">
                {recentDecks.length > 0 ? (
                  recentDecks.map(deck => (
                    <DeckCard
                      key={deck.id}
                      id={deck.id}
                      title={deck.title}
                      description={deck.description}
                      cardCount={0}
                      coverImage={deck.coverImage}
                      isPublic={deck.isPublic}
                      author={user?.username || "Utilisateur"}
                      tags={deck.tags}
                    />
                  ))
                ) : (
                  <div className="text-center py-6 md:py-8 border rounded-lg bg-background/50">
                    <p className="text-muted-foreground mb-3 md:mb-4">
                      Vous n'avez pas encore de decks
                    </p>
                    <Button asChild size="sm">
                      <Link to="/create">
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Créer un deck
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 md:py-8 border rounded-lg bg-background/50">
                <p className="text-muted-foreground mb-3 md:mb-4">
                  Connectez-vous pour voir vos decks récents
                </p>
                <Button asChild size="sm">
                  <Link to="/login">Se connecter</Link>
                </Button>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex justify-between items-center">
              <span>Decks populaires</span>
              <Button asChild variant="ghost" className="text-sm" size="sm">
                <Link to="/explore">Explorer plus</Link>
              </Button>
            </h3>
            
            <div className="space-y-3 md:space-y-4">
              {popularDecks.length > 0 ? (
                popularDecks.map(deck => (
                  <DeckCard
                    key={deck.id}
                    id={deck.id}
                    title={deck.title}
                    description={deck.description}
                    cardCount={0}
                    coverImage={deck.coverImage}
                    isPublic={deck.isPublic}
                    author="Contributeur"
                    tags={deck.tags}
                  />
                ))
              ) : (
                <div className="text-center py-6 md:py-8 border rounded-lg bg-background/50">
                  <p className="text-muted-foreground">
                    Aucun deck public disponible pour le moment
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
