import { ChatSession, ChatMessage, RepoContext } from '@/types';

export const STORAGE_SESSIONS_KEY = 'giantigravity_chat_sessions';
export const STORAGE_ACTIVE_ID_KEY = 'giantigravity_active_session_id';

/**
 * Recupera l'elenco di tutte le sessioni salvate nel localStorage,
 * ordinate dalla più recente alla meno recente.
 */
export function getStoredSessions(): ChatSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch (e) {
    console.error('Errore durante la lettura dello storico conversazioni:', e);
    return [];
  }
}

/**
 * Recupera una singola sessione per ID.
 */
export function getStoredSession(id: string): ChatSession | null {
  const sessions = getStoredSessions();
  return sessions.find((s) => s.id === id) || null;
}

/**
 * Salva o aggiorna una sessione nello storico.
 */
export function saveSession(session: ChatSession): void {
  if (typeof window === 'undefined') return;
  try {
    const sessions = getStoredSessions();
    const index = sessions.findIndex((s) => s.id === session.id);

    if (index >= 0) {
      sessions[index] = { ...sessions[index], ...session, updatedAt: Date.now() };
    } else {
      sessions.unshift({ ...session, updatedAt: session.updatedAt || Date.now() });
    }

    localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Errore durante il salvataggio della sessione nello storico:', e);
  }
}

/**
 * Elimina una sessione dallo storico per ID.
 */
export function deleteSession(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const sessions = getStoredSessions().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(sessions));

    const activeId = getActiveSessionId();
    if (activeId === id) {
      setActiveSessionId(null);
    }
  } catch (e) {
    console.error('Errore durante l\'eliminazione della sessione:', e);
  }
}

/**
 * Cancella l'intero storico delle sessioni.
 */
export function clearAllSessions(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_SESSIONS_KEY);
    localStorage.removeItem(STORAGE_ACTIVE_ID_KEY);
  } catch (e) {
    console.error('Errore durante la cancellazione dello storico:', e);
  }
}

/**
 * Ottiene l'ID della sessione attiva corrente.
 */
export function getActiveSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_ACTIVE_ID_KEY);
}

/**
 * Imposta l'ID della sessione attiva corrente.
 */
export function setActiveSessionId(id: string | null): void {
  if (typeof window === 'undefined') return;
  if (id) {
    localStorage.setItem(STORAGE_ACTIVE_ID_KEY, id);
  } else {
    localStorage.removeItem(STORAGE_ACTIVE_ID_KEY);
  }
}

/**
 * Genera un titolo pulito e descrittivo a partire dal testo del prompt.
 */
export function generateSessionTitle(prompt: string): string {
  if (!prompt) return 'Nuova conversazione';
  // Rimuovi eventuali prefissi tecnici tipo [Repository: ...]
  const cleaned = prompt
    .replace(/^\[Repository:[^\]]+\]\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return 'Nuova conversazione';
  if (cleaned.length <= 42) return cleaned;
  return cleaned.slice(0, 40) + '…';
}

/**
 * Formatta un timestamp in una data/ora amichevole in lingua italiana.
 */
export function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return '';
  const now = Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);

  if (diffSec < 60) return 'Proprio ora';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m fa`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h fa`;

  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

  if (isToday) return `Oggi, ${timeStr}`;
  if (isYesterday) return `Ieri, ${timeStr}`;

  return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }) + ` ${timeStr}`;
}
