const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

let cachedUserId: string | null = null;
let syncAttempts = 0;

async function getUserId(): Promise<string | null> {
  if (cachedUserId) return cachedUserId;
  try {
    const res = await fetch('/api/auth/session');
    if (!res.ok) return null;
    const session = await res.json();
    if (!session?.user) return null;
    const email = session.user.email;
    const name = session.user.name;
    console.log('[auth] session:', { id: session.user.id, email, name });

    if (!email) {
      console.warn('[auth] no email in session, using id as fallback');
      cachedUserId = session.user.id || null;
      return cachedUserId;
    }

    // Sync with backend from browser (CF Worker can't reach backend due to same-zone issue)
    if (syncAttempts < 3) {
      syncAttempts++;
      try {
        const syncRes = await fetch(`${API_URL}/api/auth/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: 'credentials',
            providerAccountId: email,
            email,
            name,
            image: session.user.image,
          }),
        });
        if (syncRes.ok) {
          const synced = await syncRes.json();
          console.log('[auth] sync OK, userId:', synced.id);
          cachedUserId = synced.id;
          return cachedUserId;
        }
        const errText = await syncRes.text().catch(() => '');
        console.error('[auth] sync failed:', syncRes.status, errText);
      } catch (e) {
        console.error('[auth] sync error:', e);
      }
    }

    console.warn('[auth] using fallback id:', session.user.id);
    return session.user.id || null;
  } catch { /* ignore */ }
  return null;
}

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
export const deleteBusiness = () =>
  fetchApi('/api/business', { method: 'DELETE' });

// Entries
export const listEntries = (months = 12) => fetchApi(`/api/entries?months=${months}`);
export const getEntry = (yyyyMm: string) => fetchApi(`/api/entries/${yyyyMm}`);
export const upsertEntry = (yyyyMm: string, data: Record<string, unknown>) =>
  fetchApi(`/api/entries/${yyyyMm}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteEntry = (yyyyMm: string) =>
  fetchApi(`/api/entries/${yyyyMm}`, { method: 'DELETE' });

// Trends
export const getTrends = (months = 12) => fetchApi(`/api/entries/trends?months=${months}`);

// Expense Map
export const getExpenseItems = () => fetchApi('/api/expense-map/items');
export const createExpenseItem = (data: any) =>
  fetchApi('/api/expense-map/items', { method: 'POST', body: JSON.stringify(data) });
export const updateExpenseItem = (id: string, data: any) =>
  fetchApi(`/api/expense-map/items/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteExpenseItem = (id: string) =>
  fetchApi(`/api/expense-map/items/${id}`, { method: 'DELETE' });

export const getLeakChecks = () => fetchApi('/api/expense-map/leaks');
export const upsertLeakCheck = (checkNumber: number, data: any) =>
  fetchApi(`/api/expense-map/leaks/${checkNumber}`, { method: 'PUT', body: JSON.stringify(data) });

// Sessions (generic)
export const getSession = async (type: string, month?: string) => {
  const res = await fetchApi(`/api/sessions/${type}${month ? `/${month}` : ''}`);
  // Non-monthly GET returns array (list), monthly returns object — normalize
  if (Array.isArray(res)) return res[0] ?? null;
  return res;
};
export const saveSession = (type: string, data: any, month?: string) =>
  fetchApi(`/api/sessions/${type}${month ? `/${month}` : ''}`, { method: 'PUT', body: JSON.stringify(data) });
