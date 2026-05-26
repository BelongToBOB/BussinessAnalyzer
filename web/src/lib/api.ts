const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

let cachedUserId: string | null = null;

/** Get current user ID from Auth.js session */
async function getUserId(): Promise<string | null> {
  if (cachedUserId) return cachedUserId;
  try {
    const res = await fetch('/api/auth/session');
    if (res.ok) {
      const session = await res.json();
      cachedUserId = session?.user?.id || null;
      return cachedUserId;
    }
  } catch { /* ignore */ }
  return null;
}

/** Clear cached user (call on logout) */
export function clearUserCache() {
  cachedUserId = null;
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const userId = await getUserId();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (userId) {
    headers['X-User-Id'] = userId;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers as Record<string, string> || {}),
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `API error ${res.status}`);
  }
  return res.json();
}

// Business
export const getBusiness = () => fetchApi('/api/business');
export const createBusiness = (data: { name: string; monthlyDebtService?: number | null }) =>
  fetchApi('/api/business', { method: 'POST', body: JSON.stringify(data) });
export const updateBusiness = (data: { name?: string; monthlyDebtService?: number | null }) =>
  fetchApi('/api/business', { method: 'PATCH', body: JSON.stringify(data) });

// Entries
export const listEntries = (months = 12) => fetchApi(`/api/entries?months=${months}`);
export const getEntry = (yyyyMm: string) => fetchApi(`/api/entries/${yyyyMm}`);
export const upsertEntry = (yyyyMm: string, data: Record<string, unknown>) =>
  fetchApi(`/api/entries/${yyyyMm}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteEntry = (yyyyMm: string) =>
  fetchApi(`/api/entries/${yyyyMm}`, { method: 'DELETE' });

// Trends
export const getTrends = (months = 12) => fetchApi(`/api/entries/trends?months=${months}`);
