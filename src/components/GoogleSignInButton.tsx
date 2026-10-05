'use client';

import React from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { LogOut, CheckCircle2, Loader2 } from 'lucide-react';

interface GoogleSignInButtonProps {
  variant?: 'full' | 'compact' | 'card';
  className?: string;
}

export function GoogleSignInButton({ variant = 'full', className = '' }: GoogleSignInButtonProps) {
  const { data: session, status } = useSession();

  const GoogleLogo = () => (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs">
        <Loader2 size={14} className="animate-spin text-cyan-400" />
        <span>Caricamento account...</span>
      </div>
    );
  }

  // Se l'utente è autenticato con Google
  if (session?.user) {
    if (variant === 'compact') {
      return (
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-900 border border-neutral-800 text-xs">
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || 'User'}
              className="w-5 h-5 rounded-full"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-cyan-500 text-neutral-950 font-bold flex items-center justify-center text-[10px]">
              {(session.user.name || 'G')[0]}
            </div>
          )}
          <span className="truncate max-w-[90px] text-[11px] text-neutral-200">
            {session.user.name?.split(' ')[0]}
          </span>
          <button
            onClick={() => signOut()}
            className="p-1 text-neutral-400 hover:text-rose-400 transition-colors"
            title="Disconnetti account Google"
          >
            <LogOut size={12} />
          </button>
        </div>
      );
    }

    return (
      <div className={`p-3 bg-cyan-950/20 border border-cyan-800/40 rounded-xl flex items-center justify-between gap-3 text-xs ${className}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || 'User'}
              className="w-8 h-8 rounded-full border border-cyan-500/30 shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-neutral-950 font-bold flex items-center justify-center text-xs shrink-0">
              {(session.user.name || 'U')[0]}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-medium text-neutral-100 truncate">
              <span className="truncate">{session.user.name}</span>
              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
            </div>
            <div className="text-[11px] text-cyan-300/80 truncate font-mono">
              {session.user.email}
            </div>
          </div>
        </div>

        <button
          onClick={() => signOut()}
          className="px-2.5 py-1.5 rounded-lg border border-neutral-700/80 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors text-[11px] flex items-center gap-1 shrink-0"
        >
          <LogOut size={12} />
          <span>Esci</span>
        </button>
      </div>
    );
  }

  // Se NON è autenticato
  if (variant === 'card') {
    return (
      <div className="p-4 bg-gradient-to-r from-neutral-900 to-neutral-900/80 border border-neutral-800 rounded-2xl shadow-lg flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-white shadow-sm flex items-center justify-center">
            <GoogleLogo />
          </div>
          <div>
            <span className="font-semibold text-neutral-100 block text-sm">Accedi con Google</span>
            <span className="text-[11px] text-neutral-400">
              Sblocca quote elevate e modelli avanzati senza dover inserire API key manuali
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => signIn('google')}
          className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99]"
        >
          <GoogleLogo />
          <span>Accedi con il tuo Account Google</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => signIn('google')}
      className={`py-2 px-3.5 rounded-xl border border-neutral-700/70 bg-neutral-900 hover:bg-neutral-800 text-neutral-100 font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] ${className}`}
    >
      <GoogleLogo />
      <span>Accedi con Google</span>
    </button>
  );
}
