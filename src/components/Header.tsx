'use client';

import React, { useState, useEffect } from 'react';
import { RepoContext, GitHubRepoItem } from '@/types';
import {
  Sparkles,
  GitBranch,
  Settings,
  PlusCircle,
  ChevronDown,
  Loader2,
  RefreshCw,
  Lock,
  Zap,
} from 'lucide-react';
import { GithubIcon } from '@/components/GithubIcon';

interface HeaderProps {
  repoContext: RepoContext;
  onRepoChange: (newContext: RepoContext) => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  hasKeys: boolean;
  githubToken: string;
  isRepoModalOpen: boolean;
  setIsRepoModalOpen: (open: boolean) => void;
  selectedModel?: string;
  onOpenModelSelector?: () => void;
}

export function Header({
  repoContext,
  onRepoChange,
  onNewChat,
  onOpenSettings,
  hasKeys,
  githubToken,
  isRepoModalOpen,
  setIsRepoModalOpen,
  selectedModel = 'gemini-2.5-flash',
  onOpenModelSelector,
}: HeaderProps) {
  const [repos, setRepos] = useState<GitHubRepoItem[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Manual inputs fallback
  const [customOwner, setCustomOwner] = useState(repoContext.owner);
  const [customRepo, setCustomRepo] = useState(repoContext.repo);
  const [customBranch, setCustomBranch] = useState(repoContext.branch);

  useEffect(() => {
    setCustomOwner(repoContext.owner);
    setCustomRepo(repoContext.repo);
    setCustomBranch(repoContext.branch);
  }, [repoContext]);

  // When modal opens and token is available, automatically load repos
  useEffect(() => {
    if (isRepoModalOpen && githubToken && repos.length === 0) {
      fetchRepos();
    }
  }, [isRepoModalOpen, githubToken]);

  const fetchRepos = async () => {
    if (!githubToken) return;
    setLoadingRepos(true);
    try {
      const res = await fetch('/api/github/repos', {
        headers: { Authorization: `Bearer ${githubToken}` },
      });
      const data = await res.json();
      if (data.repos) {
        setRepos(data.repos);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRepos(false);
    }
  };

  const fetchBranches = async (owner: string, repo: string) => {
    if (!githubToken || !owner || !repo) return;
    setLoadingBranches(true);
    try {
      const res = await fetch(`/api/github/repos?owner=${owner}&repo=${repo}`, {
        headers: { Authorization: `Bearer ${githubToken}` },
      });
      const data = await res.json();
      if (data.branches) {
        setBranches(data.branches);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBranches(false);
    }
  };

  const openRepoSelector = () => {
    // Selection is only possible after entering configurations!
    if (!hasKeys || !githubToken) {
      onOpenSettings();
      return;
    }
    setIsRepoModalOpen(true);
  };

  const handleSelectRepo = (fullName: string, defaultBranch: string) => {
    const [owner, name] = fullName.split('/');
    setCustomOwner(owner);
    setCustomRepo(name);
    setCustomBranch(defaultBranch || 'main');
    fetchBranches(owner, name);
  };

  const handleConfirmRepo = () => {
    if (customOwner && customRepo) {
      onRepoChange({
        owner: customOwner.trim(),
        repo: customRepo.trim(),
        branch: customBranch.trim() || 'main',
      });
      setIsRepoModalOpen(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 px-3 py-2.5 sm:px-4 flex items-center justify-between safe-area-top">
        {/* App Title & Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-500 flex items-center justify-center shadow-md">
            <Sparkles size={15} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>Giantigravity</span>
            </h1>
          </div>
        </div>

        {/* Center: Active Repo & Branch Chip (Locked if no keys) */}
        <button
          onClick={openRepoSelector}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs transition-all max-w-[180px] sm:max-w-xs truncate ${
            hasKeys
              ? 'bg-neutral-800/90 hover:bg-neutral-800 border-neutral-700/60 text-neutral-200 cursor-pointer shadow-sm'
              : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-amber-500/50 hover:text-amber-400 cursor-pointer'
          }`}
          title={
            hasKeys
              ? 'Cambia repository o branch'
              : 'Configura prima le tue credenziali nelle impostazioni per sbloccare i repository'
          }
        >
          {hasKeys ? (
            <>
              <GithubIcon size={13} className="text-neutral-400 shrink-0" />
              <span className="truncate font-mono font-medium text-[11px]">
                {repoContext.owner ? `${repoContext.owner}/${repoContext.repo}` : 'Seleziona Repo'}
              </span>
              <span className="text-neutral-600">/</span>
              <span className="text-cyan-400 font-mono text-[10px] truncate">{repoContext.branch}</span>
              <ChevronDown size={12} className="text-neutral-500 shrink-0" />
            </>
          ) : (
            <>
              <Lock size={12} className="text-amber-400 shrink-0 animate-pulse" />
              <span className="text-[11px] text-neutral-400 truncate">Configura prima le chiavi</span>
            </>
          )}
        </button>

        {/* Actions: Model Switcher, New Chat & Settings */}
        <div className="flex items-center gap-1">
          {onOpenModelSelector && (
            <button
              onClick={onOpenModelSelector}
              className="p-1.5 px-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-cyan-300 border border-neutral-700/60 text-[11px] font-mono flex items-center gap-1 transition-colors"
              title="Cambia modello Google Gemini"
            >
              <Zap size={12} className="text-amber-400" />
              <span className="hidden sm:inline">{selectedModel.replace('gemini-', '')}</span>
              <ChevronDown size={11} className="text-neutral-400" />
            </button>
          )}

          <button
            onClick={onNewChat}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Nuova conversazione"
          >
            <PlusCircle size={17} />
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors relative"
            title="Impostazioni"
          >
            <Settings size={17} />
            {!hasKeys && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>
        </div>
      </header>

      {/* Repo Selection Modal (Only accessible after configurations) */}
      {isRepoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <GithubIcon size={17} className="text-neutral-300" />
                <h3 className="text-sm font-semibold text-neutral-100">Seleziona Repository & Branch</h3>
              </div>
              <button
                onClick={() => setIsRepoModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Remote List of Repos */}
              {githubToken && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-neutral-300">I tuoi repository GitHub:</span>
                    <button
                      onClick={fetchRepos}
                      disabled={loadingRepos}
                      className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <RefreshCw size={10} className={loadingRepos ? 'animate-spin' : ''} />
                      Aggiorna
                    </button>
                  </div>

                  {loadingRepos ? (
                    <div className="flex items-center justify-center p-4 text-neutral-500 gap-2">
                      <Loader2 size={16} className="animate-spin text-cyan-400" />
                      <span>Caricamento repository...</span>
                    </div>
                  ) : repos.length > 0 ? (
                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1 border border-neutral-800 rounded-xl p-1 bg-neutral-950">
                      {repos.map((r) => (
                        <div
                          key={r.id}
                          onClick={() => handleSelectRepo(r.full_name, r.default_branch)}
                          className={`p-2 rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                            customOwner === r.full_name.split('/')[0] && customRepo === r.name
                              ? 'bg-cyan-950/60 border border-cyan-800 text-cyan-200'
                              : 'hover:bg-neutral-900 text-neutral-300'
                          }`}
                        >
                          <span className="font-mono truncate">{r.full_name}</span>
                          <span className="text-[10px] text-neutral-500 font-mono">{r.default_branch}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-neutral-500 italic">
                      Nessun repository trovato o token con permessi ristretti. Puoi inserirlo manualmente qui sotto.
                    </p>
                  )}
                </div>
              )}

              {/* Manual Input Form */}
              <div className="pt-2 border-t border-neutral-800/80 space-y-3">
                <span className="font-medium text-neutral-300 block">Dettagli repository:</span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-neutral-500 block mb-1">Owner / Utente GitHub</label>
                    <input
                      type="text"
                      value={customOwner}
                      onChange={(e) => setCustomOwner(e.target.value)}
                      placeholder="es. Giamyx90"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500 block mb-1">Nome Repository</label>
                    <input
                      type="text"
                      value={customRepo}
                      onChange={(e) => setCustomRepo(e.target.value)}
                      placeholder="es. giantigravity"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-neutral-500 block mb-1">Branch attivo</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customBranch}
                      onChange={(e) => setCustomBranch(e.target.value)}
                      placeholder="main"
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-neutral-200 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                    {branches.length > 0 && (
                      <select
                        onChange={(e) => setCustomBranch(e.target.value)}
                        value={customBranch}
                        className="bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-1.5 text-neutral-200 text-xs font-mono"
                      >
                        {branches.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-neutral-800 flex items-center justify-end gap-2 bg-neutral-900/60">
              <button
                type="button"
                onClick={() => setIsRepoModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl text-neutral-400 hover:text-white"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleConfirmRepo}
                disabled={!customOwner || !customRepo}
                className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                Conferma Repository
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
