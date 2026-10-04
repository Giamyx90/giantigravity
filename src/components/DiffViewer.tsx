'use client';

import React, { useState } from 'react';
import { DiffChunk } from '@/types';
import { ChevronDown, ChevronRight, FileDiff } from 'lucide-react';

interface DiffViewerProps {
  diff: DiffChunk[];
  filePath?: string;
}

export function DiffViewer({ diff, filePath }: DiffViewerProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (!diff || diff.length === 0) return null;

  const addedLines = diff
    .filter((d) => d.added)
    .reduce((acc, d) => acc + (d.value.match(/\n/g)?.length || 1), 0);
  const removedLines = diff
    .filter((d) => d.removed)
    .reduce((acc, d) => acc + (d.value.match(/\n/g)?.length || 1), 0);

  return (
    <div className="mt-2 border border-neutral-800 rounded-lg overflow-hidden bg-neutral-950 text-xs font-mono">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-neutral-900/80 hover:bg-neutral-900 transition-colors text-neutral-300"
      >
        <div className="flex items-center gap-2 truncate">
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <FileDiff size={14} className="text-cyan-400 shrink-0" />
          <span className="font-semibold text-neutral-200 truncate">{filePath || 'Modifiche file'}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] shrink-0 font-medium">
          {addedLines > 0 && <span className="text-emerald-400">+{addedLines}</span>}
          {removedLines > 0 && <span className="text-rose-400">-{removedLines}</span>}
        </div>
      </button>

      {isOpen && (
        <div className="max-h-72 overflow-y-auto p-2 divide-y divide-neutral-900/40 text-[11px] leading-tight">
          {diff.map((chunk, index) => {
            const lines = chunk.value.split('\n');
            // Remove last empty line if ends with newline
            if (lines.length > 1 && lines[lines.length - 1] === '') {
              lines.pop();
            }

            return lines.map((line, lineIdx) => {
              let bg = 'text-neutral-400';
              let prefix = ' ';
              if (chunk.added) {
                bg = 'bg-emerald-950/40 text-emerald-300 font-medium';
                prefix = '+';
              } else if (chunk.removed) {
                bg = 'bg-rose-950/40 text-rose-300 line-through opacity-80';
                prefix = '-';
              }

              return (
                <div
                  key={`${index}-${lineIdx}`}
                  className={`flex px-2 py-0.5 whitespace-pre-wrap font-mono ${bg}`}
                >
                  <span className="select-none w-4 shrink-0 text-neutral-600 font-semibold">{prefix}</span>
                  <span className="break-all">{line || ' '}</span>
                </div>
              );
            });
          })}
        </div>
      )}
    </div>
  );
}
