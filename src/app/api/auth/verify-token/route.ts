import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { token, apiKey } = await req.json();

    if (token) {
      const cleanToken = token.trim();

      // 1. Verifica token OAuth presso Google tokeninfo
      const tokenInfoRes = await fetch(
        `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(cleanToken)}`
      );

      if (!tokenInfoRes.ok) {
        const errData = await tokenInfoRes.json().catch(() => ({}));
        return NextResponse.json({
          valid: false,
          error:
            errData.error_description ||
            errData.error ||
            'Token non valido o scaduto (i token ya29 durano tipicamente 60 minuti).',
        });
      }

      const tokenInfo = await tokenInfoRes.json();

      // 2. Test chiamata alle API di Gemini con questo token
      const geminiTestRes = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models',
        {
          headers: {
            Authorization: `Bearer ${cleanToken}`,
          },
        }
      );

      if (!geminiTestRes.ok) {
        const geminiErr = await geminiTestRes.json().catch(() => ({}));
        let userFriendlyError = geminiErr.error?.message;
        if (
          userFriendlyError?.includes('invalid authentication credentials') ||
          userFriendlyError?.includes('insufficient authentication scopes') ||
          userFriendlyError?.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT')
        ) {
          userFriendlyError = `Il token è valido per l'account (${tokenInfo.email || 'Google'}), ma NON ha i permessi per Gemini. Scope del tuo token: "${tokenInfo.scope || 'nessuno'}". Per accedere a Gemini senza blocchi di Google Cloud, usa direttamente una API Key di Google AI Studio.`;
        }
        return NextResponse.json({
          valid: false,
          error:
            userFriendlyError ||
            'Il token è valido ma non ha lo scope per Gemini. Si consiglia una API Key di Google AI Studio.',
          tokenInfo,
        });
      }

      const minutesLeft = tokenInfo.expires_in
        ? Math.round(Number(tokenInfo.expires_in) / 60)
        : undefined;

      return NextResponse.json({
        valid: true,
        email: tokenInfo.email,
        expiresIn: tokenInfo.expires_in,
        minutesLeft,
        scope: tokenInfo.scope,
      });
    }

    if (apiKey) {
      const cleanKey = apiKey.trim();
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(cleanKey)}`
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return NextResponse.json({
          valid: false,
          error: err.error?.message || 'API Key Gemini non valida o quote esaurite.',
        });
      }

      return NextResponse.json({ valid: true });
    }

    return NextResponse.json(
      { valid: false, error: 'Nessun token o chiave fornita.' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { valid: false, error: error.message || 'Errore di connessione a Google.' },
      { status: 500 }
    );
  }
}
