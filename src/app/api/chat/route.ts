import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { runAgent } from '@/lib/gemini-agent';
import { runAgyAgent, isAgyInstalled } from '@/lib/agy-agent';
import { AgentStep, RepoContext, UserSettings } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prompt,
      repoContext,
      history = [],
      conversationId,
      googleAccessToken,
      settings = {},
    }: {
      prompt: string;
      repoContext?: RepoContext;
      history?: any[];
      conversationId?: string;
      googleAccessToken?: string;
      settings?: Partial<UserSettings>;
    } = body;

    // Recupera il token di sessione NextAuth direttamente dai cookie HTTP del server
    const secret = process.env.NEXTAUTH_SECRET || 'giantigravity-app-dynamic-secret-key-2026';
    let token = await getToken({ req: req as any, secret });
    if (!token) {
      token = await getToken({ req: req as any, secret, secureCookie: true });
    }
    if (!token) {
      token = await getToken({ req: req as any, secret, secureCookie: false });
    }

    const serverAccessToken = (token?.accessToken as string) || undefined;
    const apiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY;
    const githubToken = settings.githubToken || process.env.GITHUB_TOKEN || '';
    const activeGoogleAccessToken = googleAccessToken || serverAccessToken || settings.googleAccessToken;
    const modelName = settings.selectedModel || process.env.GEMINI_MODEL || 'gemini-3.8-flash';
    const provider = settings.provider || (isAgyInstalled() ? 'antigravity' : (activeGoogleAccessToken ? 'google_oauth' : 'gemini_api'));

    const encoder = new TextEncoder();

    // 1. Antigravity CLI Mode (Nativo PC / Nessuna API Key richiesta)
    if (provider === 'antigravity' && isAgyInstalled()) {
      let fullPrompt = prompt;
      if (repoContext?.owner && repoContext?.repo && repoContext.owner !== 'local') {
        fullPrompt = `[Repository: ${repoContext.owner}/${repoContext.repo} | Branch: ${repoContext.branch || 'main'}]\n${prompt}`;
      }

      const stream = new ReadableStream({
        async start(controller) {
          function sendEvent(data: Record<string, any>) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          }

          try {
            const result = await runAgyAgent({
              prompt: fullPrompt,
              modelName,
              conversationId,
              onStepUpdate: (step: AgentStep) => {
                sendEvent({ type: 'step', step });
              },
              onChunk: (chunk: string) => {
                sendEvent({ type: 'chunk', text: chunk });
              },
              onInit: (data) => {
                sendEvent({ type: 'init', conversationId: data.conversationId });
              },
            });

            sendEvent({
              type: 'done',
              reply: result.reply,
              steps: result.steps,
              conversationId: result.conversationId,
            });
          } catch (err: any) {
            console.error('Antigravity CLI runner error:', err);
            sendEvent({
              type: 'error',
              error: err.message || 'Errore durante l\'esecuzione con Antigravity CLI.',
            });
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
    }

    // 2. Google OAuth Mode (Cloud / Vercel / Smartphone)
    if (!activeGoogleAccessToken && !apiKey) {
      if (token) {
        return new Response(
          JSON.stringify({
            error:
              'Sessione Google non sincronizzata (access_token assente nel cookie di sessione). Tocca "Esci" in alto a destra e poi di nuovo "Accedi con Google" per rinnovare la sessione con i permessi aggiornati.',
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({
          error:
            'Autenticazione mancante. Tocca "Accedi con Google" per autenticare la tua sessione ed iniziare a programmare.',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Estrai il Google Cloud Project Number/ID dal Client ID per l'attribuzione della quota
    const rawClientId =
      settings.googleClientId ||
      (token?.clientId as string) ||
      req.cookies.get('google_client_id')?.value ||
      process.env.GOOGLE_CLIENT_ID ||
      '';
    const googleProject = rawClientId.match(/^([0-9]+)-/)?.[1] || process.env.GOOGLE_CLOUD_PROJECT || undefined;

    const activeRepo: RepoContext = repoContext || {
      owner: 'Giamyx90',
      repo: 'giantigravity',
      branch: 'main',
    };

    const stream = new ReadableStream({
      async start(controller) {
        function sendEvent(data: Record<string, any>) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        }

        try {
          const result = await runAgent({
            apiKey,
            googleAccessToken: activeGoogleAccessToken,
            googleProject,
            githubToken,
            modelName,
            repoContext: activeRepo,
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
          // Mostra sempre l'errore raw esatto ricevuto da Google/Gemini senza nasconderlo o sostituirlo
          let rawError = '';
          if (typeof err === 'string') {
            rawError = err;
          } else if (err?.message) {
            rawError = err.message;
            if (err.status && !rawError.includes(String(err.status))) {
              rawError = `[Status ${err.status}] ${rawError}`;
            }
            if (err.errorDetails) {
              rawError += `\n${JSON.stringify(err.errorDetails, null, 2)}`;
            }
          } else {
            try {
              rawError = JSON.stringify(err, null, 2);
            } catch {
              rawError = String(err);
            }
          }

          sendEvent({
            type: 'error',
            error: rawError,
          });
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
