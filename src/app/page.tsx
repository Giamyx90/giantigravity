'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, RepoContext, UserSettings, AgentStep } from '@/types';
import { Header } from '@/components/Header';
import { MessageBubble } from '@/components/MessageBubble';
import { ChatInput } from '@/components/ChatInput';
import { SettingsModal } from '@/components/SettingsModal';
import { Sparkles, GitBranch, Code2, Cpu, Smartphone } from 'lucide-react';
import { GithubIcon } from '@/components/GithubIcon';

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Settings & Context stored in localStorage for persistence on phone
  const [settings, setSettings] = useState<UserSettings>({
    githubToken: '',
    geminiApiKey: '',
    selectedModel: 'gemini-2.5-flash',
  });

  const [repoContext, setRepoContext] = useState<RepoContext>({
    owner: '',
    repo: '',
    branch: 'main',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load saved settings & repo from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('antigravity_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
      const savedRepo = localStorage.getItem('antigravity_repo');
      if (savedRepo) {
        setRepoContext(JSON.parse(savedRepo));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSaveSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    localStorage.setItem('antigravity_settings', JSON.stringify(newSettings));
  };

  const handleRepoChange = (newContext: RepoContext) => {
    setRepoContext(newContext);
    localStorage.setItem('antigravity_repo', JSON.stringify(newContext));
  };

  const handleNewChat = () => {
    if (isLoading) return;
    setMessages([]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    if (!repoContext.owner || !repoContext.repo) {
      setIsSettingsOpen(true);
      return;
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

    setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          repoContext,
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
                setMessages((prev) =>
                  prev.map((msg) => {
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
                  })
                );
              } else if (event.type === 'chunk') {
                const chunkText = event.text;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantId ? { ...msg, content: msg.content + chunkText } : msg
                  )
                );
              } else if (event.type === 'done') {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantId
                      ? {
                          ...msg,
                          content: event.reply || msg.content,
                          steps: event.steps || msg.steps,
                        }
                      : msg
                  )
                );
              } else if (event.type === 'error') {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantId
                      ? {
                          ...msg,
                          content: `⚠️ **Errore riscontrato dall'agente:**\n${event.error}`,
                        }
                      : msg
                  )
                );
              }
            } catch (err) {
              console.error('Error parsing SSE event', err);
            }
          }
        }
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content: `⚠️ **Errore:** ${err.message || 'Impossibile completare la richiesta.'}`,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const hasConfig = Boolean(
    (settings.githubToken || process.env.NEXT_PUBLIC_HAS_GH_TOKEN) &&
      (settings.geminiApiKey || process.env.NEXT_PUBLIC_HAS_GEMINI_KEY)
  );

  return (
    <div className="flex flex-col h-screen w-full bg-neutral-950 text-neutral-100 font-sans overflow-hidden">
      {/* Top Header */}
      <Header
        repoContext={repoContext}
        onRepoChange={handleRepoChange}
        onNewChat={handleNewChat}
        onOpenSettings={() => setIsSettingsOpen(true)}
        hasKeys={hasConfig}
        githubToken={settings.githubToken}
      />

      {/* Main Chat Messages View */}
      <main className="flex-1 overflow-y-auto px-2 sm:px-6 py-4 flex flex-col justify-start">
        {messages.length === 0 ? (
          <div className="my-auto max-w-lg mx-auto text-center px-4 py-8 space-y-6">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-cyan-500/10">
              <Sparkles size={32} className="text-white" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Antigravity Mobile</h2>
              <p className="text-xs text-neutral-400 mt-1">
                L&apos;IDE agentico per sviluppare sul tuo repo GitHub dallo smartphone con Google Gemini
              </p>
            </div>

            {/* Status Card */}
            {(!repoContext.owner || !settings.githubToken) && (
              <div
                onClick={() => setIsSettingsOpen(true)}
                className="cursor-pointer p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl text-left hover:border-cyan-500/50 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs mb-1">
                  <GithubIcon size={15} />
                  <span>Configurazione iniziale</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  {!settings.githubToken
                    ? 'Tocca qui per inserire il tuo GitHub Token e la chiave Gemini API.'
                    : 'Tocca l\'intestazione in alto per selezionare il repository da modificare.'}
                </p>
              </div>
            )}

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
          disabled={!repoContext.owner || !repoContext.repo}
        />
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
