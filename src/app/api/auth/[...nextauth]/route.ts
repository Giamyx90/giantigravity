import NextAuth, { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { NextRequest } from 'next/server';

async function refreshGoogleAccessToken(token: any) {
  try {
    const url = 'https://oauth2.googleapis.com/token';
    const clientId = token.clientId || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = token.clientSecret || process.env.GOOGLE_CLIENT_SECRET;

    if (!token.refreshToken || !clientId || !clientSecret) {
      return token;
    }

    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
      }),
      method: 'POST',
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      console.error('Failed to refresh Google token:', refreshedTokens);
      return {
        ...token,
        error: 'RefreshAccessTokenError',
      };
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + (refreshedTokens.expires_in || 3600),
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error('Error refreshing Google access token:', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

function createAuthOptions(clientId: string, clientSecret: string): AuthOptions {
  return {
    providers: [
      GoogleProvider({
        clientId: clientId || process.env.GOOGLE_CLIENT_ID || 'dummy-client-id',
        clientSecret: clientSecret || process.env.GOOGLE_CLIENT_SECRET || 'dummy-client-secret',
        authorization: {
          params: {
            // Ambito ufficiale Google Cloud Platform che autorizza Gemini e tutti i servizi cloud associati
            scope: 'openid email profile https://www.googleapis.com/auth/cloud-platform',
            prompt: 'consent',
            access_type: 'offline',
            response_type: 'code',
          },
        },
      }),
    ],
    session: {
      strategy: 'jwt',
      maxAge: 30 * 24 * 60 * 60,
    },
    callbacks: {
      async signIn({ user }) {
        const allowedEmail = process.env.AUTHORIZED_EMAIL;
        if (allowedEmail && user.email) {
          return user.email.toLowerCase() === allowedEmail.toLowerCase();
        }
        return true;
      },
      async jwt({ token, account }) {
        if (account) {
          token.accessToken = account.access_token;
          token.refreshToken = account.refresh_token;
          token.expiresAt = account.expires_at;
          token.clientId = clientId;
          token.clientSecret = clientSecret;
          return token;
        }

        // Se il token scade entro 5 minuti e disponiamo di refresh_token, rinnovalo automaticamente
        if (token.expiresAt && typeof token.expiresAt === 'number') {
          const nowInSeconds = Math.floor(Date.now() / 1000);
          if (token.expiresAt - nowInSeconds < 300 && token.refreshToken) {
            token = await refreshGoogleAccessToken(token);
          }
        }

        return token;
      },
      async session({ session, token }) {
        (session as any).accessToken = token.accessToken;
        (session as any).error = token.error;
        return session;
      },
    },
    pages: {
      signIn: '/',
    },
    secret: process.env.NEXTAUTH_SECRET || 'giantigravity-app-dynamic-secret-key-2026',
  };
}

async function handler(req: NextRequest, ctx: any) {
  const cookieClientId = req.cookies.get('google_client_id')?.value;
  const cookieClientSecret = req.cookies.get('google_client_secret')?.value;

  const clientId = cookieClientId ? decodeURIComponent(cookieClientId) : (process.env.GOOGLE_CLIENT_ID || '');
  const clientSecret = cookieClientSecret ? decodeURIComponent(cookieClientSecret) : (process.env.GOOGLE_CLIENT_SECRET || '');

  const authOptions = createAuthOptions(clientId, clientSecret);
  return NextAuth(req, ctx, authOptions);
}

export { handler as GET, handler as POST };
