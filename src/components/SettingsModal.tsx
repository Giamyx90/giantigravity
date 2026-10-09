'use client';

import React, { useState, useEffect } from 'react';
import { UserSettings, AVAILABLE_MODELS, AIProvider } from '@/types';
import {
  X,
  Sparkles,
  Check,
  ExternalLink,
  ShieldCheck,
  Trash2,
  Copy,
  CheckCircle2,
  KeyRound,
  Laptop,
  Globe,
  Key,
} from 'lucide-react';
import { GithubIcon } from '@/components/GithubIcon';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (newSettings: UserSettings) => void;
  onClear?: () => void;
}

export function SettingsModal({ isOpen, onClose, settings, onSave, onClear }: SettingsModalProps) {
  const [provider, setProvider] = useState<AIProvider>(settings.provider || 'google_oauth');
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey || '');
  const [googleClientId, setGoogleClientId] = useState(settings.googleClientId || '');
  const [googleClientSecret, setGoogleClientSecret] = useState(settings.googleClientSecret || '');
  const [githubToken, setGithubToken] = useState(settings.githubToken || '');
  const [selectedModel, setSelectedModel] = useState(settings.selectedModel || 'gemini-3.8-flash');
  const [showOAuthSetup, setShowOAuthSetup] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [copiedUri, setCopiedUri] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState('');
  const [isAgyAvailable, setIsAgyAvailable] = useState(false);

  useEffect(() => {
    setProvider(settings.provider || 'google_oauth');
    setGeminiApiKey(settings.geminiApiKey || '');
    setGoogleClientId(settings.googleClientId || '');
    setGoogleClientSecret(settings.googleClientSecret || '');
    setGithubToken(settings.githubToken || '');
    setSelectedModel(settings.selectedModel || 'gemini-3.8-flash');
  }, [settings, isOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCallbackUrl(`${window.location.origin}/api/auth/callback/google`);
    }
    if (isOpen) {
      fetch('/api/antigravity/status')
        .then((res) => res.json())
        .then((d) => setIsAgyAvailable(Boolean(d.available)))
        .catch(() => setIsAgyAvailable(false));
    }
  }, [isOpen]);

  useEffect(() => {
    const handleCustom = (e: any) => {
      if (e?.detail?.focus === 'oauth') {
        setShowOAuthSetup(true);
      }
    };
    window.addEventListener('open-settings', handleCustom);
    return () => window.removeEventListener('open-settings', handleCustom);
  }, []);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Imposta cookie nel browser per consentire a NextAuth di leggere Client ID e Secret dinamici
    if (typeof document !== 'undefined') {
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const secureFlag = isHttps ? '; Secure' : '';
      if (googleClientId.trim()) {
        document.cookie = `google_client_id=${encodeURIComponent(googleClientId.trim())}; path=/; max-age=31536000; SameSite=Lax${secureFlag}`;
      } else {
        document.cookie = 'google_client_id=; path=/; max-age=0; SameSite=Lax';
      }
      if (googleClientSecret.trim()) {
        document.cookie = `google_client_secret=${encodeURIComponent(googleClientSecret.trim())}; path=/; max-age=31536000; SameSite=Lax${secureFlag}`;
      } else {
        document.cookie = 'google_client_secret=; path=/; max-age=0; SameSite=Lax';
      }
      document.cookie = 'google_gemini_scope=; path=/; max-age=0; SameSite=Lax';
    }

    onSave({
      provider,
      geminiApiKey: geminiApiKey.trim(),
      googleClientId: googleClientId.trim(),
      googleClientSecret: googleClientSecret.trim(),
      githubToken: githubToken.trim(),
      selectedModel,
    });
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    if (confirm('Vuoi rimuovere le credenziali da questo dispositivo?')) {
      setGeminiApiKey('');
      setGoogleClientId('');
      setGoogleClientSecret('');
      setGithubToken('');
      if (typeof document !== 'undefined') {
        document.cookie = 'google_client_id=; path=/; max-age=0; SameSite=Lax';
        document.cookie = 'google_client_secret=; path=/; max-age=0; SameSite=Lax';
        document.cookie = 'google_gemini_scope=; path=/; max-age=0; SameSite=Lax';
      }
      if (onClear) {
        onClear();
      } else {
        onSave({ provider: 'google_oauth', selectedModel });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-cyan-400" />
            <h2 className="text-base font-semibold text-neutral-100">Configurazione Motore & Account</h2>
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
          {/* Scelta del Motore AI (Provider Selector) */}
          <div className="space-y-2 p-3.5 bg-neutral-950 border border-neutral-800 rounded-2xl">
            <label className="text-neutral-200 font-semibold block text-xs">
              Motore di Esecuzione AI
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-900 rounded-xl border border-neutral-800 text-[11px]">
              <button
                type="button"
                onClick={() => setProvider('google_oauth')}
                className={`py-2 px-1 rounded-lg font-medium transition-all text-center flex flex-col items-center gap-1 ${
                  provider === 'google_oauth'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                }`}
              >
                <Globe size={14} className={provider === 'google_oauth' ? 'text-white' : 'text-blue-400'} />
                <span>Account Google</span>
                <span className="text-[9px] opacity-75 font-normal">Cloud / Mobile</span>
              </button>

              <button
                type="button"
                onClick={() => setProvider('gemini_api')}
                className={`py-2 px-1 rounded-lg font-medium transition-all text-center flex flex-col items-center gap-1 ${
                  provider === 'gemini_api'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                }`}
              >
                <Key size={14} className={provider === 'gemini_api' ? 'text-white' : 'text-amber-400'} />
                <span>Gemini API Key</span>
                <span className="text-[9px] opacity-75 font-normal">AI Studio</span>
              </button>

              <button
                type="button"
                onClick={() => setProvider('antigravity')}
                className={`py-2 px-1 rounded-lg font-medium transition-all text-center flex flex-col items-center gap-1 ${
                  provider === 'antigravity'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                }`}
              >
                <Laptop size={14} className={provider === 'antigravity' ? 'text-white' : 'text-emerald-400'} />
                <span>PC Nativo</span>
                <span className="text-[9px] opacity-75 font-normal">Antigravity</span>
              </button>
            </div>
            <p className="text-[10px] text-neutral-400 leading-relaxed pt-1">
              {provider === 'google_oauth' &&
                '💡 Usa il tuo account Google. Ideale se sei fuori casa o su smartphone/Vercel.'}
              {provider === 'gemini_api' &&
                '💡 Usa una chiave gratuita da Google AI Studio. Sempre affidabile da ovunque.'}
              {provider === 'antigravity' &&
                '💡 Usa il server Google Antigravity installato sul tuo PC Windows.'}
            </p>
          </div>

          {/* Opzione 1: Autenticazione con Google Account (OAuth) */}
          {provider === 'google_oauth' && (
            <div className="space-y-3 p-4 bg-neutral-950 border border-neutral-800 rounded-2xl shadow-sm animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-100 block text-xs">
                  Accesso Account Google
                </span>
                <button
                  type="button"
                  onClick={() => setShowOAuthSetup(!showOAuthSetup)}
                  className="text-cyan-400 hover:underline text-[11px] font-mono flex items-center gap-1"
                >
                  {showOAuthSetup ? 'Nascondi chiavi' : '⚙️ Configura Client ID'}
                </button>
              </div>

              <GoogleSignInButton variant="full" />

              <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-800/30 text-[11px] text-cyan-200/90 flex items-start gap-2">
                <ShieldCheck size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  L&apos;accesso avviene tramite il tuo account Google. Funziona sia in Wi-Fi che da fuori casa con connessione cellulare.
                </span>
              </div>

              {/* Configurazione In-App Client ID & Secret */}
              {showOAuthSetup && (
                <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3 animate-fade-in text-[11px]">
                  <div className="text-neutral-300 font-medium flex items-center gap-1.5">
                    <KeyRound size={13} className="text-cyan-400" />
                    <span>Credenziali Google Cloud OAuth</span>
                  </div>

                  {/* URI di reindirizzamento da copiare */}
                  <div className="space-y-1 p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-300 font-medium">URI Reindirizzamento autorizzato</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (callbackUrl) {
                            navigator.clipboard.writeText(callbackUrl);
                            setCopiedUri(true);
                            setTimeout(() => setCopiedUri(false), 2000);
                          }
                        }}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[10px] font-medium"
                      >
                        {copiedUri ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                        <span>{copiedUri ? 'Copiato!' : 'Copia'}</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      readOnly
                      value={callbackUrl || ''}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-neutral-300 font-mono text-[10px] select-all cursor-pointer"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <div className="flex items-center justify-between pt-0.5 text-[10px]">
                      <span className="text-neutral-500">Incolla nelle credenziali di Google Cloud</span>
                      <a
                        href="https://console.cloud.google.com/apis/credentials"
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:underline flex items-center gap-0.5 font-medium"
                      >
                        <span>Console Google Cloud</span>
                        <ExternalLink size={9} />
                      </a>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-neutral-300 font-medium block">
                      Google OAuth Client ID
                    </label>
                    <input
                      type="text"
                      value={googleClientId}
                      onChange={(e) => setGoogleClientId(e.target.value)}
                      placeholder="xxxx.apps.googleusercontent.com"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-cyan-500 font-mono text-[10px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-neutral-300 font-medium block">
                      Google OAuth Client Secret
                    </label>
                    <input
                      type="password"
                      value={googleClientSecret}
                      onChange={(e) => setGoogleClientSecret(e.target.value)}
                      placeholder="GOCSPX-xxxxxxxxxxxxxxxx"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-cyan-500 font-mono text-[10px]"
                    />
                  </div>

                  {/* Promemoria per evitare blocchi Google */}
                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-400 space-y-1">
                    <div className="text-cyan-400 font-medium flex items-center gap-1">
                      <CheckCircle2 size={11} />
                      <span>Requisiti Google Cloud Consent Screen</span>
                    </div>
                    <p className="leading-relaxed">
                      1. Aggiungi la tua email agli <strong>Utenti di test</strong> (Test users) nella Schermata consenso OAuth.<br />
                      2. Includi l&apos;ambito <strong>https://www.googleapis.com/auth/cloud-platform</strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Opzione 2: Google Gemini API Key (AI Studio) */}
          {provider === 'gemini_api' && (
            <div className="space-y-2.5 p-4 bg-neutral-950 border border-neutral-800 rounded-2xl shadow-sm animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-100 block text-xs flex items-center gap-1.5">
                  <Key size={14} className="text-amber-400" />
                  Google Gemini API Key
                </span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  Ottieni API Key gratuita <ExternalLink size={10} />
                </a>
              </div>
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-500 font-mono"
              />
              <p className="text-[10px] text-neutral-400 leading-relaxed">
                Puoi creare una chiave gratuita in 10 secondi su Google AI Studio. Questa chiave garantisce accesso diretto e stabile da qualsiasi dispositivo (anche fuori casa).
              </p>
            </div>
          )}

          {/* Opzione 3: Antigravity PC Locale */}
          {provider === 'antigravity' && (
            <div className="space-y-2.5 p-4 bg-neutral-950 border border-neutral-800 rounded-2xl shadow-sm animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-100 block text-xs flex items-center gap-1.5">
                  <Laptop size={14} className="text-emerald-400" />
                  Motore Antigravity PC Locale
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isAgyAvailable
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-700'
                      : 'bg-amber-950 text-amber-400 border-amber-700'
                  }`}
                >
                  {isAgyAvailable ? '● Attivo' : '○ Non Rilevato'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-300 leading-relaxed">
                {isAgyAvailable
                  ? 'Il tuo computer ha Google Antigravity installato e attivo. Non è richiesta alcuna chiave API o login.'
                  : 'Antigravity non è stato trovato su questo ambiente (ad esempio se stai accedendo dall\'app distribuita su Vercel). Se sei fuori casa, passa ad "Account Google" o inserisci una "Gemini API Key".'}
              </p>
              {!isAgyAvailable && (
                <div className="p-2.5 bg-neutral-900 rounded-xl border border-neutral-800 text-[10px] text-neutral-400 space-y-1">
                  <span className="font-semibold text-neutral-200 block">Vuoi usare il PC di casa quando sei fuori?</span>
                  <span>
                    Avvia un tunnel gratuito sul PC con <code>npx untun@latest tunnel --port 3000</code> per ottenere un indirizzo HTTPS pubblico raggiungibile ovunque dal tuo telefono!
                  </span>
                </div>
              )}
            </div>
          )}

          {/* GitHub Token (Opzionale per commit remoti) */}
          <div className="space-y-1.5 p-3.5 bg-neutral-950 border border-neutral-800 rounded-2xl">
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
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <p className="text-[10px] text-neutral-500 leading-tight">
              Inseriscilo per visualizzare i tuoi repository e creare commit sui branch remoti.
            </p>
          </div>

          {/* Selezione Modello */}
          <div className="space-y-1.5 p-3.5 bg-neutral-950 border border-neutral-800 rounded-2xl">
            <label className="text-neutral-300 font-medium block">
              Modello AI Predefinito
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-cyan-500 font-mono text-xs"
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
            {(googleClientId || githubToken || geminiApiKey) && (
              <button
                type="button"
                onClick={handleReset}
                className="text-rose-400 hover:text-rose-300 flex items-center gap-1 py-1.5 px-2 rounded-lg hover:bg-rose-950/30 transition-colors"
                title="Rimuovi credenziali salvate"
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
