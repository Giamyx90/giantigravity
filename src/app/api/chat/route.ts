import { NextRequest } from 'next/server';
import { runAgent } from '@/lib/gemini-agent';
import { AgentStep, RepoContext } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prompt,
      repoContext,
      history = [],
      settings = {},
    }: {
      prompt: string;
      repoContext: RepoContext;
      history?: any[];
      settings?: {
        geminiApiKey?: string;
        githubToken?: string;
        selectedModel?: string;
      };
    } = body;

    const apiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY;
    const githubToken = settings.githubToken || process.env.GITHUB_TOKEN;
    const modelName = settings.selectedModel || process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Chiave API Gemini mancante. Tocca l\'icona delle impostazioni in alto per configurare la tua chiave personale.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!githubToken) {
      return new Response(
        JSON.stringify({ error: 'GitHub Token mancante. Tocca l\'icona delle impostazioni per configurare il tuo token personale.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!repoContext?.owner || !repoContext?.repo) {
      return new Response(
        JSON.stringify({ error: 'Nessun repository selezionato. Scegli un repository GitHub dall\'intestazione.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        function sendEvent(data: Record<string, any>) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        }

        try {
          const result = await runAgent({
            apiKey,
            githubToken,
            modelName,
            repoContext,
            prompt,
            history,
            onStepUpdate: (step: AgentStep) => {
              sendEvent({ type: 'step', step });
            },
            onChunk: (chunk: string) => {
              sendEvent({ type: 'chunk', text: chunk });
            },
          });

          sendEvent({ type: 'done', reply: result.reply, steps: result.steps });
        } catch (err: any) {
          console.error('Agent error:', err);
          sendEvent({ type: 'error', error: err.message || 'Errore durante l\'esecuzione dell\'agente.' });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Errore interno del server.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
