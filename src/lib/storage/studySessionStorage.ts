
// Study session management functionality
import { StudySession, generateId } from './types';
import { getLocalStorageItem, setLocalStorageItem } from './utils';

/**
 * Create a new study session
 */
export function createStudySession(sessionData: Partial<StudySession> & { deckId: string, userId: string }): StudySession {
  const sessions = getLocalStorageItem('studySessions') || {};
  
  const id = generateId();
  const timestamp = Date.now();
  
  const newSession: StudySession = {
    id,
    deckId: sessionData.deckId,
    userId: sessionData.userId,
    startTime: timestamp,
    cardsReviewed: sessionData.cardsReviewed || 0,
    correctAnswers: sessionData.correctAnswers || 0,
    incorrectAnswers: sessionData.incorrectAnswers || 0,
  };
  
  sessions[id] = newSession;
  setLocalStorageItem('studySessions', sessions);
  
  return newSession;
}

/**
 * Update a study session
 */
export function updateStudySession(sessionId: string, updates: Partial<StudySession>): StudySession | null {
  const sessions = getLocalStorageItem('studySessions') || {};
  const session = sessions[sessionId];
  
  if (!session) return null;
  
  const updatedSession = { ...session, ...updates };
  
  sessions[sessionId] = updatedSession;
  setLocalStorageItem('studySessions', sessions);
  
  return updatedSession;
}

/**
 * Get study sessions by deck ID
 */
export function getStudySessionsByDeck(deckId: string): StudySession[] {
  const sessions = getLocalStorageItem('studySessions') || {};
  return (Object.values(sessions) as StudySession[]).filter((session: StudySession) => session.deckId === deckId);
}

/**
 * Get study sessions by user ID
 */
export function getStudySessionsByUser(userId: string): StudySession[] {
  const sessions = getLocalStorageItem('studySessions') || {};
  return (Object.values(sessions) as StudySession[]).filter((session: StudySession) => session.userId === userId);
}
