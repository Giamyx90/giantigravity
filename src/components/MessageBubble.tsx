'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage } from '@/types';
import { ToolStepCard } from './ToolStepCard';
import { Copy, Check, Sparkles, User, Zap } from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 my-4 px-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-md">
          <Sparkles size={16} className="text-white" />
        </div>
      )}

      <div className={`max-w-[92%] sm:max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* If assistant has agent steps, render them first */}
        {!isUser && message.steps && message.steps.length > 0 && (
          <div className="mb-3 space-y-1.5 w-full">
            {message.steps.map((step) => (
              <ToolStepCard key={step.id} step={step} />
            ))}
          </div>
        )}

        {/* Message bubble content */}
        {message.content && (
          <div
            className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
              isUser
                ? 'bg-blue-600 text-white rounded-tr-sm shadow-md'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-tl-sm shadow-sm'
            }`}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            ) : (
              <div className="prose prose-invert prose-sm max-w-none break-words space-y-2">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeString = String(children).replace(/\n$/, '');

                      if (match) {
                        return <CodeBlock language={match[1]} value={codeString} />;
                      }

                      return (
                        <code
                          className="bg-neutral-800 text-cyan-300 px-1.5 py-0.5 rounded text-xs font-mono"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    p({ children }) {
                      return <p className="mb-2 last:mb-0">{children}</p>;
                    },
                    ul({ children }) {
                      return <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>;
                    },
                    ol({ children }) {
                      return <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>;
                    },
                  }}
                >
                </ReactMarkdown>
              </div>
            )}

            {!isUser && message.usage && (
              <div className="mt-2.5 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                <span className="flex items-center gap-1 text-cyan-400">
                  <Zap size={11} className="text-amber-400" />
                  <span className="font-semibold text-neutral-200">
                    {message.usage.totalTokens.toLocaleString('it-IT')}
                  </span>
                  <span className="text-[10px] text-neutral-400">token</span>
                </span>
                <span className="text-[10px] text-neutral-500 hidden sm:inline">
                  in: {message.usage.promptTokens.toLocaleString('it-IT')} · out:{' '}
                  {message.usage.completionTokens.toLocaleString('it-IT')}
                </span>
                {message.model && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-sans">
                    {message.model.replace('gemini-', '')}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center shrink-0 border border-neutral-700">
          <User size={16} className="text-neutral-300" />
        </div>
      )}
    </div>
  );
}

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 font-mono text-xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800/80 text-neutral-400">
        <span className="text-[11px] font-semibold text-neutral-300">{language}</span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1 hover:text-white transition-colors p-1 rounded"
          title="Copia codice"
        >
          {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          <span className="text-[10px]">{copied ? 'Copiato' : 'Copia'}</span>
        </button>
      </div>
      <div className="p-3 overflow-x-auto max-h-96">
        <pre className="text-neutral-200 font-mono leading-tight whitespace-pre">
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
}
