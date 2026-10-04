'use client';

import React, { useState, useEffect } from 'react';
import { UserSettings, AVAILABLE_MODELS } from '@/types';
import { X, Key, Sparkles, Check, ExternalLink, ShieldCheck, Trash2 } from 'lucide-react';
import { GithubIcon } from '@/components/GithubIcon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (newSettings: UserSettings) => void;
  onClear?: () => void;
}

export function SettingsModal({ isOpen, onClose, settings, onSave, onClear }: SettingsModalProps) {
  const [githubToken, setGithubToken] = useState(settings.githubToken || '');
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey || '');
  const [selectedModel, setSelectedModel] = useState(settings.selectedModel || 'gemini-2.5-flash');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setGithubToken(settings.githubToken || '');
    setGeminiApiKey(settings.geminiApiKey || '');
    setSelectedModel(settings.selectedModel || 'gemini-2.5-flash');
  }, [settings, isOpen]);

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
    }, 800);
  };

  const handleReset = () => {
    if (confirm('Vuoi rimuovere le tue credenziali da questo dispositivo?')) {
      setGithubToken('');
      setGeminiApiKey('');
      if (onClear) {
        onClear();
      } else {
        onSave({ githubToken: '', geminiApiKey: '', selectedModel });
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
            <h2 className="text-base font-semibold text-neutral-100">Configurazione Personale</h2>
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
          {/* Privacy & Multi-User notice */}
          <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl flex items-start gap-2.5 text-[11px] text-cyan-200/90 leading-relaxed">
            <ShieldCheck size={18} className="text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-cyan-300 mb-0.5">Credenziali 100% Personali & Private</span>
              Nessuna chiave viene salvata sul server. I tuoi dati restano esclusivamente nella memoria locale di questo dispositivo (browser/telefono). Chiunque acceda alla web app deve configurare le proprie chiavi personali.
            </div>
          </div>

          {/* GitHub Token */}
          <div className="space-y-1.5">
            <label className="flex items-center justify-between text-neutral-300 font-medium">
              <span className="flex items-center gap-1.5">
                <GithubIcon size={14} className="text-neutral-400" />
                Il tuo GitHub Personal Access Token (PAT)
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
              Permette a Gemini di leggere e modificare solo i repository a cui il tuo account GitHub ha accesso.
            </p>
          </div>

          {/* Gemini API Key */}
          <div className="space-y-1.5">
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
              Ogni utente usa la propria quota gratuita di Google Gemini (Gemini 2.5 Flash / Pro).
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
                  <span>Salva Credenziali</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
