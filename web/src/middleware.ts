export { auth as middleware } from '@/lib/auth';

export const config = {
  matcher: ['/dashboard/:path*', '/entry/:path*', '/history/:path*', '/settings/:path*', '/onboarding/:path*'],
};
