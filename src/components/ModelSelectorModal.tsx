'use client';

import React from 'react';
import { AVAILABLE_MODELS } from '@/types';
import { Check, ChevronRight, Info, Sparkles, X } from 'lucide-react';

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
  if (!isOpen) return null;

  const handleSelect = (modelId: string) => {
    onSelectModel(modelId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800/80">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-cyan-400" />
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Model</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Model Menu List (Styled exactly as in Antigravity Desktop) */}
        <div className="p-2 space-y-1 overflow-y-auto flex-1 text-xs">
          {AVAILABLE_MODELS.map((model) => {
            const isSelected = selectedModel === model.id;

            return (
              <div
                key={model.id}
                onClick={() => handleSelect(model.id)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all select-none ${
                  isSelected
                    ? 'bg-neutral-800 text-white font-medium shadow-sm'
                    : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-white'
                }`}
              >
                {/* Left: Model Name & Tier */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate">{model.name}</span>
                  {model.tier && (
                    <span className="text-[11px] text-neutral-500 font-normal shrink-0">
                      {model.tier}
                    </span>
                  )}
                  {model.tag && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium shrink-0 ${
                        model.tag === 'New'
                          ? 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {model.tag}
                      {model.tag === 'Notice' && <Info size={10} className="inline ml-1 text-neutral-500" />}
                    </span>
                  )}
                </div>

                {/* Right: Checkmark if selected or Chevron */}
                <div className="shrink-0 ml-2">
                  {isSelected ? (
                    <Check size={16} className="text-cyan-400" strokeWidth={2.5} />
                  ) : (
                    <ChevronRight size={14} className="text-neutral-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
