import { GoogleGenAI, Type } from '@google/genai';
import {
  listDirectory,
  readFileContent,
  searchCode,
  saveFileContent,
  createBranch,
  createPullRequest,
} from '@/lib/github';
import { computeDiff } from '@/lib/diff';
import { AgentStep, RepoContext } from '@/types';

export const agentToolDeclarations = [
  {
    name: 'list_directory',
    description: 'Elenca i file e le sottocartelle nel percorso specificato del repository GitHub.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: {
          type: Type.STRING,
          description: 'Percorso relativo della cartella all\'interno del repo (es. "" per la radice o "src/components").',
        },
      },
    },
  },
  {
    name: 'view_file',
    description: 'Legge il contenuto completo di un file dal repository GitHub.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: {
          type: Type.STRING,
          description: 'Percorso relativo del file da leggere (es. "package.json" o "src/index.ts").',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'search_code',
    description: 'Cerca termini, classi o definizioni di funzioni all\'interno del codice del repository.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: 'Termine o stringa di codice da cercare.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'edit_file',
    description: 'Crea o aggiorna un file nel repository GitHub creando un nuovo commit direttamente sul branch attivo.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: {
          type: Type.STRING,
          description: 'Percorso relativo del file da creare o modificare.',
        },
        content: {
          type: Type.STRING,
          description: 'Il codice sorgente completo e aggiornato del file.',
        },
        commit_message: {
          type: Type.STRING,
          description: 'Messaggio esplicativo del commit git (stile Conventional Commits, es. "feat: aggiungi validazione").',
        },
      },
      required: ['path', 'content', 'commit_message'],
    },
  },
  {
    name: 'create_branch',
    description: 'Crea un nuovo branch git a partire da un branch esistente.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        new_branch: {
          type: Type.STRING,
          description: 'Nome del nuovo branch da creare (es. "feature/nuova-funzione").',
        },
        base_branch: {
          type: Type.STRING,
          description: 'Nome del branch base di partenza (default: "main").',
        },
      },
      required: ['new_branch'],
    },
  },
  {
    name: 'create_pull_request',
    description: 'Apre una Pull Request su GitHub per proporre l\'unione delle modifiche di un branch.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: 'Titolo della Pull Request.',
        },
        body: {
          type: Type.STRING,
          description: 'Descrizione dettagliata delle modifiche apportate nella Pull Request.',
        },
        head: {
          type: Type.STRING,
          description: 'Branch sorgente che contiene le modifiche.',
        },
        base: {
          type: Type.STRING,
          description: 'Branch di destinazione (default: "main").',
        },
      },
      required: ['title', 'body', 'head'],
    },
  },
];

export interface AgentRunParams {
  apiKey?: string;
  googleAccessToken?: string;
  githubToken: string;
  modelName?: string;
  repoContext: RepoContext;
  prompt: string;
  history?: Array<{ role: 'user' | 'model'; parts: any[] }>;
  onStepUpdate: (step: AgentStep) => void;
  onChunk: (chunk: string) => void;
}

export async function runAgent({
  apiKey,
  googleAccessToken,
  githubToken,
  modelName = 'gemini-2.5-flash',
  repoContext,
  prompt,
  history = [],
  onStepUpdate,
  onChunk,
}: AgentRunParams): Promise<{ reply: string; steps: AgentStep[] }> {
  const cleanAccessToken = googleAccessToken?.trim();
  const cleanApiKey = apiKey?.trim();

  const ai = new GoogleGenAI({
    apiKey: cleanApiKey || 'placeholder-key',
  });

  // Se è presente una API Key, diamo sempre priorità alla chiave perché ha accesso completo a Gemini
  // Usa l'Access Token OAuth solo se NON è stata impostata una API Key
  if (!cleanApiKey && cleanAccessToken) {
    // Rimuove l'header x-goog-api-key e invia esclusivamente Authorization: Bearer <token>
    (ai as any).apiClient.clientOptions.auth.addAuthHeaders = async (headers: Headers) => {
      headers.set('Authorization', `Bearer ${cleanAccessToken}`);
    };
  }

  const systemInstruction = `Sei Giantigravity, un assistente di programmazione agentico avanzato alimentato da Google Gemini.
Lavori direttamente sul repository GitHub: "${repoContext.owner}/${repoContext.repo}" (branch attivo: "${repoContext.branch}").

Linee guida operative:
1. Comportati come un vero ingegnere del software senior: prima di modificare o creare file, verifica SEMPRE l'esistenza e la struttura del progetto con 'list_directory' o 'view_file'.
2. Non tirare a indovinare dipendenze o architettura: controlla package.json, configurazioni e file sorgente pertinenti.
3. Quando crei o modifichi file con 'edit_file', fornisci sempre il contenuto COMPLETO e pulito del file, con un commit message chiaro ed esaustivo.
4. Mantieni le risposte concise, cordiali e formattate in GitHub Markdown. Spiega cosa hai fatto e perché.
5. Se l'utente ti chiede di creare una funzione o correggere un bug, esegui autonomamente tutti i passaggi necessari (ispezione, lettura, scrittura e verifica).
Rispondi in lingua italiana.`;

  const contents: any[] = [
    ...history,
    {
      role: 'user',
      parts: [{ text: prompt }],
    },
  ];

  const steps: AgentStep[] = [];
  let finalAnswer = '';
  const maxLoops = 10;
  let loopCount = 0;

  while (loopCount < maxLoops) {
    loopCount++;

    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction,
        tools: [
          {
            functionDeclarations: agentToolDeclarations as any,
          },
        ],
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate || !candidate.content) {
      break;
    }

    const content = candidate.content;
    contents.push(content);

    const functionCalls = response.functionCalls || [];

    if (functionCalls.length === 0) {
      // Model finished calling tools, extract text answer
      const text = response.text || '';
      finalAnswer = text;
      onChunk(text);
      break;
    }

    // Execute each function call
    const functionResponseParts: any[] = [];

    for (const call of functionCalls) {
      const stepId = `step-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const args = call.args as Record<string, any>;

      const toolName = call.name || 'tool';
      let summary = `Esecuzione ${toolName}`;
      if (toolName === 'view_file') summary = `Lettura file: ${args.path}`;
      else if (toolName === 'list_directory') summary = `Analisi cartella: ${args.path || '/'}`;
      else if (toolName === 'search_code') summary = `Ricerca codice: "${args.query}"`;
      else if (toolName === 'edit_file') summary = `Modifica file: ${args.path}`;
      else if (toolName === 'create_branch') summary = `Creazione branch: ${args.new_branch}`;
      else if (toolName === 'create_pull_request') summary = `Apertura PR: ${args.title}`;

      const step: AgentStep = {
        id: stepId,
        tool: toolName,
        summary,
        status: 'running',
        args,
        timestamp: Date.now(),
      };

      steps.push(step);
      onStepUpdate({ ...step });

      let toolResult: any;
      let toolError: string | undefined;

      try {
        if (call.name === 'list_directory') {
          toolResult = await listDirectory(
            githubToken,
            repoContext.owner,
            repoContext.repo,
            repoContext.branch,
            args.path || ''
          );
        } else if (call.name === 'view_file') {
          const fileData = await readFileContent(
            githubToken,
            repoContext.owner,
            repoContext.repo,
            repoContext.branch,
            args.path
          );
          toolResult = { content: fileData.content, path: args.path };
        } else if (call.name === 'search_code') {
          toolResult = await searchCode(
            githubToken,
            repoContext.owner,
            repoContext.repo,
            args.query
          );
        } else if (call.name === 'edit_file') {
          // If editing existing file, compute diff first
          let oldContent = '';
          try {
            const oldFileData = await readFileContent(
              githubToken,
              repoContext.owner,
              repoContext.repo,
              repoContext.branch,
              args.path
            );
            oldContent = oldFileData.content;
          } catch {
            oldContent = ''; // Brand new file
          }

          const diff = computeDiff(oldContent, args.content);
          step.diff = diff;

          const commitResult = await saveFileContent(
            githubToken,
            repoContext.owner,
            repoContext.repo,
            repoContext.branch,
            args.path,
            args.content,
            args.commit_message
          );

          toolResult = {
            success: true,
            commitSha: commitResult.commitSha,
            commitUrl: commitResult.commitUrl,
            message: `File ${args.path} aggiornato con successo sul branch ${repoContext.branch}.`,
          };
        } else if (call.name === 'create_branch') {
          const branchResult = await createBranch(
            githubToken,
            repoContext.owner,
            repoContext.repo,
            args.new_branch,
            args.base_branch || repoContext.branch
          );
          toolResult = {
            success: true,
            branch: args.new_branch,
            ref: branchResult.ref,
          };
        } else if (call.name === 'create_pull_request') {
          const prResult = await createPullRequest(
            githubToken,
            repoContext.owner,
            repoContext.repo,
            args.title,
            args.body,
            args.head,
            args.base || repoContext.branch
          );
          toolResult = {
            success: true,
            prNumber: prResult.number,
            prUrl: prResult.html_url,
          };
        } else {
          throw new Error(`Tool sconosciuto: ${call.name}`);
        }

        step.status = 'completed';
        step.result = toolResult;
      } catch (err: any) {
        step.status = 'error';
        toolError = err.message || String(err);
        step.error = toolError;
        toolResult = { error: toolError };
      }

      onStepUpdate({ ...step });

      functionResponseParts.push({
        functionResponse: {
          name: toolName,
          response: {
            output: toolResult,
          },
        },
      });
    }

    contents.push({
      role: 'user',
      parts: functionResponseParts,
    });
  }

  return { reply: finalAnswer, steps };
}
