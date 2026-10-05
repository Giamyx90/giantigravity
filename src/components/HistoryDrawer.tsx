'use client';

import React, { useState } from 'react';
import { ChatSession } from '@/types';
import { formatRelativeTime } from '@/lib/history';
import {
  History,
  X,
  PlusCircle,
  Search,
  Trash2,
  MessageSquare,
  FolderGit2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { GithubIcon } from '@/components/GithubIcon';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (session: ChatSession) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  onClearAll: () => void;
}

export function HistoryDrawer({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClearAll,
}: HistoryDrawerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isConfirmingClearAll, setIsConfirmingClearAll] = useState(false);

  if (!isOpen) return null;

  const filteredSessions = sessions.filter((s) => {
    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase();
    const titleMatch = s.title.toLowerCase().includes(query);
    const repoMatch = `${s.repoContext.owner}/${s.repoContext.repo}`.toLowerCase().includes(query);
    const contentMatch = s.messages.some((m) => m.content.toLowerCase().includes(query));
    return titleMatch || repoMatch || contentMatch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-stretch justify-start bg-black/75 backdrop-blur-sm animate-fade-in">
      {/* Sliding Drawer Container */}
      <div className="relative w-full max-w-sm sm:max-w-md h-full bg-neutral-900 border-r border-neutral-800 shadow-2xl flex flex-col overflow-hidden text-neutral-100">
        {/* Drawer Header */}
        <div className="px-4 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/50">
              <History size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">Storico Conversazioni</h2>
              <p className="text-[10px] text-neutral-400">
                {sessions.length} {sessions.length === 1 ? 'chat registrata' : 'chat registrate'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                onNewChat();
                onClose();
              }}
              className="p-1.5 px-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-semibold text-xs flex items-center gap-1 shadow-sm transition-all"
              title="Nuova chat"
            >
              <PlusCircle size={14} />
              <span>Nuova</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Chiudi"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-neutral-800/80 bg-neutral-900/80 shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca nello storico..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500 font-sans"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredSessions.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-neutral-800/80 border border-neutral-700/50 flex items-center justify-center text-neutral-400">
                <MessageSquare size={22} />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-300">
                  {searchTerm ? 'Nessuna conversazione trovata' : 'Nessuna conversazione nello storico'}
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  {searchTerm
                    ? 'Prova a cercare con altre parole chiave.'
                    : 'Le tue chat con Giantigravity verranno salvate automaticamente qui.'}
                </p>
              </div>
              {!searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    onNewChat();
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-semibold text-xs transition-colors shadow-sm"
                >
                  <PlusCircle size={13} />
                  <span>Inizia una nuova chat</span>
                </button>
              )}
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isDeleting = confirmDeleteId === session.id;

              return (
                <div
                  key={session.id}
                  className={`group relative rounded-xl border transition-all text-left ${
                    isActive
                      ? 'bg-cyan-950/30 border-cyan-500/60 shadow-sm shadow-cyan-950/40'
                      : 'bg-neutral-950/60 hover:bg-neutral-950 border-neutral-800/80 hover:border-neutral-700'
                  }`}
                >
                  <div
                    onClick={() => {
                      if (!isDeleting) {
                        onSelectSession(session);
                        onClose();
                      }
                    }}
                    className="p-3 cursor-pointer pr-10"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                      )}
                      <h3
                        className={`text-xs font-medium truncate ${
                          isActive ? 'text-cyan-300 font-semibold' : 'text-neutral-200 group-hover:text-white'
                        }`}
                        title={session.title}
                      >
                        {session.title || 'Conversazione senza titolo'}
                      </h3>
                    </div>

                    <div className="flex items-center flex-wrap gap-2 text-[10px] text-neutral-400 font-mono">
                      {session.repoContext && (
                        <span className="flex items-center gap-1 text-neutral-400">
                          {session.repoContext.owner === 'local' ? (
                            <FolderGit2 size={10} className="text-cyan-400" />
                          ) : (
                            <GithubIcon size={10} className="text-neutral-500" />
                          )}
                          <span className="truncate max-w-[120px]">
                            {session.repoContext.owner}/{session.repoContext.repo}
                          </span>
                        </span>
                      )}

                      <span className="text-neutral-600">●</span>
                      <span>{session.messages?.length || 0} msg</span>

                      <span className="text-neutral-600">●</span>
                      <span className="text-neutral-500 font-sans">
                        {formatRelativeTime(session.updatedAt || session.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Delete Action Button */}
                  <div className="absolute right-2.5 top-3 flex items-center gap-1">
                    {isDeleting ? (
                      <div className="flex items-center gap-1 bg-neutral-900 border border-red-800/80 rounded-lg p-0.5 shadow-md">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(session.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-1.5 py-0.5 text-[10px] bg-red-600 hover:bg-red-500 text-white rounded font-medium"
                          title="Conferma eliminazione"
                        >
                          Elimina
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(null);
                          }}
                          className="px-1 py-0.5 text-[10px] text-neutral-400 hover:text-white"
                          title="Annulla"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(session.id);
                        }}
                        className="p-1 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-900 opacity-60 group-hover:opacity-100 transition-opacity"
                        title="Elimina conversazione"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        {sessions.length > 0 && (
          <div className="p-3 border-t border-neutral-800 bg-neutral-950/80 shrink-0 flex items-center justify-between text-xs">
            {isConfirmingClearAll ? (
              <div className="w-full flex items-center justify-between gap-2 p-1 bg-red-950/40 border border-red-800/60 rounded-xl">
                <span className="text-[11px] text-red-300 font-medium pl-1 flex items-center gap-1">
                  <AlertTriangle size={13} className="text-red-400" />
                  Eliminare tutto lo storico?
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      onClearAll();
                      setIsConfirmingClearAll(false);
                    }}
                    className="px-2 py-1 text-[11px] bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg shadow-sm"
                  >
                    Sì, cancella
                  </button>
                  <button
                    onClick={() => setIsConfirmingClearAll(false)}
                    className="px-2 py-1 text-[11px] text-neutral-400 hover:text-white"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsConfirmingClearAll(true)}
                className="text-[11px] text-neutral-400 hover:text-red-400 flex items-center gap-1.5 transition-colors py-1 px-2 rounded-lg hover:bg-neutral-900"
              >
                <Trash2 size={12} />
                <span>Cancella tutto lo storico</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Backdrop click outside to close */}
      <div className="flex-1 h-full cursor-pointer" onClick={onClose} />
    </div>
  );
}
