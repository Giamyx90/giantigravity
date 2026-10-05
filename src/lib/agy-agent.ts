import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { AgentStep, DiffChunk } from '@/types';
import { computeDiff } from '@/lib/diff';

export interface AgyExecutableInfo {
  exe: string;
  baseArgs: string[];
}

export function getAgyExecutable(): AgyExecutableInfo | null {
  const home = os.homedir();
  const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');

  // 1. Eseguibile diretto Antigravity Language Server
  const directLsExe = path.join(
    localAppData,
    'Programs',
    'Antigravity',
    'resources',
    'bin',
    'language_server.exe'
  );
  if (fs.existsSync(directLsExe)) {
    return { exe: directLsExe, baseArgs: ['agentapi'] };
  }

  // 2. Batch script agentapi.bat in .gemini/antigravity/bin
  const agentApiBat = path.join(home, '.gemini', 'antigravity', 'bin', 'agentapi.bat');
  if (fs.existsSync(agentApiBat)) {
    return { exe: agentApiBat, baseArgs: [] };
  }

  // 3. Altri percorsi candidati o agy.exe
  const candidateExes = [
    path.join(home, 'AppData', 'Roaming', 'Antigravity', 'bin', 'agy-node.cmd'),
    path.join(home, '.gemini', 'antigravity', 'bin', 'agy.exe'),
    path.join(home, '.gemini', 'bin', 'agy.exe'),
    path.join(localAppData, 'agy', 'bin', 'agy.exe'),
    path.join(home, '.gemini', 'antigravity', 'bin', 'agy'),
    path.join(home, '.gemini', 'bin', 'agy'),
  ];

  for (const candidate of candidateExes) {
    if (fs.existsSync(/*turbopackIgnore: true*/ candidate)) {
      return { exe: candidate, baseArgs: [] };
    }
  }

  return null;
}

export function getAgyExecutablePath(): string | null {
  const target = getAgyExecutable();
  return target ? target.exe : null;
}

export function isAgyInstalled(): boolean {
  return Boolean(getAgyExecutable());
}

export function normalizeAgyModel(model?: string): 'flash_lite' | 'flash' | 'pro' {
  if (!model) return 'flash';
  const lower = model.toLowerCase();
  if (lower.includes('lite')) return 'flash_lite';
  if (lower.includes('pro') || lower.includes('opus')) return 'pro';
  return 'flash';
}

function parseToolArgs(rawArgs: any): Record<string, any> {
  if (!rawArgs || typeof rawArgs !== 'object') return {};
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(rawArgs)) {
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ) {
        try {
          cleaned[key] = JSON.parse(trimmed);
        } catch {
          cleaned[key] = trimmed.slice(1, -1);
        }
      } else {
        cleaned[key] = val;
      }
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

function makeSummary(toolName: string, args: Record<string, any>): string {
  if (toolName === 'view_file') {
    const file = args.AbsolutePath || args.path || 'file';
    return `Lettura file: ${path.basename(file)}`;
  }
  if (toolName === 'write_to_file') {
    const file = args.TargetFile || args.path || 'file';
    return `Creazione/Scrittura file: ${path.basename(file)}`;
  }
  if (toolName === 'replace_file_content') {
    const file = args.TargetFile || args.path || 'file';
    return `Modifica file: ${path.basename(file)}`;
  }
  if (toolName === 'run_command') {
    return `Comando terminale: ${args.CommandLine || 'comando'}`;
  }
  if (toolName === 'list_directory' || toolName === 'list_dir') {
    return `Esplorazione cartella: ${args.dir_path || args.path || '.'}`;
  }
  if (toolName === 'search_code' || toolName === 'grep_search') {
    return `Ricerca codice: "${args.query || args.pattern || ''}"`;
  }
  return `Esecuzione: ${toolName}`;
}

export function generateAutoSummary(steps: AgentStep[]): string {
  if (steps.length === 0) return 'Operazione completata con successo.';

  const modifiedFiles = new Set<string>();
  const readFiles = new Set<string>();
  const executedCommands: string[] = [];

  for (const step of steps) {
    const tool = step.tool;
    const args = step.args || {};
    if (tool === 'write_to_file' || tool === 'replace_file_content' || tool === 'edit_file') {
      const file = args.TargetFile || args.path || 'file';
      modifiedFiles.add(path.basename(file));
    } else if (tool === 'view_file') {
      const file = args.AbsolutePath || args.path || 'file';
      readFiles.add(path.basename(file));
    } else if (tool === 'run_command') {
      if (args.CommandLine) {
        executedCommands.push(args.CommandLine);
      }
    }
  }

  let summary = '### 📋 Riepilogo Azioni Eseguite:\n';
  if (modifiedFiles.size > 0) {
    summary += `\n- **File modificati o creati (${modifiedFiles.size}):**\n` +
      Array.from(modifiedFiles).map((f) => `  - \`${f}\``).join('\n');
  }
  if (readFiles.size > 0) {
    summary += `\n- **File esaminati (${readFiles.size}):**\n` +
      Array.from(readFiles).map((f) => `  - \`${f}\``).join('\n');
  }
  if (executedCommands.length > 0) {
    summary += `\n- **Comandi eseguiti (${executedCommands.length}):**\n` +
      executedCommands.map((c) => `  - \`${c}\``).join('\n');
  }
  summary += `\n\n*Totale passaggi eseguiti:* ${steps.length}`;
  return summary;
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
  modelName = 'gemini-3.8-flash',
  conversationId,
  workspaceDir,
  onStepUpdate,
  onChunk,
  onInit,
}: RunAgyParams): Promise<{ reply: string; steps: AgentStep[]; conversationId?: string }> {
  const agy = getAgyExecutable();

  if (!agy) {
    throw new Error(
      'Google Antigravity non trovato sul PC locale. Assicurati che sia installato o avvia Antigravity.'
    );
  }

  const modelTier = normalizeAgyModel(modelName);
  const cwd = workspaceDir || process.cwd();
  const home = os.homedir();

  let activeConversationId = conversationId;
  let initialLineCount = 0;

  // 1. Se la conversazione esiste già, contiamo le righe prima del nuovo messaggio
  if (activeConversationId) {
    const transcriptPath = path.join(
      home,
      '.gemini',
      'antigravity',
      'brain',
      activeConversationId,
      '.system_generated',
      'logs',
      'transcript.jsonl'
    );
    if (fs.existsSync(transcriptPath)) {
      try {
        const existingContent = fs.readFileSync(transcriptPath, 'utf8');
        initialLineCount = existingContent.trim().split('\n').filter(Boolean).length;
      } catch (e) {
        initialLineCount = 0;
      }
    }

    // Invia messaggio alla conversazione esistente
    const args = [...agy.baseArgs, 'send-message', activeConversationId, prompt];
    const proc = spawnSync(/*turbopackIgnore: true*/ agy.exe, args, {
      cwd,
      encoding: 'utf8',
      windowsHide: true,
      maxBuffer: 10 * 1024 * 1024,
    });

    if (proc.status !== 0 && proc.status !== null) {
      throw new Error(`Errore nell'invio del messaggio ad Antigravity: ${proc.stderr || proc.stdout}`);
    }
  } else {
    // Nuova conversazione
    const args = [
      ...agy.baseArgs,
      'new-conversation',
      `--model=${modelTier}`,
      '--title=Giantigravity Mobile',
      prompt,
    ];

    const proc = spawnSync(/*turbopackIgnore: true*/ agy.exe, args, {
      cwd,
      encoding: 'utf8',
      windowsHide: true,
      maxBuffer: 10 * 1024 * 1024,
    });

    if (proc.status !== 0 && proc.status !== null) {
      throw new Error(`Impossibile avviare la conversazione Antigravity: ${proc.stderr || proc.stdout}`);
    }

    try {
      const parsed = JSON.parse(proc.stdout.trim());
      activeConversationId = parsed?.response?.newConversation?.conversationId;
    } catch (e) {
      throw new Error(`Risposta non valida da Antigravity: ${proc.stdout}`);
    }

    if (!activeConversationId) {
      throw new Error('Nessun ID conversazione restituito da Antigravity.');
    }

    if (onInit) {
      onInit({ conversationId: activeConversationId });
    }
    initialLineCount = 0;
  }

  const transcriptPath = path.join(
    home,
    '.gemini',
    'antigravity',
    'brain',
    activeConversationId,
    '.system_generated',
    'logs',
    'transcript.jsonl'
  );

  // 2. Monitoraggio del transcript in tempo reale
  return new Promise((resolve, reject) => {
    const stepsMap = new Map<string, AgentStep>();
    let finalReply = '';
    let processedLineIndex = initialLineCount;
    let attempts = 0;
    let idleAttempts = 0;
    const maxIdleAttempts = 160; // 160 * 250ms = 40 secondi di inattività senza nuovi log
    const maxTotalAttempts = 1200; // 5 minuti max per comandi molto lunghi

    const interval = setInterval(() => {
      attempts++;
      idleAttempts++;

      if (fs.existsSync(transcriptPath)) {
        try {
          const raw = fs.readFileSync(transcriptPath, 'utf8');
          const lines = raw.trim().split('\n').filter(Boolean);

          while (processedLineIndex < lines.length) {
            idleAttempts = 0; // Nuova attività o step rilevato: azzera il timer di inattività
            const lineStr = lines[processedLineIndex];
            processedLineIndex++;

            let parsed: any;
            try {
              parsed = JSON.parse(lineStr);
            } catch {
              continue;
            }

            if (parsed.source === 'MODEL') {
              if (parsed.type === 'PLANNER_RESPONSE') {
                // Gestione chiamate a strumenti (tools)
                if (parsed.tool_calls && Array.isArray(parsed.tool_calls) && parsed.tool_calls.length > 0) {
                  for (let i = 0; i < parsed.tool_calls.length; i++) {
                    const call = parsed.tool_calls[i];
                    const toolName = call.name || 'tool';
                    const toolArgs = parseToolArgs(call.args);
                    const stepId = `step-${parsed.step_index}-${i}`;

                    let diff: DiffChunk[] | undefined;
                    if (toolName === 'replace_file_content' && toolArgs.TargetContent && toolArgs.ReplacementContent) {
                      diff = computeDiff(toolArgs.TargetContent, toolArgs.ReplacementContent);
                    } else if (toolName === 'write_to_file' && toolArgs.CodeContent) {
                      diff = computeDiff('', toolArgs.CodeContent);
                    }

                    const summary = makeSummary(toolName, toolArgs);
                    const step: AgentStep = {
                      id: stepId,
                      tool: toolName,
                      summary,
                      status: 'running',
                      args: toolArgs,
                      diff,
                      timestamp: Date.now(),
                    };

                    stepsMap.set(stepId, step);
                    onStepUpdate(step);
                  }
                }

                // Risposta finale testuale del turno
                if (parsed.content && (!parsed.tool_calls || parsed.tool_calls.length === 0)) {
                  finalReply = parsed.content;

                  // Se sono stati eseguiti dei tool e la risposta non include già un riepilogo, appendiamo il riassunto strutturato
                  if (
                    stepsMap.size > 0 &&
                    !finalReply.toLowerCase().includes('riepilogo') &&
                    !finalReply.toLowerCase().includes('riassunto') &&
                    !finalReply.toLowerCase().includes('file modificat')
                  ) {
                    finalReply = `${finalReply}\n\n---\n${generateAutoSummary(Array.from(stepsMap.values()))}`;
                  }

                  onChunk(finalReply);
                  clearInterval(interval);
                  resolve({
                    reply: finalReply,
                    steps: Array.from(stepsMap.values()),
                    conversationId: activeConversationId,
                  });
                  return;
                }
              } else if (parsed.type === 'GENERIC') {
                // Risultato di esecuzione di un tool
                const runningSteps = Array.from(stepsMap.values()).filter((s) => s.status === 'running');
                if (runningSteps.length > 0) {
                  const lastStep = runningSteps[runningSteps.length - 1];
                  lastStep.status = 'completed';
                  lastStep.result = parsed.content;
                  stepsMap.set(lastStep.id, lastStep);
                  onStepUpdate(lastStep);
                }
              }
            }
          }
        } catch (readErr) {
          // Errore temporaneo di lettura concorrente, si riprova al prossimo tick
        }
      }

      if (idleAttempts >= maxIdleAttempts || attempts >= maxTotalAttempts) {
        clearInterval(interval);
        const steps = Array.from(stepsMap.values());
        if (finalReply) {
          if (
            steps.length > 0 &&
            !finalReply.toLowerCase().includes('riepilogo') &&
            !finalReply.toLowerCase().includes('riassunto')
          ) {
            finalReply = `${finalReply}\n\n---\n${generateAutoSummary(steps)}`;
          }
          resolve({
            reply: finalReply,
            steps,
            conversationId: activeConversationId,
          });
        } else {
          const autoSummary = generateAutoSummary(steps);
          resolve({
            reply: autoSummary,
            steps,
            conversationId: activeConversationId,
          });
        }
      }
    }, 250);
  });
}
