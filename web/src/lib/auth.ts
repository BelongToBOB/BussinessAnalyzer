import NextAuth from 'next-auth';
import LINE from 'next-auth/providers/line';
import Resend from 'next-auth/providers/resend';

// JWT strategy — no DB connection needed at the edge (CF Pages compatible).
// User account creation/linking is handled by the NestJS backend.
// Auth.js only manages the JWT session token.

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    LINE({
      clientId: process.env.LINE_CHANNEL_ID!,
      clientSecret: process.env.LINE_CHANNEL_SECRET!,
    }),
    Resend({
      from: process.env.EMAIL_FROM || 'noreply@winwinwealth.co',
      apiKey: process.env.RESEND_API_KEY!,
    }),
  ],
  pages: {
    signIn: '/login',
    verifyRequest: '/auth/verify',
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // On initial sign-in, sync user to backend
      if (account && (user?.email || profile)) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
          const res = await fetch(`${apiUrl}/api/auth/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              email: user?.email || null,
              name: user?.name || (profile as any)?.displayName || null,
              image: user?.image || null,
            }),
          });
          if (res.ok) {
            const synced = await res.json();
            token.userId = synced.id;
          }
        } catch {
          // Backend unavailable — continue with token-only
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});
