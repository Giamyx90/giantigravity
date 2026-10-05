import { TokenUsage, TokenStats, ChatMessage } from '@/types';

export const STORAGE_TOKEN_STATS_KEY = 'giantigravity_token_stats';

const DEFAULT_STATS: TokenStats = {
  lifetimeTotal: 0,
  lifetimePrompt: 0,
  lifetimeCompletion: 0,
  totalRequests: 0,
  dailyUsage: {},
  modelUsage: {},
  budgetLimit: 250000, // Budget di default: 250.000 token (~25 centesimi)
  alertThresholdPct: 80,
};

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Recupera le statistiche globali dei token salvate sul dispositivo.
 */
export function getTokenStats(): TokenStats {
  if (typeof window === 'undefined') return DEFAULT_STATS;
  try {
    const raw = localStorage.getItem(STORAGE_TOKEN_STATS_KEY);
    if (!raw) return DEFAULT_STATS;
    const parsed = JSON.parse(raw);
    return {
      lifetimeTotal: Number(parsed.lifetimeTotal) || 0,
      lifetimePrompt: Number(parsed.lifetimePrompt) || 0,
      lifetimeCompletion: Number(parsed.lifetimeCompletion) || 0,
      totalRequests: Number(parsed.totalRequests) || 0,
      dailyUsage: parsed.dailyUsage || {},
      modelUsage: parsed.modelUsage || {},
      budgetLimit: typeof parsed.budgetLimit === 'number' ? parsed.budgetLimit : 250000,
      alertThresholdPct: typeof parsed.alertThresholdPct === 'number' ? parsed.alertThresholdPct : 80,
    };
  } catch (e) {
    console.error('Errore lettura statistiche token:', e);
    return DEFAULT_STATS;
  }
}

/**
 * Salva le statistiche aggiornate nel localStorage.
 */
function saveStats(stats: TokenStats): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_TOKEN_STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Errore salvataggio statistiche token:', e);
  }
}

/**
 * Registra un nuovo consumo di token derivante da una risposta del modello.
 */
export function recordTokenUsage(usage: TokenUsage, model: string = 'gemini-3.8-flash'): TokenStats {
  const stats = getTokenStats();
  const today = getTodayKey();

  const prompt = Number(usage.promptTokens) || 0;
  const completion = Number(usage.completionTokens) || 0;
  const total = Number(usage.totalTokens) || prompt + completion;

  const updated: TokenStats = {
    ...stats,
    lifetimeTotal: stats.lifetimeTotal + total,
    lifetimePrompt: stats.lifetimePrompt + prompt,
    lifetimeCompletion: stats.lifetimeCompletion + completion,
    totalRequests: stats.totalRequests + 1,
    dailyUsage: {
      ...stats.dailyUsage,
      [today]: (stats.dailyUsage[today] || 0) + total,
    },
    modelUsage: {
      ...stats.modelUsage,
      [model]: (stats.modelUsage[model] || 0) + total,
    },
  };

  saveStats(updated);
  return updated;
}

/**
 * Imposta la soglia del budget massimo e la percentuale di pre-allerta.
 */
export function setTokenBudget(limit: number, thresholdPct: number = 80): TokenStats {
  const stats = getTokenStats();
  const updated: TokenStats = {
    ...stats,
    budgetLimit: limit,
    alertThresholdPct: thresholdPct,
  };
  saveStats(updated);
  return updated;
}

/**
 * Azzera tutte le statistiche storiche dei token conservando le preferenze di budget.
 */
export function resetTokenStats(): TokenStats {
  const current = getTokenStats();
  const resetStats: TokenStats = {
    ...DEFAULT_STATS,
    budgetLimit: current.budgetLimit,
    alertThresholdPct: current.alertThresholdPct,
  };
  saveStats(resetStats);
  return resetStats;
}

/**
 * Calcola la somma dei token consumati all'interno di una singola sessione chat.
 */
export function calculateSessionTokens(messages: ChatMessage[]): TokenUsage {
  let promptTokens = 0;
  let completionTokens = 0;
  let totalTokens = 0;
  let cachedTokens = 0;

  for (const msg of messages) {
    if (msg.usage) {
      promptTokens += msg.usage.promptTokens || 0;
      completionTokens += msg.usage.completionTokens || 0;
      totalTokens += msg.usage.totalTokens || 0;
      cachedTokens += msg.usage.cachedTokens || 0;
    }
  }

  return {
    promptTokens,
    completionTokens,
    totalTokens,
    cachedTokens,
  };
}

/**
 * Stima il conteggio approssimativo di token per un testo arbitrario (~3.8 caratteri per token).
 */
export function estimateTextTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 3.8));
}

/**
 * Formatta un numero di token per una visualizzazione compatta (es. 450, 1.2k, 45.8k, 1.2M).
 */
export function formatTokenCount(tokens: number): string {
  if (!tokens || tokens < 0) return '0';
  if (tokens < 1000) return tokens.toLocaleString('it-IT');
  if (tokens < 1000000) {
    const val = (tokens / 1000).toFixed(1).replace('.0', '');
    return `${val}k`;
  }
  const val = (tokens / 1000000).toFixed(2).replace('.00', '');
  return `${val}M`;
}

/**
 * Calcola una stima del costo in Dollari ($) ed Euro (€) in base al modello selezionato.
 * Prezzi di riferimento ufficiali Google Gemini Cloud:
 * - Flash (3.8 / 3.7 / 3.6 / 2.5): ~$0.10 / 1M token input, ~$0.40 / 1M token output (~$0.25 avg)
 * - Pro: ~$1.25 / 1M token input, ~$5.00 / 1M token output (~$2.50 avg)
 */
export function estimateCost(tokens: number, model: string = 'gemini-3.8-flash'): { usd: string; eur: string } {
  if (!tokens || tokens <= 0) {
    return { usd: '$0.0000', eur: '€0.0000' };
  }

  const isPro = model.toLowerCase().includes('pro') || model.toLowerCase().includes('opus');
  // Costo medio stimato per 1.000.000 di token
  const costPerMillion = isPro ? 2.50 : 0.25;
  const costUsd = (tokens / 1000000) * costPerMillion;
  const costEur = costUsd * 0.92; // Tasso di cambio indicativo USD/EUR

  if (costUsd < 0.0001) {
    return {
      usd: '< $0.0001',
      eur: '< €0.0001',
    };
  }

  if (costUsd < 0.01) {
    return {
      usd: `$${costUsd.toFixed(4)}`,
      eur: `€${costEur.toFixed(4)}`,
    };
  }

  return {
    usd: `$${costUsd.toFixed(3)}`,
    eur: `€${costEur.toFixed(3)}`,
  };
}

/**
 * Ottiene il consumo di token registrato per la giornata di oggi.
 */
export function getTodayTokens(stats: TokenStats): number {
  const today = getTodayKey();
  return stats.dailyUsage[today] || 0;
}
