'use client';

import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Copy, Check, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface GoogleOAuthGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: (focus?: 'oauth') => void;
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

  const handleOpenSettingsAction = () => {
    onClose();
    if (onOpenSettings) {
      onOpenSettings('oauth');
    } else if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-settings', { detail: { focus: 'oauth' } }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">
                Accesso Account Google (Stile Antigravity)
              </h3>
              <p className="text-[11px] text-neutral-400">
                Come collegare il tuo account Google
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
          <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-neutral-300 space-y-1.5">
            <div className="font-semibold text-cyan-300 text-xs flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-cyan-400" />
              <span>Autenticazione Diretta Google</span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-normal">
              Giantigravity funziona direttamente con il tuo account Google, esattamente come Antigravity. Per consentire a Google di riconoscere l&apos;applicazione, inserisci il tuo Google Client ID.
            </p>
          </div>

          {/* Setup Guide */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
            <div className="flex items-center gap-2 text-neutral-200 font-semibold text-xs">
              <Sparkles size={15} className="text-blue-400" />
              <span>Passaggi di configurazione Google Cloud</span>
            </div>

            <ol className="text-[11px] text-neutral-300 space-y-2.5 pl-4 list-decimal marker:text-neutral-500">
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
                e seleziona <strong>Crea credenziali</strong> ➔ <strong>ID client OAuth</strong> (tipo: Applicazione Web).
              </li>
              <li>
                In <strong>URI di reindirizzamento autorizzati</strong>, incolla questo URL:
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
                Nella <strong>Schermata consenso OAuth</strong>, aggiungi la tua email a <strong>Utenti di test</strong> e aggiungi l&apos;ambito <code>https://www.googleapis.com/auth/cloud-platform</code>.
              </li>
              <li>
                Incolla il <strong>Client ID</strong> e il <strong>Client Secret</strong> nelle impostazioni dell&apos;applicazione.
              </li>
            </ol>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleOpenSettingsAction}
                className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-semibold text-[11px] flex items-center gap-1.5 transition-all shadow-md"
              >
                <span>Inserisci Client ID nelle impostazioni</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-[11px] text-neutral-400">
          <span>Accesso Google centralizzato</span>
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
