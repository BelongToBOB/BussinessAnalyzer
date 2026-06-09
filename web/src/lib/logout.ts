import { signOut } from 'next-auth/react';
import { clearUserCache } from './api';

export function logout() {
  clearUserCache();
  signOut({ callbackUrl: '/login' });
}
