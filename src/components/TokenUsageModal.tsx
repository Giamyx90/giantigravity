'use client';

import React, { useState, useEffect } from 'react';
import { TokenStats, TokenUsage } from '@/types';
import {
  getTokenStats,
  setTokenBudget,
  resetTokenStats,
  formatTokenCount,
  estimateCost,
  getTodayTokens,
} from '@/lib/token-tracker';
import {
  X,
  Zap,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Sliders,
  Calendar,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface TokenUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionUsage: TokenUsage;
  activeModel?: string;
  onStatsChanged?: () => void;
}

const BUDGET_PRESETS = [
  { label: '50k', value: 50000 },
  { label: '100k', value: 100000 },
  { label: '250k', value: 250000 },
  { label: '500k', value: 500000 },
  { label: '1M', value: 1000000 },
  { label: 'Nessun limite', value: 0 },
];

export function TokenUsageModal({
  isOpen,
  onClose,
  sessionUsage,
  activeModel = 'gemini-3.8-flash',
  onStatsChanged,
}: TokenUsageModalProps) {
  const [stats, setStats] = useState<TokenStats>(getTokenStats());
  const [selectedBudget, setSelectedBudget] = useState<number>(stats.budgetLimit || 250000);
  const [customBudgetInput, setCustomBudgetInput] = useState<string>('');
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const freshStats = getTokenStats();
      setStats(freshStats);
      setSelectedBudget(freshStats.budgetLimit || 0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const todayTokens = getTodayTokens(stats);
  const sessionCost = estimateCost(sessionUsage.totalTokens, activeModel);
  const lifetimeCost = estimateCost(stats.lifetimeTotal, activeModel);

  // Calcolo progresso budget (basato sul consumo globale o giornaliero)
  const budgetLimit = stats.budgetLimit || 0;
  const budgetPercentage =
    budgetLimit > 0 ? Math.min(100, Math.round((stats.lifetimeTotal / budgetLimit) * 100)) : 0;
  const isOverBudget = budgetLimit > 0 && stats.lifetimeTotal >= budgetLimit;
  const isNearBudget =
    budgetLimit > 0 &&
    !isOverBudget &&
    budgetPercentage >= (stats.alertThresholdPct || 80);

  const handleApplyBudget = (newLimit: number) => {
    const updated = setTokenBudget(newLimit, stats.alertThresholdPct || 80);
    setStats(updated);
    setSelectedBudget(newLimit);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 1500);
    if (onStatsChanged) onStatsChanged();
  };

  const handleCustomBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customBudgetInput.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(val) && val >= 0) {
      handleApplyBudget(val);
      setCustomBudgetInput('');
    }
  };

  const handleReset = () => {
    const reset = resetTokenStats();
    setStats(reset);
    setShowConfirmReset(false);
    if (onStatsChanged) onStatsChanged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-neutral-100">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-950/80 text-amber-400 border border-amber-800/60 shadow-sm">
              <Zap size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                Controllo Consumo Token
                {savedSuccess && (
                  <span className="text-[11px] font-normal text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Salvato
                  </span>
                )}
              </h2>
              <p className="text-xs text-neutral-400">
                Monitoraggio in tempo reale, stima costi e limiti di spesa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Chiudi"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          {/* Status Alert Banner if approaching or over budget */}
          {budgetLimit > 0 && (
            <div>
              {isOverBudget ? (
                <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 flex items-start gap-2.5 shadow-sm">
                  <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-0.5">
                    <span className="font-semibold block text-red-300">Budget Token Superato!</span>
                    <p className="text-red-300/90 leading-relaxed">
                      Hai consumato {stats.lifetimeTotal.toLocaleString('it-IT')} token superando la soglia di{' '}
                      {budgetLimit.toLocaleString('it-IT')} impostata. Puoi incrementare il limite o azzerare le statistiche.
                    </p>
                  </div>
                </div>
              ) : isNearBudget ? (
                <div className="p-3.5 rounded-xl bg-amber-950/50 border border-amber-800/70 text-amber-200 flex items-start gap-2.5 shadow-sm">
                  <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-0.5">
                    <span className="font-semibold block text-amber-300">
                      Avviso: Raggiunto {budgetPercentage}% del budget
                    </span>
                    <p className="text-amber-300/90 leading-relaxed">
                      Sei vicino alla soglia di consumo token impostata ({formatTokenCount(stats.lifetimeTotal)} su{' '}
                      {formatTokenCount(budgetLimit)}).
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Current Chat Session Usage Card */}
          <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800/90 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Sessione Chat Attiva
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                {activeModel.replace('gemini-', '')}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
                <span className="text-[10px] text-neutral-400 block mb-0.5">Prompt (Input)</span>
                <span className="text-sm font-mono font-bold text-white">
                  {formatTokenCount(sessionUsage.promptTokens)}
                </span>
                <span className="text-[10px] text-neutral-500 block">
                  {sessionUsage.promptTokens.toLocaleString('it-IT')}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
                <span className="text-[10px] text-neutral-400 block mb-0.5">Risposta (Output)</span>
                <span className="text-sm font-mono font-bold text-cyan-400">
                  {formatTokenCount(sessionUsage.completionTokens)}
                </span>
                <span className="text-[10px] text-neutral-500 block">
                  {sessionUsage.completionTokens.toLocaleString('it-IT')}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-neutral-900 border border-cyan-800/40 bg-cyan-950/20">
                <span className="text-[10px] text-cyan-300 block mb-0.5">Totale Sessione</span>
                <span className="text-sm font-mono font-bold text-amber-400">
                  {formatTokenCount(sessionUsage.totalTokens)}
                </span>
                <span className="text-[10px] text-neutral-400 block">
                  {sessionCost.usd}
                </span>
              </div>
            </div>
          </div>

          {/* Lifetime & Daily Statistics */}
          <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800/90 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={13} className="text-emerald-400" />
                Statistiche Dispositivo
              </span>
              <span className="text-xs text-neutral-400">
                {stats.totalRequests} {stats.totalRequests === 1 ? 'richiesta' : 'richieste'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                  <Calendar size={16} />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">Consumati Oggi</span>
                  <span className="text-sm font-mono font-bold text-white">
                    {formatTokenCount(todayTokens)}
                  </span>
                  <span className="text-[10px] text-neutral-500 block">
                    {todayTokens.toLocaleString('it-IT')} token
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
                  <Layers size={16} />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">Totale Storico</span>
                  <span className="text-sm font-mono font-bold text-indigo-300">
                    {formatTokenCount(stats.lifetimeTotal)}
                  </span>
                  <span className="text-[10px] text-neutral-500 block">
                    Stima: {lifetimeCost.usd}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Budget Limit & Spending Control */}
          <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800/90 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sliders size={14} className="text-cyan-400" />
                <span className="text-xs font-semibold text-neutral-200">
                  Soglia di Controllo & Budget Token
                </span>
              </div>
              {budgetLimit > 0 && (
                <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                  {budgetPercentage}% usato
                </span>
              )}
            </div>

            {/* Budget Progress Bar */}
            {budgetLimit > 0 && (
              <div className="space-y-1.5">
                <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isOverBudget
                        ? 'bg-red-500'
                        : isNearBudget
                        ? 'bg-amber-400'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                    }`}
                    style={{ width: `${budgetPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                  <span>0</span>
                  <span>{formatTokenCount(stats.lifetimeTotal)} / {formatTokenCount(budgetLimit)}</span>
                </div>
              </div>
            )}

            {/* Budget Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-neutral-400 block">
                Seleziona una soglia massima per ricevere avvisi di consumo:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {BUDGET_PRESETS.map((preset) => {
                  const isSelected = selectedBudget === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handleApplyBudget(preset.value)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-sm'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Budget Input */}
            <form onSubmit={handleCustomBudgetSubmit} className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Valore personalizzato (es. 750000)"
                value={customBudgetInput}
                onChange={(e) => setCustomBudgetInput(e.target.value)}
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-medium transition-colors"
              >
                Imposta
              </button>
            </form>
          </div>

          {/* Model Breakdown */}
          {Object.keys(stats.modelUsage).length > 0 && (
            <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800/90 space-y-2">
              <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                Consumi per Modello
              </span>
              <div className="space-y-1.5 pt-1">
                {Object.entries(stats.modelUsage).map(([model, tokens]) => (
                  <div
                    key={model}
                    className="flex items-center justify-between text-xs py-1 border-b border-neutral-800/50 last:border-0"
                  >
                    <span className="font-mono text-neutral-300">{model}</span>
                    <span className="font-mono text-cyan-400 font-medium">
                      {formatTokenCount(tokens)} ({tokens.toLocaleString('it-IT')})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Educational / Pricing Note */}
          <div className="p-3.5 rounded-xl bg-neutral-950/40 border border-neutral-800/50 text-[11px] text-neutral-400 space-y-1 leading-relaxed">
            <span className="font-semibold text-neutral-300 flex items-center gap-1">
              <HelpCircle size={12} className="text-cyan-400" />
              Info su Token & Costi Google Gemini:
            </span>
            <p>
              I modelli <strong>Gemini Flash</strong> sono straordinariamente economici (~$0.10 input e ~$0.40 output per milione di token). Con 250k token si effettuano decine di turni di programmazione avanzata a una frazione di centesimo di euro.
            </p>
          </div>
        </div>

        {/* Modal Footer with Reset Button */}
        <div className="px-5 py-3.5 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between shrink-0">
          <div>
            {showConfirmReset ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400">Azzerare lo storico?</span>
                <button
                  onClick={handleReset}
                  className="px-2.5 py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
                >
                  Sì, azzera
                </button>
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="px-2 py-1 text-xs text-neutral-400 hover:text-white transition-colors"
                >
                  Annulla
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmReset(true)}
                className="text-xs text-neutral-500 hover:text-red-400 flex items-center gap-1.5 transition-colors"
                title="Azzera statistiche token"
              >
                <RotateCcw size={13} />
                <span>Azzera statistiche</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-semibold text-xs shadow-md transition-all"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
