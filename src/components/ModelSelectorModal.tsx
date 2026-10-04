'use client';

import React, { useState } from 'react';
import { AVAILABLE_MODELS } from '@/types';
import { Sparkles, Check, X, Zap, Brain, Cpu, ChevronRight } from 'lucide-react';

interface ModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

export function ModelSelectorModal({
  isOpen,
  onClose,
  selectedModel,
  onSelectModel,
}: ModelSelectorModalProps) {
  const [customModel, setCustomModel] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  if (!isOpen) return null;

  const handleSelect = (modelId: string) => {
    onSelectModel(modelId);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customModel.trim()) {
      onSelectModel(customModel.trim());
      onClose();
    }
  };

  const getModelIcon = (id: string) => {
    if (id.includes('pro')) {
      return <Brain size={18} className="text-purple-400 shrink-0" />;
    }
    if (id.includes('flash')) {
      return <Zap size={18} className="text-amber-400 shrink-0" />;
    }
    return <Cpu size={18} className="text-cyan-400 shrink-0" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-cyan-400" />
            <h3 className="text-sm font-semibold text-neutral-100">Seleziona Modello Google AI</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* List of Models */}
        <div className="p-4 space-y-2 overflow-y-auto flex-1">
          {AVAILABLE_MODELS.map((model) => {
            const isSelected = selectedModel === model.id;
            return (
              <div
                key={model.id}
                onClick={() => handleSelect(model.id)}
                className={`p-3.5 rounded-xl cursor-pointer border transition-all flex items-start justify-between gap-3 select-none ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500/80 shadow-md shadow-cyan-500/10'
                    : 'bg-neutral-950/70 border-neutral-800 hover:bg-neutral-800/60 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5">{getModelIcon(model.id)}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs text-neutral-100">{model.name}</span>
                      <span
                        className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                          model.badge === 'Consigliato'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : model.badge === 'Coding Avanzato'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                        }`}
                      >
                        {model.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1 leading-tight">{model.description}</p>
                    <span className="text-[10px] text-neutral-600 font-mono block mt-1">{model.id}</span>
                  </div>
                </div>

                <div className="shrink-0 mt-1">
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-cyan-500 text-neutral-950 flex items-center justify-center">
                      <Check size={13} strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-neutral-700" />
                  )}
                </div>
              </div>
            );
          })}

          {/* Custom Model Toggle */}
          <div className="pt-2 border-t border-neutral-800/60">
            {!showCustomInput ? (
              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-neutral-800 hover:border-cyan-500/50 text-neutral-400 hover:text-cyan-400 text-xs flex items-center justify-between transition-colors"
              >
                <span>Usa un altro modello personalizzato (es. preview / thinking)...</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <form onSubmit={handleCustomSubmit} className="space-y-2 pt-1">
                <label className="text-[11px] text-neutral-400 font-medium block">
                  Nome modello personalizzato (Google AI Studio ID):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    placeholder="es. gemini-2.0-flash-thinking-exp-1219"
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 text-xs focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={!customModel.trim()}
                    className="px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-semibold rounded-xl text-xs disabled:opacity-50"
                  >
                    Usa
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
