import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
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
    async session({ session, token }) {
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  secret: process.env.NEXTAUTH_SECRET || 'antigravity-mobile-fallback-secret-key-change-in-prod',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
