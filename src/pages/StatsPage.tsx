
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { getDecks, getFlashcardsByDeck, getStudySessionsByDeck, getTheme } from "@/lib/localStorage";
import { useNavigate } from "react-router-dom";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const StatsPage = () => {
  const navigate = useNavigate();
  const [decks, setDecks] = useState([]);
  const [selectedDeck, setSelectedDeck] = useState("");
  const [flashcardStats, setFlashcardStats] = useState([]);
  const [studyStats, setStudyStats] = useState([]);
  const [themeDistribution, setThemeDistribution] = useState([]);

  useEffect(() => {
    const loadedDecks = getDecks();
    setDecks(loadedDecks);
    
    if (loadedDecks.length > 0 && !selectedDeck) {
      setSelectedDeck(loadedDecks[0].id);
    }
  }, []);

  useEffect(() => {
    if (!selectedDeck) return;
    
    // Charger les statistiques des flashcards
    const flashcards = getFlashcardsByDeck(selectedDeck);
    
    // Calculer la distribution des difficultés
    const difficultyCount = {
      easy: 0,
      medium: 0,
      hard: 0,
      notReviewed: 0
    };
    
    flashcards.forEach(card => {
      if (!card.reviewCount || card.reviewCount === 0) {
        difficultyCount.notReviewed++;
      } else if (card.difficulty === 'easy') {
        difficultyCount.easy++;
      } else if (card.difficulty === 'medium') {
        difficultyCount.medium++;
      } else if (card.difficulty === 'hard') {
        difficultyCount.hard++;
      }
    });
    
    const flashcardData = [
      { name: 'Facile', value: difficultyCount.easy },
      { name: 'Moyen', value: difficultyCount.medium },
      { name: 'Difficile', value: difficultyCount.hard },
      { name: 'Non révisé', value: difficultyCount.notReviewed }
    ];
    
    setFlashcardStats(flashcardData);
    
    // Charger les statistiques des sessions d'étude
    const sessions = getStudySessionsByDeck(selectedDeck);
    
    // Calculer les statistiques par session
    const sessionData = sessions.map(session => ({
      name: new Date(session.startTime).toLocaleDateString(),
      correct: session.correctAnswers,
      incorrect: session.incorrectAnswers,
      total: session.cardsReviewed
    }));
    
    setStudyStats(sessionData);
    
    // Calculer la distribution par thème
    const themeCount = {};
    let unthemed = 0;
    
    flashcards.forEach(card => {
      if (card.themeId) {
        const theme = getTheme(card.themeId);
        if (theme) {
          themeCount[theme.title] = (themeCount[theme.title] || 0) + 1;
        }
      } else {
        unthemed++;
      }
    });
    
    const themeData = Object.entries(themeCount).map(([name, value]) => ({
      name,
      value
    }));
    
    if (unthemed > 0) {
      themeData.push({ name: 'Sans thème', value: unthemed });
    }
    
    setThemeDistribution(themeData);
    
  }, [selectedDeck]);

  const handleDeckChange = (value) => {
    setSelectedDeck(value);
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Statistiques</h1>
      
      <div className="mb-6">
        <Select value={selectedDeck} onValueChange={handleDeckChange}>
          <SelectTrigger className="w-full md:w-[300px]">
            <SelectValue placeholder="Sélectionner un deck" />
          </SelectTrigger>
          <SelectContent>
            {decks.map(deck => (
              <SelectItem key={deck.id} value={deck.id}>
                {deck.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {selectedDeck ? (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="progress">Progression</TabsTrigger>
            <TabsTrigger value="themes">Thèmes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Distribution des difficultés</CardTitle>
                  <CardDescription>
                    Répartition des flashcards par niveau de difficulté
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={flashcardStats}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {flashcardStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Sessions d'étude</CardTitle>
                  <CardDescription>
                    Performance lors des dernières sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {studyStats.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={studyStats}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="correct" stackId="a" fill="#4ade80" name="Correctes" />
                          <Bar dataKey="incorrect" stackId="a" fill="#f87171" name="Incorrectes" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">Aucune session d'étude enregistrée</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle>Progression dans le temps</CardTitle>
                <CardDescription>
                  Évolution de vos performances au fil des sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  {studyStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={studyStats}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="total" fill="#8884d8" name="Total" />
                        <Bar dataKey="correct" fill="#4ade80" name="Correctes" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">Aucune donnée de progression disponible</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="themes">
            <Card>
              <CardHeader>
                <CardTitle>Distribution par thème</CardTitle>
                <CardDescription>
                  Répartition des flashcards par thème
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  {themeDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={themeDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                          label={({name, value}) => `${name}: ${value}`}
                        >
                          {themeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">Aucun thème défini pour ce deck</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground mb-4">
            Aucun deck disponible pour afficher des statistiques
          </p>
          <button 
            className="text-primary hover:underline"
            onClick={() => navigate('/decks/new')}
          >
            Créer un nouveau deck
          </button>
        </div>
      )}
    </div>
  );
};

export default StatsPage;
