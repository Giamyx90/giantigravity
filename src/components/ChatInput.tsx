'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Sparkles, Loader2, Zap, Brain, ChevronDown } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  currentModel?: string;
  onOpenModelSelector?: () => void;
}

export function ChatInput({
  onSend,
  isLoading,
  disabled,
  currentModel = 'gemini-2.5-flash',
  onOpenModelSelector,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Auto resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isLoading || disabled) return;
    onSend(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleSpeechRecognition = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Il tuo browser non supporta il riconoscimento vocale.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'it-IT';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  const quickPrompts = [
    '🔍 Esplora la struttura del progetto',
    '📄 Mostra i file principali',
    '💡 Suggerisci ottimizzazioni',
  ];

  const getModelLabel = (id: string) => {
    if (id === 'gemini-3.8-flash') return 'Gemini 3.8 Flash';
    if (id === 'gemini-3.7-flash') return 'Gemini 3.7 Flash';
    if (id === 'gemini-3.6-flash') return 'Gemini 3.6 Flash';
    if (id === 'gemini-3.1-pro') return 'Gemini 3.1 Pro';
    if (id === 'claude-opus-5-5') return 'Claude Opus 5.5';
    if (id === 'claude-sonnet-5-5') return 'Claude Sonnet 5.5';
    if (id === 'gpt-oss-120b') return 'GPT-OSS 120B';
    return id.replace('gemini-', '');
  };

  return (
    <div className="w-full bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800 px-3 pt-2.5 pb-6 sm:pb-3 shadow-2xl">
      {/* Quick Actions & Model Switcher */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none text-[11px] items-center">
        {onOpenModelSelector && (
          <button
            type="button"
            onClick={onOpenModelSelector}
            className="shrink-0 px-2.5 py-1 rounded-full bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-200 border border-cyan-800/80 transition-colors select-none flex items-center gap-1.5 font-medium shadow-sm"
            title="Cambia modello Google Gemini"
          >
            {currentModel.includes('pro') ? (
              <Brain size={12} className="text-purple-400" />
            ) : (
              <Zap size={12} className="text-amber-400" />
            )}
            <span>{getModelLabel(currentModel)}</span>
            <ChevronDown size={11} className="text-cyan-400" />
          </button>
        )}

        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            disabled={isLoading || disabled}
            onClick={() => onSend(prompt)}
            className="shrink-0 px-2.5 py-1 rounded-full bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/60 transition-colors select-none flex items-center gap-1.5"
          >
            <Sparkles size={11} className="text-cyan-400" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        {/* Voice Input Button */}
        <button
          type="button"
          onClick={toggleSpeechRecognition}
          disabled={isLoading || disabled}
          className={`p-2.5 rounded-full transition-all shrink-0 ${
            isListening
              ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-900/50'
              : 'bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700'
          }`}
          title={isListening ? 'Interrompi registrazione' : 'Dettatura vocale'}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        {/* Text Input */}
        <div className="flex-1 relative bg-neutral-950 border border-neutral-800 rounded-2xl focus-within:border-cyan-500/80 transition-colors">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={
              disabled
                ? 'Seleziona un repo o configura le impostazioni...'
                : 'Chiedi a Gemini (es. "Aggiungi componente X in src/")...'
            }
            className="w-full bg-transparent text-sm text-neutral-200 placeholder-neutral-500 px-3.5 py-2.5 focus:outline-none resize-none max-h-32"
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!text.trim() || isLoading || disabled}
          className={`p-2.5 rounded-full shrink-0 transition-all ${
            text.trim() && !isLoading && !disabled
              ? 'bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-semibold shadow-lg shadow-cyan-500/20'
              : 'bg-neutral-800 text-neutral-600 cursor-not-allowed border border-neutral-800'
          }`}
        >
          {isLoading ? <Loader2 size={18} className="animate-spin text-cyan-400" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
}
