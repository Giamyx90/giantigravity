'use client';

import React, { useState } from 'react';
import { AgentStep } from '@/types';
import { DiffViewer } from './DiffViewer';
import {
  FileText,
  FolderTree,
  Search,
  PenLine,
  GitBranch,
  GitPullRequest,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface ToolStepCardProps {
  step: AgentStep;
}

export function ToolStepCard({ step }: ToolStepCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getToolIcon = () => {
    switch (step.tool) {
      case 'view_file':
        return <FileText size={15} className="text-cyan-400" />;
      case 'list_directory':
        return <FolderTree size={15} className="text-amber-400" />;
      case 'search_code':
        return <Search size={15} className="text-purple-400" />;
      case 'edit_file':
        return <PenLine size={15} className="text-emerald-400" />;
      case 'create_branch':
        return <GitBranch size={15} className="text-blue-400" />;
      case 'create_pull_request':
        return <GitPullRequest size={15} className="text-pink-400" />;
      default:
        return <FileText size={15} className="text-neutral-400" />;
    }
  };

  const getStatusIcon = () => {
    if (step.status === 'running') {
      return <Loader2 size={14} className="animate-spin text-cyan-400" />;
    }
    if (step.status === 'completed') {
      return <CheckCircle2 size={14} className="text-emerald-400" />;
    }
    return <AlertCircle size={14} className="text-rose-400" />;
  };

  return (
    <div className="my-2 rounded-xl border border-neutral-800/80 bg-neutral-900/60 overflow-hidden text-xs shadow-sm transition-all">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between px-3.5 py-2.5 cursor-pointer hover:bg-neutral-800/40 select-none"
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="shrink-0">{getToolIcon()}</div>
          <span className="font-medium text-neutral-200 truncate">{step.summary}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {getStatusIcon()}
          {expanded ? <ChevronDown size={14} className="text-neutral-500" /> : <ChevronRight size={14} className="text-neutral-500" />}
        </div>
      </div>

      {/* Embedded diff if available (always shown if present) */}
      {step.diff && step.diff.length > 0 && (
        <div className="px-3 pb-2.5">
          <DiffViewer diff={step.diff} filePath={step.args?.path} />
        </div>
      )}

      {/* Expanded details (args, errors, results) */}
      {expanded && (
        <div className="px-3.5 pb-3 pt-1 border-t border-neutral-800/50 space-y-2 text-[11px] text-neutral-400 font-mono">
          {step.error && (
            <div className="p-2 bg-rose-950/40 border border-rose-900/50 rounded-lg text-rose-300">
              <span className="font-semibold block mb-0.5">Errore:</span>
              <p className="break-all">{step.error}</p>
            </div>
          )}

          {step.result?.commitUrl && (
            <a
              href={step.result.commitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-cyan-400 hover:underline pt-1"
            >
              <span>Vedi commit su GitHub</span>
              <ExternalLink size={12} />
            </a>
          )}

          {step.result?.prUrl && (
            <a
              href={step.result.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-pink-400 hover:underline pt-1"
            >
              <span>Vedi Pull Request #{step.result.prNumber} su GitHub</span>
              <ExternalLink size={12} />
            </a>
          )}

          <div>
            <span className="text-neutral-500 font-semibold block mb-0.5">Parametri:</span>
            <pre className="p-2 bg-neutral-950 rounded-lg overflow-x-auto text-[10px] text-neutral-300">
              {JSON.stringify(step.args, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
