// Common data type definitions for the storage system
import { v4 as uuidv4 } from 'uuid';

// Interfaces de données
export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  createdAt: number;
  avatar?: string; // L'avatar en base64 (pour l'affichage)
  avatarId?: string; // Référence à l'avatar stocké dans IndexedDB
  bio?: string;
  displayName?: string;
  settings?: {
    darkMode: boolean;
    notifications: boolean;
    soundEffects: boolean;
  };
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  coverImageId?: string; // Référence à l'image stockée dans IndexedDB
  tags: string[];
  authorId: string;
  authorName: string;
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
  isShared?: boolean;
  originalId?: string;
  isPublished?: boolean;
}

export interface Theme {
  id: string;
  deckId: string;
  title: string;
  description: string;
  coverImage?: string;
  coverImageId?: string; // Référence à l'image stockée dans IndexedDB
  createdAt: number;
  updatedAt: number;
}

export interface FlashcardSide {
  text: string;
  image?: string;
  imageId?: string; // Référence à l'image stockée dans IndexedDB
  audio?: string;
  audioId?: string; // Référence à l'audio stocké dans IndexedDB
  additionalInfo?: string;
}

export interface Flashcard {
  id: string;
  deckId: string;
  themeId?: string;
  front: FlashcardSide;
  back: FlashcardSide;
  createdAt: number;
  updatedAt: number;
  lastReviewed?: number;
  reviewCount?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface StudySession {
  id: string;
  deckId: string;
  userId: string;
  startTime: number;
  endTime?: number;
  cardsReviewed: number;
  correctAnswers: number;
  incorrectAnswers: number;
}

export interface SharedDeckExport {
  id: string;
  originalId: string;
  title: string;
  description: string;
  themes: Theme[];
  flashcards: Flashcard[];
  createdAt: number;
  updatedAt: number;
}

// Generate new IDs
export const generateId = (): string => {
  return uuidv4();
};
