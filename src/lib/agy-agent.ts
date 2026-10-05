import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { AgentStep, DiffChunk } from '@/types';
import { computeDiff } from '@/lib/diff';

export function getAgyExecutablePath(): string | null {
  const home = os.homedir();
  const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');

  const candidatePaths = [
    path.join(home, '.gemini', 'antigravity', 'bin', 'agy.exe'),
    path.join(home, '.gemini', 'bin', 'agy.exe'),
    path.join(localAppData, 'agy', 'bin', 'agy.exe'),
    path.join(home, '.gemini', 'antigravity', 'bin', 'agy'),
    path.join(home, '.gemini', 'bin', 'agy'),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(/*turbopackIgnore: true*/ candidate)) {
      return candidate;
    }
  }

  // Fallback to searching in PATH
  return 'agy';
}

export function isAgyInstalled(): boolean {
  const agyPath = getAgyExecutablePath();
  if (agyPath && fs.existsSync(/*turbopackIgnore: true*/ agyPath)) {
    return true;
  }
  return false;
}

export function normalizeAgyModel(model?: string): string {
  if (!model) return 'gemini-3.8-flash-high';
  if (model.endsWith('-high') || model.endsWith('-medium') || model.endsWith('-low')) {
    return model;
  }

  const modelMap: Record<string, string> = {
    'gemini-3.8-flash': 'gemini-3.8-flash-high',
    'gemini-3.7-flash': 'gemini-3.7-flash-high',
    'gemini-3.6-flash': 'gemini-3.6-flash-high',
    'gemini-3.1-pro': 'gemini-3.1-pro-high',
    'claude-opus-5-5': 'claude-opus-5-5-high',
    'claude-sonnet-5-5': 'claude-sonnet-5-5-high',
    'gpt-oss-120b': 'gpt-oss-120b-medium',
    'gemini-2.5-flash': 'gemini-3.8-flash-high',
    'gemini-2.5-pro': 'gemini-3.1-pro-high',
  };

  return modelMap[model] || `${model}-high`;
}

export interface RunAgyParams {
  prompt: string;
  modelName?: string;
  conversationId?: string;
  workspaceDir?: string;
  onStepUpdate: (step: AgentStep) => void;
  onChunk: (chunk: string) => void;
  onInit?: (data: { conversationId: string }) => void;
}

export async function runAgyAgent({
  prompt,
  modelName = 'gemini-3.8-flash-high',
  conversationId,
  workspaceDir,
  onStepUpdate,
  onChunk,
  onInit,
}: RunAgyParams): Promise<{ reply: string; steps: AgentStep[]; conversationId?: string }> {
  const agyExe = getAgyExecutablePath();

  if (!agyExe) {
    throw new Error(
      'Antigravity CLI (agy) non trovato. Assicurati che Google Antigravity per Windows sia installato.'
    );
  }

  const normalizedModel = normalizeAgyModel(modelName);
  const cwd = workspaceDir || process.cwd();

  const args: string[] = [
    '-p',
    prompt,
    '--model',
    normalizedModel,
    '--output-format',
    'stream-json',
    '--dangerously-skip-permissions',
  ];

  if (conversationId) {
    args.push('--conversation', conversationId);
  }

  return new Promise((resolve, reject) => {
    const stepsMap = new Map<string, AgentStep>();
    let finalReply = '';
    let currentConversationId = conversationId;
    let accumulatedText = '';

    const child = spawn(/*turbopackIgnore: true*/ agyExe, args, {
      cwd,
      env: { ...process.env },
      windowsHide: true,
    });

    let buffer = '';

    child.stdout.on('data', (data: Buffer) => {
      buffer += data.toString('utf8');
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const parsed = JSON.parse(trimmed);

          if (parsed.event === 'init') {
            currentConversationId = parsed.conversation_id;
            if (onInit && currentConversationId) {
              onInit({ conversationId: currentConversationId });
            }
          } else if (parsed.event === 'step_update' && parsed.step_update) {
            const update = parsed.step_update;

            if (update.step_type === 'tool') {
              const stepId = `agy-step-${update.step_index}`;
              const toolName = update.tool_name || 'tool';
              const params = update.tool_info?.parameters || {};

              let diff: DiffChunk[] | undefined;
              if (toolName === 'replace_file_content' && params.TargetContent && params.ReplacementContent) {
                diff = computeDiff(params.TargetContent, params.ReplacementContent);
              } else if (toolName === 'write_to_file' && params.CodeContent) {
                diff = computeDiff('', params.CodeContent);
              }

              let summary = `Esecuzione ${toolName}`;
              if (toolName === 'view_file') {
                summary = `Lettura file: ${params.AbsolutePath ? path.basename(params.AbsolutePath) : (params.path || 'file')}`;
              } else if (toolName === 'write_to_file') {
                summary = `Scrittura file: ${params.TargetFile ? path.basename(params.TargetFile) : (params.path || 'file')}`;
              } else if (toolName === 'replace_file_content') {
                summary = `Modifica file: ${params.TargetFile ? path.basename(params.TargetFile) : (params.path || 'file')}`;
              } else if (toolName === 'run_command') {
                summary = `Comando: ${params.CommandLine || 'terminale'}`;
              } else if (toolName === 'list_dir' || toolName === 'list_directory') {
                summary = `Analisi cartella: ${params.dir_path || params.path || '.'}`;
              } else if (toolName === 'grep_search' || toolName === 'search_code') {
                summary = `Ricerca codice: "${params.pattern || params.query || ''}"`;
              }

              const existing = stepsMap.get(stepId);
              const step: AgentStep = {
                id: stepId,
                tool: toolName,
                summary: existing?.summary || summary,
                status: update.state === 'DONE' ? 'completed' : 'running',
                args: params,
                result: update.tool_info?.output,
                diff: diff || existing?.diff,
                timestamp: existing?.timestamp || Date.now(),
              };

              stepsMap.set(stepId, step);
              onStepUpdate(step);
            } else if (update.step_type === 'agent_response' && update.text_delta) {
              accumulatedText += update.text_delta;
              onChunk(update.text_delta);
            }
          } else if (parsed.event === 'result' && parsed.result) {
            finalReply = parsed.result.response || accumulatedText;
          }
        } catch (e) {
          // Non-JSON output line, ignore or log
        }
      }
    });

    let stderrOutput = '';
    child.stderr.on('data', (data: Buffer) => {
      stderrOutput += data.toString('utf8');
    });

    child.on('error', (err) => {
      reject(new Error(`Impossibile avviare il processo Antigravity CLI: ${err.message}`));
    });

    child.on('close', (code) => {
      if (code !== 0 && !finalReply && !accumulatedText) {
        reject(
          new Error(
            `Antigravity CLI terminato con codice ${code}. ${stderrOutput.trim() || 'Nessun messaggio di errore.'}`
          )
        );
        return;
      }

      const allSteps = Array.from(stepsMap.values());
      resolve({
        reply: finalReply || accumulatedText,
        steps: allSteps,
        conversationId: currentConversationId,
      });
    });
  });
}
