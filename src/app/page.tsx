'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, RepoContext, UserSettings, AgentStep, ChatSession } from '@/types';
import { Header } from '@/components/Header';
import { MessageBubble } from '@/components/MessageBubble';
import { ChatInput } from '@/components/ChatInput';
import { SettingsModal } from '@/components/SettingsModal';
import { ModelSelectorModal } from '@/components/ModelSelectorModal';
import { HistoryDrawer } from '@/components/HistoryDrawer';
import { TokenUsageModal } from '@/components/TokenUsageModal';
import { TokenStats } from '@/types';
import {
  calculateSessionTokens,
  getTokenStats,
  recordTokenUsage,
  formatTokenCount,
} from '@/lib/token-tracker';
import {
  getStoredSessions,
  saveSession,
  deleteSession,
  clearAllSessions,
  getActiveSessionId,
  setActiveSessionId,
  generateSessionTitle,
} from '@/lib/history';
import { Sparkles, GitBranch, Code2, Cpu, Smartphone, Lock, CheckCircle2, History, Zap } from 'lucide-react';
import { GithubIcon } from '@/components/GithubIcon';
import { useSession, signIn } from 'next-auth/react';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';

export default function Home() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRepoModalOpen, setIsRepoModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isAgyAvailable, setIsAgyAvailable] = useState<boolean | null>(null);
  const [tokenStats, setTokenStats] = useState<TokenStats>({
    lifetimeTotal: 0,
    lifetimePrompt: 0,
    lifetimeCompletion: 0,
    totalRequests: 0,
    dailyUsage: {},
    modelUsage: {},
    budgetLimit: 250000,
    alertThresholdPct: 80,
  });

  // History sessions list & active session
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionIdState] = useState<string | null>(null);

  // Settings & Context stored in localStorage for persistence on phone
  const [settings, setSettings] = useState<UserSettings>({
    provider: 'google_oauth',
    githubToken: '',
    selectedModel: 'gemini-3.8-flash',
  });

  const [repoContext, setRepoContext] = useState<RepoContext>({
    owner: 'local',
    repo: 'giantigravity',
    branch: 'main',
  });

  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Controlla disponibilità Antigravity locale nativo
  useEffect(() => {
    fetch('/api/antigravity/status')
      .then((res) => res.json())
      .then((data) => {
        setIsAgyAvailable(Boolean(data.available));
      })
      .catch(() => {
        setIsAgyAvailable(false);
      });
  }, []);

  // Load saved settings, repo & chat history from localStorage
  useEffect(() => {
    try {
      const savedSettings =
        localStorage.getItem('giantigravity_settings') ||
        localStorage.getItem('antigravity_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      } else {
        setSettings({
          provider: 'google_oauth',
          selectedModel: 'gemini-3.8-flash',
        });
      }
      const savedRepo =
        localStorage.getItem('giantigravity_repo') ||
        localStorage.getItem('antigravity_repo');
      if (savedRepo) {
        setRepoContext(JSON.parse(savedRepo));
      }

      // Carica lo storico delle conversazioni
      const loadedSessions = getStoredSessions();
      setSessions(loadedSessions);
      const activeId = getActiveSessionId();
      if (activeId) {
        const current = loadedSessions.find((s) => s.id === activeId);
        if (current) {
          setActiveSessionIdState(current.id);
          setMessages(current.messages || []);
          setConversationId(current.conversationId);
          if (current.repoContext) {
            setRepoContext(current.repoContext);
          }
        }
      }

      // Carica statistiche e soglia di controllo token
      setTokenStats(getTokenStats());
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const handleOpenSettings = () => {
      setIsSettingsOpen(true);
    };
    window.addEventListener('open-settings', handleOpenSettings);
    return () => window.removeEventListener('open-settings', handleOpenSettings);
  }, []);

  const handleSaveSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    localStorage.setItem('giantigravity_settings', JSON.stringify(newSettings));
    if (newSettings.githubToken && (!repoContext.owner || repoContext.owner === 'local')) {
      setTimeout(() => {
        setIsRepoModalOpen(true);
      }, 500);
    }
  };

  const handleClearSettings = () => {
    const emptySettings: UserSettings = {
      provider: 'google_oauth',
      selectedModel: 'gemini-3.8-flash',
    };
    setSettings(emptySettings);
    setConversationId(undefined);
    setRepoContext({ owner: 'local', repo: 'giantigravity', branch: 'main' });
    localStorage.removeItem('giantigravity_settings');
    localStorage.removeItem('giantigravity_repo');
    localStorage.removeItem('antigravity_settings');
    localStorage.removeItem('antigravity_repo');
  };

  const handleRepoChange = (newContext: RepoContext) => {
    setRepoContext(newContext);
    localStorage.setItem('giantigravity_repo', JSON.stringify(newContext));
  };

  const handleSelectModel = (modelId: string) => {
    const updated = { ...settings, selectedModel: modelId };
    setSettings(updated);
    localStorage.setItem('giantigravity_settings', JSON.stringify(updated));
  };

  const handleNewChat = () => {
    if (isLoading) return;
    setActiveSessionIdState(null);
    setActiveSessionId(null);
    setConversationId(undefined);
    setMessages([]);
  };

  const handleSelectSession = (session: ChatSession) => {
    if (isLoading) return;
    setActiveSessionIdState(session.id);
    setActiveSessionId(session.id);
    setMessages(session.messages || []);
    setConversationId(session.conversationId);
    if (session.repoContext) {
      setRepoContext(session.repoContext);
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId);
    const updated = getStoredSessions();
    setSessions(updated);
    if (activeSessionId === sessionId) {
      handleNewChat();
    }
  };

  const handleClearAllSessions = () => {
    clearAllSessions();
    setSessions([]);
    handleNewChat();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const isGoogleLoggedIn = Boolean(session?.user);
  const hasOAuthClientKeys = Boolean(settings.googleClientId && settings.googleClientSecret);
  const hasConfig = isGoogleLoggedIn || Boolean(isAgyAvailable) || Boolean(settings.geminiApiKey);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    if (!hasConfig) {
      if (hasOAuthClientKeys && !isGoogleLoggedIn) {
        signIn('google');
        return;
      }
      setIsSettingsOpen(true);
      return;
    }

    const targetSessionId = activeSessionId || `session-${Date.now()}`;
    if (!activeSessionId) {
      setActiveSessionIdState(targetSessionId);
      setActiveSessionId(targetSessionId);
    }

    let activeRepo = repoContext;
    if (!activeRepo.owner || !activeRepo.repo) {
      activeRepo = { owner: 'local', repo: 'giantigravity', branch: 'main' };
      setRepoContext(activeRepo);
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const assistantId = `asst-${Date.now()}`;
    const initialAssistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      steps: [],
      timestamp: Date.now(),
    };

    let currentMessages: ChatMessage[] = [...messages, userMessage, initialAssistantMessage];
    let latestConversationId: string | undefined = conversationId;

    setMessages(currentMessages);
    setIsLoading(true);

    // Multi-turn history: includi i messaggi precedenti completi
    const historyPayload = messages
      .filter((m) => m.content && m.content.trim())
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          repoContext: activeRepo,
          conversationId,
          history: historyPayload,
          googleAccessToken: (session as any)?.accessToken || settings.googleAccessToken,
          settings,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nella richiesta.');
      }

      if (!response.body) {
        throw new Error('Nessun flusso di risposta ricevuto.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (!dataStr) continue;

            try {
              const event = JSON.parse(dataStr);

              if (event.type === 'step') {
                const updatedStep: AgentStep = event.step;
                currentMessages = currentMessages.map((msg) => {
                  if (msg.id !== assistantId) return msg;
                  const existingSteps = msg.steps || [];
                  const stepIndex = existingSteps.findIndex((s) => s.id === updatedStep.id);

                  let newSteps: AgentStep[];
                  if (stepIndex >= 0) {
                    newSteps = [...existingSteps];
                    newSteps[stepIndex] = updatedStep;
                  } else {
                    newSteps = [...existingSteps, updatedStep];
                  }

                  return { ...msg, steps: newSteps };
                });
                setMessages(currentMessages);
              } else if (event.type === 'chunk') {
                const chunkText = event.text;
                currentMessages = currentMessages.map((msg) =>
                  msg.id === assistantId ? { ...msg, content: msg.content + chunkText } : msg
                );
                setMessages(currentMessages);
              } else if (event.type === 'init') {
                if (event.conversationId) {
                  latestConversationId = event.conversationId;
                  setConversationId(event.conversationId);
                }
              } else if (event.type === 'done') {
                if (event.conversationId) {
                  latestConversationId = event.conversationId;
                  setConversationId(event.conversationId);
                }
                if (event.usage) {
                  const updatedStats = recordTokenUsage(event.usage, event.model || settings.selectedModel);
                  setTokenStats(updatedStats);
                }
                currentMessages = currentMessages.map((msg) =>
                  msg.id === assistantId
                    ? {
                        ...msg,
                        content: event.reply || msg.content,
                        steps: event.steps || msg.steps,
                        conversationId: event.conversationId,
                        usage: event.usage || msg.usage,
                        model: event.model || settings.selectedModel,
                      }
                    : msg
                );
                setMessages(currentMessages);
              } else if (event.type === 'error') {
                currentMessages = currentMessages.map((msg) =>
                  msg.id === assistantId
                    ? {
                        ...msg,
                        content: `⚠️ **Errore riscontrato dall'agente:**\n${event.error}`,
                      }
                    : msg
                );
                setMessages(currentMessages);
              }
            } catch (err) {
              console.error('Error parsing SSE event', err);
            }
          }
        }
      }
    } catch (err: any) {
      currentMessages = currentMessages.map((msg) =>
        msg.id === assistantId
          ? {
              ...msg,
              content: `⚠️ **Errore:** ${err.message || 'Impossibile completare la richiesta.'}`,
            }
          : msg
      );
      setMessages(currentMessages);
    } finally {
      setIsLoading(false);
      // Salva e sincronizza la sessione nello storico persistente con conteggio token
      try {
        const stored = getStoredSessions();
        const existing = stored.find((s) => s.id === targetSessionId);
        const sessionTitle = existing?.title || generateSessionTitle(text);
        const totalSessionTokens = currentMessages.reduce(
          (acc, m) => acc + (m.usage?.totalTokens || 0),
          0
        );
        const sessionToSave: ChatSession = {
          id: targetSessionId,
          title: sessionTitle,
          createdAt: existing?.createdAt || Date.now(),
          updatedAt: Date.now(),
          repoContext: activeRepo,
          conversationId: latestConversationId,
          messages: currentMessages,
          totalTokens: totalSessionTokens,
        };
        saveSession(sessionToSave);
        setSessions(getStoredSessions());
      } catch (saveErr) {
        console.error('Errore durante il salvataggio della sessione:', saveErr);
      }
    }
  };

  const sessionTokens = calculateSessionTokens(messages);
  const budgetLimit = tokenStats.budgetLimit || 0;
  const isOverBudget = budgetLimit > 0 && tokenStats.lifetimeTotal >= budgetLimit;
  const isNearBudget =
    budgetLimit > 0 &&
    !isOverBudget &&
    (tokenStats.lifetimeTotal / budgetLimit) * 100 >= (tokenStats.alertThresholdPct || 80);

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh] w-full bg-neutral-950 text-neutral-100 font-sans overflow-hidden">
      {/* Top Header */}
      <Header
        repoContext={repoContext}
        onRepoChange={handleRepoChange}
        onNewChat={handleNewChat}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={sessions.length}
        hasKeys={hasConfig}
        githubToken={settings.githubToken || ''}
        isRepoModalOpen={isRepoModalOpen}
        setIsRepoModalOpen={setIsRepoModalOpen}
        selectedModel={settings.selectedModel}
        provider={settings.provider || 'antigravity'}
        onOpenModelSelector={() => setIsModelModalOpen(true)}
        isAgyAvailable={Boolean(isAgyAvailable)}
        onOpenTokenModal={() => setIsTokenModalOpen(true)}
        sessionTokens={sessionTokens.totalTokens}
        isOverBudget={isOverBudget}
        isNearBudget={isNearBudget}
      />

      {/* Main Chat Messages View */}
      <main className="flex-1 min-h-0 overflow-y-auto px-2 sm:px-6 py-4 flex flex-col justify-start">
        {messages.length === 0 ? (
          <div className="my-auto max-w-lg mx-auto text-center px-4 py-8 space-y-6">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-cyan-500/10">
              <Sparkles size={32} className="text-white" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Giantigravity</h2>
              <p className="text-xs text-neutral-400 mt-1">
                L&apos;IDE agentico per sviluppare sul tuo repo GitHub dallo smartphone con Google Gemini
              </p>
            </div>

            {/* Quick Resume Recent Chat from History */}
            {sessions.length > 0 && (
              <div
                onClick={() => setIsHistoryOpen(true)}
                className="cursor-pointer p-3 bg-neutral-900/90 border border-neutral-800 hover:border-cyan-500/50 rounded-2xl text-left flex items-center justify-between text-xs transition-all shadow-md group"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="p-2 rounded-xl bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 shrink-0 group-hover:scale-105 transition-transform">
                    <History size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-white block text-xs">Storico Conversazioni</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono font-medium">
                        {sessions.length} {sessions.length === 1 ? 'chat' : 'chat'}
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-400 truncate block mt-0.5">
                      Ultima: &ldquo;{sessions[0].title}&rdquo;
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-cyan-400 font-medium group-hover:translate-x-0.5 transition-transform shrink-0">
                  Visualizza ➔
                </span>
              </div>
            )}

            {/* Quick Token Control Card */}
            <div
              onClick={() => setIsTokenModalOpen(true)}
              className="cursor-pointer p-3 bg-neutral-900/90 border border-neutral-800 hover:border-amber-500/50 rounded-2xl text-left flex items-center justify-between text-xs transition-all shadow-md group"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="p-2 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-800/40 shrink-0 group-hover:scale-105 transition-transform">
                  <Zap size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-white block text-xs">Controllo Consumi Token</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800/60 font-mono font-medium">
                      {formatTokenCount(tokenStats.lifetimeTotal)} totali
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-400 truncate block mt-0.5">
                    {budgetLimit > 0
                      ? `Budget: ${formatTokenCount(tokenStats.lifetimeTotal)} / ${formatTokenCount(budgetLimit)} (${Math.round((tokenStats.lifetimeTotal / budgetLimit) * 100)}%)`
                      : 'Nessun limite impostato (tocca per configurare)'}
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-amber-400 font-medium group-hover:translate-x-0.5 transition-transform shrink-0">
                Gestisci ➔
              </span>
            </div>

            {/* Google Sign-in Card */}
            <GoogleSignInButton
              variant={session?.user ? 'full' : 'card'}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />

            {/* Avviso se loggato ma senza token aggiornato */}
            {isGoogleLoggedIn && !(session as any)?.accessToken && (
              <div
                onClick={() => signIn('google')}
                className="cursor-pointer p-4 bg-gradient-to-r from-amber-950/40 to-yellow-950/30 border border-amber-600/70 rounded-2xl text-left hover:border-amber-400 transition-all shadow-lg group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                    <Sparkles size={15} className="text-amber-400" />
                    <span>Sessione Google da Sincronizzare</span>
                  </div>
                  <span className="text-[10px] text-amber-300 font-bold px-2.5 py-0.5 rounded-full bg-amber-950 border border-amber-700 animate-pulse">
                    Riautentica ➔
                  </span>
                </div>
                <p className="text-[11px] text-neutral-200 leading-relaxed">
                  Il tuo account Google è collegato, ma il token di sessione risale a prima dell&apos;ultimo aggiornamento dei permessi. Tocca qui o fai Esci e Accedi per rinnovare la sessione.
                </p>
              </div>
            )}

            {/* Step-by-Step Onboarding Cards */}
            {isAgyAvailable ? (
              <div className="p-4 bg-gradient-to-r from-emerald-950/40 via-teal-950/20 to-neutral-900 border border-emerald-600/60 rounded-2xl text-left shadow-lg">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs">
                    <Sparkles size={15} className="text-emerald-400" />
                    <span>Antigravity Locale Attivo</span>
                  </div>
                  <span className="text-[10px] text-emerald-300 font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-600">
                    Nativo PC ● Connesso
                  </span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  Giantigravity è connesso al motore Google Antigravity sul tuo PC. Nessuna API key o login richiesto: scrivi direttamente qui sotto per programmare!
                </p>
              </div>
            ) : !isGoogleLoggedIn ? (
              <div
                onClick={() => {
                  if (hasOAuthClientKeys) {
                    signIn('google');
                  } else {
                    setIsSettingsOpen(true);
                  }
                }}
                className="cursor-pointer p-4 bg-gradient-to-r from-blue-950/40 to-cyan-950/30 border border-blue-700/60 rounded-2xl text-left hover:border-cyan-400 transition-all shadow-lg group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs">
                    <Sparkles size={15} className="text-cyan-400" />
                    <span>Accesso Richiesto</span>
                  </div>
                  <span className="text-[10px] text-cyan-300 font-bold px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-700 animate-pulse">
                    {hasOAuthClientKeys ? 'Accedi ora ➔' : 'Configura Client ID ➔'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-200 leading-relaxed">
                  {hasOAuthClientKeys
                    ? "Tocca qui o su 'Accedi con Google' per entrare nell'IDE con il tuo account Google, esattamente come in Antigravity."
                    : "Tocca qui per inserire il tuo Google Client ID nelle impostazioni ed effettuare l'accesso con Google."}
                </p>
              </div>
            ) : !repoContext.owner ? (
              <div
                onClick={() => setIsRepoModalOpen(true)}
                className="cursor-pointer p-4 bg-cyan-950/30 border border-cyan-800/60 rounded-2xl text-left hover:border-cyan-500 transition-all shadow-md animate-pulse"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
                    <GithubIcon size={15} />
                    <span>Passaggio 2: Seleziona il Repository</span>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-semibold px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800">
                    Sbloccato
                  </span>
                </div>
                <p className="text-[11px] text-neutral-200">
                  Credenziali configurate con successo! Tocca qui per scegliere il repository e il branch su cui vuoi iniziare a programmare.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-2xl text-left flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-neutral-200 truncate pr-2">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span className="font-mono font-medium truncate">
                    {repoContext.owner}/{repoContext.repo}
                  </span>
                  <span className="text-cyan-400 font-mono text-[10px] shrink-0">
                    ({repoContext.branch})
                  </span>
                </div>
                <button
                  onClick={() => setIsRepoModalOpen(true)}
                  className="text-cyan-400 hover:underline text-[11px] shrink-0"
                >
                  Cambia
                </button>
              </div>
            )}

            {/* Quick Test Prompt Buttons */}
            <div className="space-y-1.5 text-left">
              <div className="text-[11px] text-neutral-400 font-medium px-1 flex items-center gap-1">
                <Sparkles size={12} className="text-cyan-400" />
                <span>Test rapido connessione:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSendMessage('Ciao! Fai un test rapido e spiegami cosa puoi fare su questo repository.')}
                  className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white text-[11px] text-left transition-all flex items-center justify-between group shadow-sm"
                >
                  <span className="truncate">👋 &ldquo;Fai un test rapido&rdquo;</span>
                  <span className="text-[10px] text-cyan-400 group-hover:translate-x-0.5 transition-transform shrink-0 font-medium">Invia ➔</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage('Quali file sono presenti nel repository? Mostrami la struttura di base.')}
                  className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white text-[11px] text-left transition-all flex items-center justify-between group shadow-sm"
                >
                  <span className="truncate">📂 &ldquo;Mostrami i file del progetto&rdquo;</span>
                  <span className="text-[10px] text-cyan-400 group-hover:translate-x-0.5 transition-transform shrink-0 font-medium">Invia ➔</span>
                </button>
              </div>
            </div>

            {/* Capabilities grid */}
            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="p-3 bg-neutral-900/60 border border-neutral-800/80 rounded-xl space-y-1">
                <Code2 size={16} className="text-cyan-400" />
                <h3 className="font-semibold text-xs text-neutral-200">Diff & Commits</h3>
                <p className="text-[10px] text-neutral-500">
                  Scrive file e visualizza le modifiche riga per riga con codice a colori.
                </p>
              </div>

              <div className="p-3 bg-neutral-900/60 border border-neutral-800/80 rounded-xl space-y-1">
                <Smartphone size={16} className="text-emerald-400" />
                <h3 className="font-semibold text-xs text-neutral-200">Mobile & Voce</h3>
                <p className="text-[10px] text-neutral-500">
                  Dettatura vocale con Web Speech API e layout touch per smartphone.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl w-full mx-auto pb-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Bottom Sticky Input */}
      <div className="w-full max-w-3xl mx-auto shrink-0">
        <ChatInput
          onSend={handleSendMessage}
          isLoading={isLoading}
          disabled={isLoading}
          currentModel={settings.selectedModel}
          onOpenModelSelector={() => setIsModelModalOpen(true)}
        />
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
        onClear={handleClearSettings}
      />

      {/* Model Selector Modal */}
      <ModelSelectorModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        selectedModel={settings.selectedModel}
        onSelectModel={handleSelectModel}
      />

      {/* History Drawer Modal */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onClearAll={handleClearAllSessions}
      />

      {/* Token Usage & Spending Control Modal */}
      <TokenUsageModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        sessionUsage={sessionTokens}
        activeModel={settings.selectedModel}
        onStatsChanged={() => setTokenStats(getTokenStats())}
      />
    </div>
  );
}
