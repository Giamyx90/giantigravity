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

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  steps?: AgentStep[];
  timestamp: number;
}

export interface RepoContext {
  owner: string;
  repo: string;
  branch: string;
}

export interface UserSettings {
  githubToken: string;
  geminiApiKey: string;
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
  badge: string;
  description: string;
  isNew?: boolean;
}

export const AVAILABLE_MODELS: AIModelOption[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    badge: 'Consigliato',
    description: 'Velocissimo e multimodale, ideale per task rapidi e smartphone',
    isNew: true,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    badge: 'Coding Avanzato',
    description: 'Capacità di ragionamento profonde per architetture e refactor complessi',
    isNew: true,
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    badge: 'Next Gen',
    description: 'Modello di nuova generazione con bassissima latenza',
    isNew: true,
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    badge: '2M Context',
    description: 'Finestra di contesto enorme per analizzare interi repository',
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    badge: 'Leggero',
    description: 'Modello economico e veloce per compiti ordinari',
  },
];
