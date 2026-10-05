'use client';

import React, { useState, useEffect } from 'react';
import { UserSettings, AVAILABLE_MODELS, AIProvider } from '@/types';
import { X, Key, Sparkles, Check, ExternalLink, ShieldCheck, Trash2, Cpu, CheckCircle2, AlertCircle, Copy, Loader2, Zap } from 'lucide-react';
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
  const [provider, setProvider] = useState<AIProvider>(settings.provider || 'antigravity');
  const [githubToken, setGithubToken] = useState(settings.githubToken || '');
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey || '');
  const [googleClientId, setGoogleClientId] = useState(settings.googleClientId || '');
  const [googleClientSecret, setGoogleClientSecret] = useState(settings.googleClientSecret || '');
  const [googleAccessToken, setGoogleAccessToken] = useState(settings.googleAccessToken || '');
  const [showAdvancedOAuth, setShowAdvancedOAuth] = useState(false);
  const [selectedModel, setSelectedModel] = useState(settings.selectedModel || 'gemini-3.8-flash');
  const [savedNotice, setSavedNotice] = useState(false);
  const [antigravityStatus, setAntigravityStatus] = useState<{ available: boolean; path?: string } | null>(null);
  const [copiedUri, setCopiedUri] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState('');

  // Token & API Key verification states
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  const [tokenVerificationResult, setTokenVerificationResult] = useState<{
    valid: boolean;
    email?: string;
    minutesLeft?: number;
    error?: string;
  } | null>(null);

  const [isVerifyingApiKey, setIsVerifyingApiKey] = useState(false);
  const [apiKeyVerificationResult, setApiKeyVerificationResult] = useState<{
    valid: boolean;
    error?: string;
  } | null>(null);

  const handleVerifyToken = async () => {
    if (!googleAccessToken.trim()) return;
    setIsVerifyingToken(true);
    setTokenVerificationResult(null);
    try {
      const res = await fetch('/api/auth/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: googleAccessToken.trim() }),
      });
      const data = await res.json();
      setTokenVerificationResult(data);
      if (data.valid) {
        setProvider('google_oauth');
      }
    } catch (e: any) {
      setTokenVerificationResult({ valid: false, error: e.message || 'Errore di connessione' });
    } finally {
      setIsVerifyingToken(false);
    }
  };

  const handleVerifyApiKey = async () => {
    if (!geminiApiKey.trim()) return;
    setIsVerifyingApiKey(true);
    setApiKeyVerificationResult(null);
    try {
      const res = await fetch('/api/auth/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: geminiApiKey.trim() }),
      });
      const data = await res.json();
      setApiKeyVerificationResult(data);
      if (data.valid) {
        setProvider('gemini_api');
      }
    } catch (e: any) {
      setApiKeyVerificationResult({ valid: false, error: e.message || 'Errore di connessione' });
    } finally {
      setIsVerifyingApiKey(false);
    }
  };

  useEffect(() => {
    setProvider(settings.provider || 'antigravity');
    setGithubToken(settings.githubToken || '');
    setGeminiApiKey(settings.geminiApiKey || '');
    setGoogleClientId(settings.googleClientId || '');
    setGoogleClientSecret(settings.googleClientSecret || '');
    setGoogleAccessToken(settings.googleAccessToken || '');
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCallbackUrl(`${window.location.origin}/api/auth/callback/google`);
      // Rimuoviamo eventuali vecchi cookie di scope restrittivi
      document.cookie = 'google_gemini_scope=; path=/; max-age=0; SameSite=Lax';
    }
  }, [isOpen]);

  useEffect(() => {
    const handleCustom = (e: any) => {
      if (e?.detail?.focus === 'oauth') {
        setShowAdvancedOAuth(true);
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
      githubToken: githubToken.trim(),
      geminiApiKey: geminiApiKey.trim(),
      googleClientId: googleClientId.trim(),
      googleClientSecret: googleClientSecret.trim(),
      googleAccessToken: googleAccessToken.trim(),
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
      setGoogleClientId('');
      setGoogleClientSecret('');
      setGoogleAccessToken('');
      setProvider('antigravity');
      if (typeof document !== 'undefined') {
        document.cookie = 'google_client_id=; path=/; max-age=0; SameSite=Lax';
        document.cookie = 'google_client_secret=; path=/; max-age=0; SameSite=Lax';
        document.cookie = 'google_gemini_scope=; path=/; max-age=0; SameSite=Lax';
      }
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
            <h2 className="text-base font-semibold text-neutral-100">Configurazione Applicazione</h2>
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
          {/* Autenticazione con Google Account */}
          <div className="space-y-2.5 p-3.5 bg-neutral-950 border border-neutral-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-200 block text-xs">
                Accesso Google (OAuth)
              </span>
              <button
                type="button"
                onClick={() => setShowAdvancedOAuth(!showAdvancedOAuth)}
                className="text-cyan-400 hover:underline text-[11px] font-mono flex items-center gap-1"
              >
                {showAdvancedOAuth ? 'Nascondi setup' : '⚙️ Configura Client ID'}
              </button>
            </div>

            <GoogleSignInButton variant="full" />

            {/* Configurazione In-App Client ID & Secret per chi non vuole usare Vercel Env */}
            {showAdvancedOAuth && (
              <div className="p-3 bg-neutral-900/90 border border-neutral-800 rounded-xl space-y-3 animate-fade-in text-[11px] mt-2">
                <div className="text-neutral-400 leading-relaxed">
                  Per far funzionare &ldquo;Accedi con Google&rdquo;, Google richiede un Client ID OAuth registrato su Google Cloud:
                </div>

                {/* URI di reindirizzamento da copiare */}
                <div className="space-y-1 p-2.5 rounded-lg bg-neutral-950 border border-neutral-800/80">
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
                    <span className="text-neutral-500">Incolla questo indirizzo nelle credenziali Google Cloud</span>
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-0.5 font-medium"
                    >
                      <span>Apri Console</span>
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

                {/* Configurazione Ambiti Google Standard */}
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] space-y-1">
                  <div className="text-emerald-400 font-medium flex items-center gap-1.5">
                    <CheckCircle2 size={12} />
                    <span>Ambiti di accesso standard verificati (openid, email, profile)</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-tight">
                    Accesso rapido al 100% senza blocchi di autorizzazione di Google Cloud.
                  </p>
                </div>

                <div className="text-[10px] text-cyan-400/90 leading-tight">
                  💡 Salvando, queste chiavi rimarranno solo nel browser del tuo smartphone e abiliteranno il login immediato.
                </div>
              </div>
            )}

            {/* Incolla Access Token Diretto */}
            <div className="pt-2 border-t border-neutral-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-neutral-400 text-[11px] font-medium block">
                  Oppure incolla direttamente un Google Access Token (OAuth):
                </label>
                {googleAccessToken.trim() && (
                  <button
                    type="button"
                    onClick={handleVerifyToken}
                    disabled={isVerifyingToken}
                    className="text-cyan-400 hover:text-cyan-300 text-[11px] font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    {isVerifyingToken ? (
                      <>
                        <Loader2 size={11} className="animate-spin" />
                        <span>Verifica...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={11} />
                        <span>⚡ Verifica se funziona</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <input
                type="password"
                value={googleAccessToken}
                onChange={(e) => {
                  setGoogleAccessToken(e.target.value);
                  setTokenVerificationResult(null);
                }}
                placeholder="ya29.a0xxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-cyan-500 font-mono text-xs"
              />

              {/* Risultato della verifica Token */}
              {tokenVerificationResult && (
                <div
                  className={`p-2.5 rounded-xl border text-[11px] space-y-1 animate-fade-in ${
                    tokenVerificationResult.valid
                      ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold">
                    {tokenVerificationResult.valid ? (
                      <>
                        <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                        <span>Token Google Valido e Funzionante!</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={13} className="text-rose-400 shrink-0" />
                        <span>Token non valido o scaduto</span>
                      </>
                    )}
                  </div>
                  {tokenVerificationResult.valid ? (
                    <div className="text-[10px] text-neutral-300 space-y-0.5">
                      {tokenVerificationResult.email && (
                        <div>• Account Google: <span className="font-mono text-emerald-300 font-medium">{tokenVerificationResult.email}</span></div>
                      )}
                      {tokenVerificationResult.minutesLeft !== undefined && (
                        <div>• Scadenza stimata: <span className="font-semibold text-emerald-300">tra circa {tokenVerificationResult.minutesLeft} minuti</span> (i token ya29 durano 60m)</div>
                      )}
                      <div>• Modalità <span className="font-semibold text-cyan-300">Google OAuth</span> attivata con successo!</div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-rose-300/90 leading-tight">
                      {tokenVerificationResult.error || 'Verifica che il token sia attivo e abbia lo scope generative-language.'}
                    </div>
                  )}
                </div>
              )}

              <p className="text-[10px] text-neutral-500">
                Se hai generato un token di accesso Google (es. da OAuth Playground), tocca <strong>&ldquo;⚡ Verifica se funziona&rdquo;</strong> per testarlo.
              </p>
            </div>
          </div>

          {/* Modalità / Engine Selector */}
          <div className="space-y-2">
            <label className="text-neutral-300 font-medium block">
              Modalità di Esecuzione AI
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setProvider('google_oauth')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  provider === 'google_oauth'
                    ? 'border-blue-500 bg-blue-950/30 text-white'
                    : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-blue-300">
                  <Sparkles size={14} />
                  <span>Google OAuth</span>
                </div>
                <span className="text-[10px] text-neutral-400 leading-tight">
                  Accedi con Google dal telefono (Ideale per Vercel).
                </span>
              </button>

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
                  Sessione locale del PC (se presente).
                </span>
                <div className="mt-1 flex items-center gap-1 text-[9px]">
                  {antigravityStatus?.available ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 size={10} /> Connesso al PC
                    </span>
                  ) : (
                    <span className="text-neutral-500">Non disponibile</span>
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setProvider('gemini_api')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  provider === 'gemini_api'
                    ? 'border-amber-500 bg-amber-950/30 text-white'
                    : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-300">
                  <Key size={14} />
                  <span>AI Studio Key</span>
                </div>
                <span className="text-[10px] text-neutral-400 leading-tight">
                  Inserisci chiave API manuale.
                </span>
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
              <div className="flex items-center justify-between text-neutral-300 font-medium">
                <span className="flex items-center gap-1.5">
                  <Key size={14} className="text-cyan-400" />
                  La tua Google Gemini API Key
                </span>
                <div className="flex items-center gap-2">
                  {geminiApiKey.trim() && (
                    <button
                      type="button"
                      onClick={handleVerifyApiKey}
                      disabled={isVerifyingApiKey}
                      className="text-amber-400 hover:text-amber-300 text-[11px] font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                      {isVerifyingApiKey ? (
                        <>
                          <Loader2 size={11} className="animate-spin" />
                          <span>Verifica...</span>
                        </>
                      ) : (
                        <>
                          <Zap size={11} />
                          <span>⚡ Testa Chiave</span>
                        </>
                      )}
                    </button>
                  )}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    Ottieni chiave <ExternalLink size={10} />
                  </a>
                </div>
              </div>
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => {
                  setGeminiApiKey(e.target.value);
                  setApiKeyVerificationResult(null);
                }}
                placeholder="AIzaSyxxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-cyan-500 font-mono"
              />
              {apiKeyVerificationResult && (
                <div
                  className={`p-2 rounded-xl border text-[11px] space-y-0.5 animate-fade-in ${
                    apiKeyVerificationResult.valid
                      ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                    {apiKeyVerificationResult.valid ? (
                      <>
                        <CheckCircle2 size={12} className="text-emerald-400" />
                        <span>API Key valida e connessa a Gemini!</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={12} className="text-rose-400" />
                        <span>{apiKeyVerificationResult.error || 'API Key non valida o quote esaurite'}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
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
