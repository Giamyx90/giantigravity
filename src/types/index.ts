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
