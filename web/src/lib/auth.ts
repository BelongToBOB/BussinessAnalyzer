import NextAuth from 'next-auth';
import LINE from 'next-auth/providers/line';
import Credentials from 'next-auth/providers/credentials';

// JWT strategy — no DB connection needed at the edge (CF Pages compatible).
// User account creation/linking is handled by the NestJS backend.

const providers: any[] = [
  LINE({
    clientId: process.env.LINE_CHANNEL_ID!,
    clientSecret: process.env.LINE_CHANNEL_SECRET!,
  }),
];

// Dev credentials provider — login with any email, no password needed
// Only available when LINE credentials are not set (local dev)
if (!process.env.LINE_CHANNEL_ID || process.env.LINE_CHANNEL_ID === 'dummy') {
  providers.push(
    Credentials({
      id: 'dev-login',
      name: 'Dev Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        if (!email) return null;

        // Sync with backend
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
          const res = await fetch(`${apiUrl}/api/auth/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: 'credentials',
              providerAccountId: email,
              email,
              name: email.split('@')[0],
            }),
          });
          if (res.ok) {
            const user = await res.json();
            return { id: user.id, email: user.email, name: user.name };
          }
        } catch { /* backend down */ }

        // Fallback: return minimal user
        return { id: 'dev-user', email, name: email.split('@')[0] };
      },
    })
  );
}

// NOTE: Resend (magic link email) requires a DB adapter for verification tokens.
// It will be re-added when production uses Prisma adapter via backend proxy.
// For now, use LINE Login (production) or Dev Login (local dev).

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        token.userId = user.id;

        // Sync with backend on initial sign-in (LINE)
        if (account.provider === 'line') {
          try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
            const res = await fetch(`${apiUrl}/api/auth/sync`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                email: user.email,
                name: user.name,
                image: user.image,
              }),
            });
            if (res.ok) {
              const synced = await res.json();
              token.userId = synced.id;
            }
          } catch { /* backend unavailable */ }
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
