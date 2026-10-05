import NextAuth, { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { NextRequest } from 'next/server';

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

  const clientId = cookieClientId ? decodeURIComponent(cookieClientId) : (process.env.GOOGLE_CLIENT_ID || '');
  const clientSecret = cookieClientSecret ? decodeURIComponent(cookieClientSecret) : (process.env.GOOGLE_CLIENT_SECRET || '');

  const authOptions = createAuthOptions(clientId, clientSecret);
  return NextAuth(req, ctx, authOptions);
}

export { handler as GET, handler as POST };
