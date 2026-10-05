export type MessageRole = 'user' | 'assistant' | 'system';

export interface DiffChunk {
  added?: boolean;
  removed?: boolean;
  value: string;
}

export interface AgentStep {
  id: string;
  tool: string;
  summary: string;
  status: 'running' | 'completed' | 'error';
  args: Record<string, any>;
  result?: any;
  diff?: DiffChunk[];
  error?: string;
  timestamp: number;
}

export type AIProvider = 'antigravity' | 'google_oauth' | 'gemini_api';

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cachedTokens?: number;
}

export interface TokenStats {
  lifetimeTotal: number;
  lifetimePrompt: number;
  lifetimeCompletion: number;
  totalRequests: number;
  dailyUsage: Record<string, number>;
  modelUsage: Record<string, number>;
  budgetLimit?: number; // soglia limite in token impostata dall'utente (0 = disattivata)
  alertThresholdPct?: number; // percentuale di allerta, default 80
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  steps?: AgentStep[];
  conversationId?: string;
  timestamp: number;
  usage?: TokenUsage;
  model?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  repoContext: RepoContext;
  conversationId?: string;
  messages: ChatMessage[];
  totalTokens?: number;
}

export interface RepoContext {
  owner: string;
  repo: string;
  branch: string;
}

export interface UserSettings {
  provider?: AIProvider;
  githubToken?: string;
  geminiApiKey?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  googleAccessToken?: string;
  selectedModel: string;
}

export interface GitHubRepoItem {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
  description: string | null;
}

export interface AIModelOption {
  id: string;
  name: string;
  tier?: 'High' | 'Medium' | 'Low';
  tag?: string; // 'New' | 'Notice'
  description?: string;
}

export const AVAILABLE_MODELS: AIModelOption[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    tier: 'High',
    description: 'Modello predefinito ad altissime prestazioni per coding agentico',
  },
  {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash',
    tier: 'Medium',
    description: 'Bilanciato per task frequenti e modifica codice',
  },
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    tier: 'Medium',
    description: 'Modello Flash 3.6 per risposte veloci',
  },
];
