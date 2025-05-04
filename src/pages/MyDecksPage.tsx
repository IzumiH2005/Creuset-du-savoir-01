
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  ListFilter,
  PlusIcon,
  Search,
  ChevronDown,
  FileUp,
  ArrowUpDown,
  Clock,
  Star,
  X,
  Check, // Importation du composant Check
} from "lucide-react";
import { getDecks, Deck, getUser } from "@/lib/localStorage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import DeckCard from "@/components/DeckCard";
import ShareDeckDialog from "@/components/ShareDeckDialog";
import { toast } from "@/hooks/use-toast";

const MyDecksPage = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [favoriteDecks, setFavoriteDecks] = useState<Deck[]>([]);
  const [filter, setFilter] = useState("");
  const [sortMethod, setSortMethod] = useState<"date" | "alphabetical">("date");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [deckToShare, setDeckToShare] = useState<string | null>(null);
  const user = getUser();

  useEffect(() => {
    loadDecks();
    const interval = setInterval(loadDecks, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Extraire tous les tags uniques des decks
    const allTags: string[] = [];
    decks.forEach((deck) => {
      deck.tags.forEach((tag) => {
        if (!allTags.includes(tag)) {
          allTags.push(tag);
        }
      });
    });
    setTags(allTags);
  }, [decks]);

  const loadDecks = () => {
    const allDecks = getDecks();
    const userDecks = allDecks.filter((deck) => deck.authorId === user?.id);

    // Set all decks
    setDecks(userDecks);

    // Set favorite decks (simulation - in a real app this would use user preferences)
    setFavoriteDecks(userDecks.filter((deck) => deck.isPublic).slice(0, 3));
  };

  const filteredDecks = decks.filter((deck) => {
    // Filter by search term
    const matchesFilter =
      deck.title.toLowerCase().includes(filter.toLowerCase()) ||
      deck.description.toLowerCase().includes(filter.toLowerCase());

    // Filter by selected tags
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => deck.tags.includes(tag));

    return matchesFilter && matchesTags;
  });

  // Sort decks based on the selected method
  const sortedDecks = [...filteredDecks].sort((a, b) => {
    if (sortMethod === "date") {
      return b.updatedAt - a.updatedAt;
    } else {
      return a.title.localeCompare(b.title);
    }
  });

  const handleTagSelect = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const clearFilters = () => {
    setFilter("");
    setSelectedTags([]);
    setSortMethod("date");
  };

  const handleShareDeck = (deckId: string) => {
    setDeckToShare(deckId);
    setShareDialogOpen(true);
  };

  return (
    <div className="container px-4 py-8">
      <div className="flex flex-col md:flex-row items-start gap-4 mb-8">
        <h1 className="text-3xl font-bold">Mes decks</h1>
        <div className="flex-1 flex justify-end">
          <Button asChild>
            <Link to="/create">
              <PlusIcon className="h-4 w-4 mr-2" />
              Créer un deck
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        <div className="w-full lg:w-2/3">
          <div className="bg-card rounded-lg shadow p-6">
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un deck..."
                  className="pl-10"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <ListFilter className="h-4 w-4 mr-2" />
                      Filtres
                      {selectedTags.length > 0 && (
                        <Badge
                          variant="secondary"
                          className="ml-2 bg-primary text-white"
                        >
                          {selectedTags.length}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>Tags</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {tags.length > 0 ? (
                      tags.map((tag) => (
                        <DropdownMenuItem
                          key={tag}
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => handleTagSelect(tag)}
                        >
                          <span>{tag}</span>
                          {selectedTags.includes(tag) && <Check className="h-4 w-4" />}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled>Aucun tag</DropdownMenuItem>
                    )}
                    {selectedTags.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setSelectedTags([])}
                          className="text-red-500"
                        >
                          Effacer les filtres
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      Trier
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuItem
                      onClick={() => setSortMethod("date")}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Date de modification
                      </div>
                      {sortMethod === "date" && <Check className="h-4 w-4" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSortMethod("alphabetical")}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Alphabétique
                      </div>
                      {sortMethod === "alphabetical" && <Check className="h-4 w-4" />}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {(filter || selectedTags.length > 0) && (
                  <Button variant="ghost" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Effacer
                  </Button>
                )}
              </div>
            </div>

            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="px-2 py-1 text-xs"
                  >
                    {tag}
                    <X
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={() =>
                        setSelectedTags(selectedTags.filter((t) => t !== tag))
                      }
                    />
                  </Badge>
                ))}
              </div>
            )}

            <Tabs defaultValue="all">
              <TabsList className="mb-6">
                <TabsTrigger value="all">Tous mes decks</TabsTrigger>
                <TabsTrigger value="public">Decks publics</TabsTrigger>
                <TabsTrigger value="private">Decks privés</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                {sortedDecks.length > 0 ? (
                  <div className="space-y-4">
                    {sortedDecks.map((deck) => (
                      <DeckCard
                        key={deck.id}
                        id={deck.id}
                        title={deck.title}
                        description={deck.description}
                        coverImage={deck.coverImage}
                        isPublic={deck.isPublic}
                        authorEmail={user?.email || "Vous"}
                        tags={deck.tags}
                        cardCount={20} // Demo count, should be real in production
                        onShare={() => handleShareDeck(deck.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Aucun deck trouvé</h3>
                    <p className="text-muted-foreground mb-6">
                      {filter || selectedTags.length > 0
                        ? "Aucun deck ne correspond à vos critères de recherche"
                        : "Vous n'avez pas encore créé de deck"}
                    </p>
                    <Button asChild>
                      <Link to="/create">
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Créer un deck
                      </Link>
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="public">
                {sortedDecks.filter((deck) => deck.isPublic).length > 0 ? (
                  <div className="space-y-4">
                    {sortedDecks
                      .filter((deck) => deck.isPublic)
                      .map((deck) => (
                        <DeckCard
                          key={deck.id}
                          id={deck.id}
                          title={deck.title}
                          description={deck.description}
                          coverImage={deck.coverImage}
                          isPublic={true}
                          authorEmail={user?.email || "Vous"}
                          tags={deck.tags}
                          cardCount={20} // Demo count
                          onShare={() => handleShareDeck(deck.id)}
                        />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      Aucun deck public trouvé
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Vous pouvez rendre vos decks publics en les modifiant
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="private">
                {sortedDecks.filter((deck) => !deck.isPublic).length > 0 ? (
                  <div className="space-y-4">
                    {sortedDecks
                      .filter((deck) => !deck.isPublic)
                      .map((deck) => (
                        <DeckCard
                          key={deck.id}
                          id={deck.id}
                          title={deck.title}
                          description={deck.description}
                          coverImage={deck.coverImage}
                          isPublic={false}
                          authorEmail={user?.email || "Vous"}
                          tags={deck.tags}
                          cardCount={20} // Demo count
                          onShare={() => handleShareDeck(deck.id)}
                        />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      Aucun deck privé trouvé
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Les decks privés ne sont visibles que par vous
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="w-full lg:w-1/3">
          <div className="bg-card rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Favoris</h2>
            {favoriteDecks.length > 0 ? (
              <div className="space-y-4">
                {favoriteDecks.map((deck) => (
                  <div
                    key={deck.id}
                    className="border rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <Link
                        to={`/deck/${deck.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {deck.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {deck.tags.slice(0, 2).join(", ")}
                        {deck.tags.length > 2 && "..."}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/deck/${deck.id}`}>
                        <BookOpen className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Star className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  Marquez des decks en favoris pour les retrouver ici
                </p>
              </div>
            )}
          </div>

          <div className="bg-card rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Importer</h2>
            <div className="space-y-4">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/import">
                  <FileUp className="h-4 w-4 mr-2" />
                  Importer un deck
                </Link>
              </Button>

              <p className="text-sm text-muted-foreground">
                Importez des decks partagés par d'autres utilisateurs ou
                depuis un fichier
              </p>
            </div>
          </div>
        </div>
      </div>

      <ShareDeckDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        deckId={deckToShare || ""}
      />
    </div>
  );
};

export default MyDecksPage;
