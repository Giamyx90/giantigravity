'use client';

import React, { useState, useEffect } from 'react';
import { UserSettings, AVAILABLE_MODELS, AIProvider } from '@/types';
import { X, Key, Sparkles, Check, ExternalLink, ShieldCheck, Trash2, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';
import { GithubIcon } from '@/components/GithubIcon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (newSettings: UserSettings) => void;
  onClear?: () => void;
}

export function SettingsModal({ isOpen, onClose, settings, onSave, onClear }: SettingsModalProps) {
  const [provider, setProvider] = useState<AIProvider>(settings.provider || 'antigravity');
  const [githubToken, setGithubToken] = useState(settings.githubToken || '');
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey || '');
  const [selectedModel, setSelectedModel] = useState(settings.selectedModel || 'gemini-3.8-flash');
  const [savedNotice, setSavedNotice] = useState(false);
  const [antigravityStatus, setAntigravityStatus] = useState<{ available: boolean; path?: string } | null>(null);

  useEffect(() => {
    setProvider(settings.provider || 'antigravity');
    setGithubToken(settings.githubToken || '');
    setGeminiApiKey(settings.geminiApiKey || '');
    setSelectedModel(settings.selectedModel || 'gemini-3.8-flash');
  }, [settings, isOpen]);

  // Controlla la disponibilità del motore Antigravity sul PC
  useEffect(() => {
    if (isOpen) {
      fetch('/api/antigravity/status')
        .then((res) => res.json())
        .then((data) => setAntigravityStatus(data))
        .catch(() => setAntigravityStatus({ available: false }));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      provider,
      githubToken: githubToken.trim(),
      geminiApiKey: geminiApiKey.trim(),
      selectedModel,
    });
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    if (confirm('Vuoi rimuovere le tue impostazioni e credenziali da questo dispositivo?')) {
      setGithubToken('');
      setGeminiApiKey('');
      setProvider('antigravity');
      if (onClear) {
        onClear();
      } else {
        onSave({ provider: 'antigravity', githubToken: '', geminiApiKey: '', selectedModel });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-cyan-400" />
            <h2 className="text-base font-semibold text-neutral-100">Configurazione Motore AI</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Modalità / Engine Selector */}
          <div className="space-y-2">
            <label className="text-neutral-300 font-medium block">
              Motore di Esecuzione AI
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProvider('antigravity')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  provider === 'antigravity'
                    ? 'border-cyan-500 bg-cyan-950/30 text-white'
                    : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-cyan-300">
                  <Cpu size={14} />
                  <span>Antigravity CLI</span>
                </div>
                <span className="text-[10px] text-neutral-400 leading-tight">
                  Zero limiti, nessuna API Key. Usa la tua sessione Antigravity.
                </span>
                <div className="mt-1 flex items-center gap-1 text-[9px]">
                  {antigravityStatus?.available ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 size={10} /> Connesso al PC
                    </span>
                  ) : (
                    <span className="text-neutral-500">Rilevamento in corso...</span>
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setProvider('gemini_api')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  provider === 'gemini_api'
                    ? 'border-cyan-500 bg-cyan-950/30 text-white'
                    : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-300">
                  <Key size={14} />
                  <span>Google AI Studio</span>
                </div>
                <span className="text-[10px] text-neutral-400 leading-tight">
                  Usa API Key personale (ideale per server cloud come Vercel).
                </span>
                <div className="mt-1 text-[9px] text-neutral-500">
                  Quote AI Studio
                </div>
              </button>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="p-3 bg-cyan-950/20 border border-cyan-800/30 rounded-xl flex items-start gap-2.5 text-[11px] text-cyan-200/90 leading-relaxed">
            <ShieldCheck size={18} className="text-cyan-400 shrink-0 mt-0.5" />
            <div>
              {provider === 'antigravity' ? (
                <>
                  <span className="font-semibold block text-cyan-300 mb-0.5">Modalità Antigravity Windows Attiva</span>
                  Le richieste vengono eseguite direttamente tramite la CLI di Antigravity sul tuo PC Windows. Puoi usare la webapp dal browser o dal tuo smartphone senza preoccuparti delle limitazioni delle API Key.
                </>
              ) : (
                <>
                  <span className="font-semibold block text-cyan-300 mb-0.5">Credenziali Client-Side</span>
                  Nessuna chiave viene salvata sul server. I tuoi dati restano esclusivamente nella memoria locale di questo dispositivo.
                </>
              )}
            </div>
          </div>

          {/* Gemini API Key (Visible only in gemini_api mode) */}
          {provider === 'gemini_api' && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="flex items-center justify-between text-neutral-300 font-medium">
                <span className="flex items-center gap-1.5">
                  <Key size={14} className="text-cyan-400" />
                  La tua Google Gemini API Key
                </span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  Ottieni chiave gratuita <ExternalLink size={10} />
                </a>
              </label>
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="AIzaSyxxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <p className="text-[11px] text-neutral-500">
                Soggetto alle quote e ai limiti di chiamate al minuto del piano Google AI Studio.
              </p>
            </div>
          )}

          {/* GitHub Token */}
          <div className="space-y-1.5">
            <label className="flex items-center justify-between text-neutral-300 font-medium">
              <span className="flex items-center gap-1.5">
                <GithubIcon size={14} className="text-neutral-400" />
                GitHub Personal Access Token (Opzionale)
              </span>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
              >
                Genera token <ExternalLink size={10} />
              </a>
            </label>
            <input
              type="password"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <p className="text-[11px] text-neutral-500">
              Necessario solo se desideri sincronizzare o effettuare commit verso repository GitHub remoti privati.
            </p>
          </div>

          {/* Model Selection */}
          <div className="space-y-1.5">
            <label className="text-neutral-300 font-medium block">
              Modello AI Predefinito
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-cyan-500 font-mono text-xs"
            >
              {AVAILABLE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.tier ? `(${m.tier})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Submit & Reset actions */}
          <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
            {(githubToken || geminiApiKey) && (
              <button
                type="button"
                onClick={handleReset}
                className="text-rose-400 hover:text-rose-300 flex items-center gap-1 py-1.5 px-2 rounded-lg hover:bg-rose-950/30 transition-colors"
                title="Rimuovi credenziali da questo dispositivo"
              >
                <Trash2 size={13} />
                <span>Rimuovi credenziali</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                Chiudi
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-semibold flex items-center gap-1.5 transition-all shadow-md"
              >
                {savedNotice ? (
                  <>
                    <Check size={14} className="text-neutral-950" />
                    <span>Salvato!</span>
                  </>
                ) : (
                  <span>Salva Configurazione</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
