import NextAuth, { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { NextRequest } from 'next/server';

function createAuthOptions(
  clientId: string,
  clientSecret: string,
  includeGeminiScope: boolean = false
): AuthOptions {
  // Se includeGeminiScope è falso, usiamo gli ambiti standard di Google (openid email profile)
  // per evitare che Google Cloud blocchi il login con l'errore "Some requested scopes cannot be shown"
  const scope = includeGeminiScope
    ? 'openid email profile https://www.googleapis.com/auth/generative-language'
    : 'openid email profile';

  return {
    providers: [
      GoogleProvider({
        clientId: clientId || process.env.GOOGLE_CLIENT_ID || 'dummy-client-id',
        clientSecret: clientSecret || process.env.GOOGLE_CLIENT_SECRET || 'dummy-client-secret',
        authorization: {
          params: {
            scope,
            prompt: 'consent',
            access_type: 'offline',
            response_type: 'code',
          },
        },
      }),
    ],
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
        }
        return token;
      },
      async session({ session, token }) {
        (session as any).accessToken = token.accessToken;
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
  const cookieGeminiScope = req.cookies.get('google_gemini_scope')?.value;

  const clientId = cookieClientId ? decodeURIComponent(cookieClientId) : (process.env.GOOGLE_CLIENT_ID || '');
  const clientSecret = cookieClientSecret ? decodeURIComponent(cookieClientSecret) : (process.env.GOOGLE_CLIENT_SECRET || '');
  const includeGeminiScope = cookieGeminiScope === 'true';

  const authOptions = createAuthOptions(clientId, clientSecret, includeGeminiScope);
  return NextAuth(req, ctx, authOptions);
}

export { handler as GET, handler as POST };
