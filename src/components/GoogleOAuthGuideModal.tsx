'use client';

import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Copy, Check, Sparkles, Key, ShieldAlert, ArrowRight, Zap } from 'lucide-react';

interface GoogleOAuthGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: (focus?: 'oauth' | 'gemini') => void;
}

export function GoogleOAuthGuideModal({ isOpen, onClose, onOpenSettings }: GoogleOAuthGuideModalProps) {
  const [copied, setCopied] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCallbackUrl(`${window.location.origin}/api/auth/callback/google`);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyCallback = () => {
    if (callbackUrl) {
      navigator.clipboard.writeText(callbackUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenSettingsAction = (focus: 'oauth' | 'gemini') => {
    onClose();
    if (onOpenSettings) {
      onOpenSettings(focus);
    } else if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-settings', { detail: { focus } }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">
                Configurazione Accesso con Google
              </h3>
              <p className="text-[11px] text-neutral-400">
                Perché hai visto l&apos;errore &ldquo;The OAuth client was not found&rdquo;
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs leading-relaxed">
          {/* Explanation Alert */}
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-neutral-300 space-y-1.5">
            <div className="font-semibold text-amber-300 text-xs flex items-center gap-1.5">
              <span>Cosa significa l&apos;errore di Google?</span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-normal">
              Per motivi di sicurezza, Google <strong>non consente</strong> a nessun sito web di autenticare utenti senza che il proprietario abbia registrato un <strong>OAuth Client ID</strong> su Google Cloud. Senza questo ID, Google blocca l&apos;accesso segnalando che il client non esiste.
            </p>
          </div>

          <div className="text-neutral-400 text-[11px]">
            Hai a disposizione due strade semplicissime per risolvere e usare l&apos;app dal tuo smartphone:
          </div>

          {/* Option A: Gemini API Key Pay-as-you-go (RECOMMENDED) */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-neutral-950 to-neutral-900 border border-cyan-800/40 hover:border-cyan-500/60 transition-all space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
                <Zap size={15} />
                <span>Opzione 1 (Consigliata da Smartphone): API Key senza limiti</span>
              </div>
              <span className="text-[10px] text-cyan-300 font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800">
                Più facile
              </span>
            </div>

            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Il motivo per cui avevi troppe limitazioni è che il piano gratuito ha un tetto di 15 richieste al minuto.
              Attivando il <strong>Pay-as-you-go</strong> su Google AI Studio:
            </p>

            <ul className="text-[11px] text-neutral-300 space-y-1 pl-4 list-disc marker:text-cyan-400">
              <li>Il limite sale all&apos;istante a <strong>4.000 richieste al minuto</strong>.</li>
              <li>I modelli Gemini Flash costano circa <strong>0,07$ per milione di parole</strong> (pochi centesimi per mesi interi di uso).</li>
              <li>Zero configurazioni Google Cloud complesse da telefono: basta incollare la chiave.</li>
            </ul>

            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-medium flex items-center gap-1.5 transition-colors"
              >
                <span>Ottieni API Key da AI Studio</span>
                <ExternalLink size={12} />
              </a>

              <button
                type="button"
                onClick={() => handleOpenSettingsAction('gemini')}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-neutral-950 font-semibold text-[11px] flex items-center gap-1.5 transition-colors ml-auto"
              >
                <Key size={12} />
                <span>Inserisci API Key</span>
              </button>
            </div>
          </div>

          {/* Option B: Setup Google OAuth Client ID */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
            <div className="flex items-center gap-2 text-neutral-200 font-semibold text-xs">
              <Sparkles size={15} className="text-blue-400" />
              <span>Opzione 2: Configura il tuo Google Client ID (Login Google)</span>
            </div>

            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Se vuoi abilitare il pulsante &ldquo;Accedi con Google&rdquo;, puoi creare un Client ID gratuito su Google Cloud:
            </p>

            <ol className="text-[11px] text-neutral-300 space-y-2 pl-4 list-decimal marker:text-neutral-500">
              <li>
                Apri la{' '}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 underline inline-flex items-center gap-0.5"
                >
                  <span>Google Cloud Console</span>
                  <ExternalLink size={10} />
                </a>{' '}
                e clicca <strong>Crea credenziali</strong> ➔ <strong>ID client OAuth</strong>.
              </li>
              <li>
                Scegli tipo <strong>Applicazione Web</strong>.
              </li>
              <li>
                In <strong>URI di reindirizzamento autorizzati</strong>, inserisci questo URL:
                <div className="mt-1 flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={callbackUrl || 'Caricamento URI...'}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-neutral-200 font-mono text-[10px] select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyCallback}
                    className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-[11px] flex items-center gap-1 shrink-0 transition-colors"
                  >
                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copied ? 'Copiato' : 'Copia'}</span>
                  </button>
                </div>
              </li>
              <li>
                Copia il <strong>Client ID</strong> e il <strong>Client Secret</strong> e incollali nelle impostazioni della WebApp (rimarranno salvati sul tuo dispositivo).
              </li>
            </ol>

            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => handleOpenSettingsAction('oauth')}
                className="px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 font-medium text-[11px] flex items-center gap-1.5 transition-colors"
              >
                <span>Apri Configurazione Client ID</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-[11px] text-neutral-400">
          <span>Configurabile interamente dal telefono</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
