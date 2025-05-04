
// Sample data generation
import { createUser, setUser } from './userStorage';
import { createDeck } from './deckStorage';
import { createFlashcard } from './flashcardStorage';
import { createTheme } from './themeStorage';
import { getLocalStorageItem } from './utils';

/**
 * Generate sample data for demonstration
 */
export function generateSampleData() {
  // Vérifier si les utilisateurs existent déjà
  const users = getLocalStorageItem('users');
  if (users) return;
  
  // Créer un utilisateur de démonstration
  const demoUser = createUser("Utilisateur Démo", "demo@cdsflashcard.com", "password");
  setUser(demoUser);
  
  // Créer un deck d'exemple
  const deckId = createDeck({
    title: "Introduction à la programmation",
    description: "Concepts fondamentaux de la programmation informatique",
    tags: ["programmation", "informatique", "débutant"],
    isPublic: true
  }).id;
  
  // Créer des thèmes pour ce deck
  const themeIds = [
    createTheme({
      deckId,
      title: "Variables et Types",
      description: "Les bases des variables et des types de données"
    }).id,
    createTheme({
      deckId,
      title: "Conditions",
      description: "Les structures conditionnelles en programmation"
    }).id,
    createTheme({
      deckId,
      title: "Boucles",
      description: "Les différentes boucles en programmation"
    }).id
  ];
  
  // Créer des flashcards pour ces thèmes
  createFlashcard({
    deckId,
    themeId: themeIds[0],
    front: { text: "Qu'est-ce qu'une variable?" },
    back: { text: "Une variable est un espace nommé en mémoire qui peut stocker une valeur." }
  });
  
  createFlashcard({
    deckId,
    themeId: themeIds[0],
    front: { text: "Quels sont les types de base en JavaScript?" },
    back: { text: "String, Number, Boolean, null, undefined, Symbol et BigInt" }
  });
  
  createFlashcard({
    deckId,
    themeId: themeIds[1],
    front: { text: "Qu'est-ce qu'une condition 'if'?" },
    back: { 
      text: "Une structure qui permet d'exécuter du code uniquement si une condition est vraie.",
      additionalInfo: "Les conditions if sont souvent accompagnées de else et else if pour gérer différents cas."
    }
  });
  
  createFlashcard({
    deckId,
    themeId: themeIds[2],
    front: { text: "Quelle est la différence entre une boucle 'for' et 'while'?" },
    back: { 
      text: "Une boucle for est utilisée quand le nombre d'itérations est connu à l'avance, tandis qu'une boucle while continue jusqu'à ce qu'une condition devienne fausse.",
      additionalInfo: "La boucle for est généralement utilisée avec un compteur, while est plus adaptée pour les conditions de sortie complexes."
    }
  });
}
