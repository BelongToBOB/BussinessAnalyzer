import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';

const providers: any[] = [
  Google({
    clientId: process.env.AUTH_GOOGLE_ID!,
    clientSecret: process.env.AUTH_GOOGLE_SECRET!,
  }),
];

// Dev credentials provider — always available in development
if (process.env.NODE_ENV !== 'production') {
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

        return { id: 'dev-user', email, name: email.split('@')[0] };
      },
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        token.userId = user.id;

        // Sync with backend on initial sign-in (Google or any OAuth)
        if (account.provider !== 'dev-login') {
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
    maxAge: 30 * 24 * 60 * 60,
  },
});
