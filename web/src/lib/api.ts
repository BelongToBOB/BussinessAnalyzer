const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
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
