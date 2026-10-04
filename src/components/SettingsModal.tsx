'use client';

import React, { useState } from 'react';
import { UserSettings } from '@/types';
import { X, Key, Sparkles, Check, ExternalLink, ShieldCheck } from 'lucide-react';
import { GithubIcon } from '@/components/GithubIcon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (newSettings: UserSettings) => void;
}

export function SettingsModal({ isOpen, onClose, settings, onSave }: SettingsModalProps) {
  const [githubToken, setGithubToken] = useState(settings.githubToken || '');
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey || '');
  const [selectedModel, setSelectedModel] = useState(settings.selectedModel || 'gemini-2.5-flash');
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      githubToken: githubToken.trim(),
      geminiApiKey: geminiApiKey.trim(),
      selectedModel,
    });
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-cyan-400" />
            <h2 className="text-base font-semibold text-neutral-100">Impostazioni & Chiavi</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* GitHub Token */}
          <div className="space-y-1.5">
            <label className="flex items-center justify-between text-neutral-300 font-medium">
              <span className="flex items-center gap-1.5">
                <GithubIcon size={14} className="text-neutral-400" />
                GitHub Personal Access Token (PAT)
              </span>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
              >
                Crea token <ExternalLink size={10} />
              </a>
            </label>
            <input
              type="password"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxx..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <p className="text-[11px] text-neutral-500">
              Serve per leggere i file, creare commit e Pull Request sul tuo repository.
            </p>
          </div>

          {/* Gemini API Key */}
          <div className="space-y-1.5">
            <label className="flex items-center justify-between text-neutral-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Key size={14} className="text-cyan-400" />
                Google Gemini API Key
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
              placeholder="AIzaSyxxxxxxxxxxxx..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <p className="text-[11px] text-neutral-500">
              Puoi inserirla qui o impostarla direttamente come variabile <code className="text-neutral-400">GEMINI_API_KEY</code> su Vercel.
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
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultra veloce, consigliato per mobile)</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (Massimo ragionamento su codebase complesse)</option>
            </select>
          </div>

          {/* Security / Info */}
          <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl flex items-start gap-2.5 text-[11px] text-neutral-400">
            <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <p>
              I token vengono conservati in modo sicuro nella memoria del tuo dispositivo e usati solo per comunicare con GitHub e Google AI.
            </p>
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              Annulla
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
        </form>
      </div>
    </div>
  );
}
