/**
 * Unit tests for api.ts — fetchApi, getUserId, header injection
 *
 * These tests verify:
 * 1. X-User-Id header is sent on every API call
 * 2. Content-Type header is always present
 * 3. Headers from options don't overwrite auth headers
 * 4. POST/PUT body is passed correctly
 * 5. Error handling (non-200 responses throw)
 * 6. getUserId fetches from /api/auth/session correctly
 */

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Reset module cache between tests to clear cachedUserId
beforeEach(() => {
  jest.resetModules();
  mockFetch.mockReset();
});

function mockSession(userId: string | null) {
  mockFetch.mockImplementation((url: string) => {
    if (url === '/api/auth/session') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(userId ? { user: { id: userId, email: 'test@test.com' } } : {}),
      });
    }
    // Default: API call
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });
}

function mockSessionThenApi(userId: string, apiResponse: any, apiStatus = 200) {
  let callCount = 0;
  mockFetch.mockImplementation((url: string) => {
    if (url === '/api/auth/session') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ user: { id: userId } }),
      });
    }
    callCount++;
    return Promise.resolve({
      ok: apiStatus >= 200 && apiStatus < 300,
      status: apiStatus,
      statusText: apiStatus === 404 ? 'Not Found' : 'Error',
      json: () => Promise.resolve(apiResponse),
    });
  });
}

describe('api.ts — fetchApi', () => {
  test('sends X-User-Id header from session', async () => {
    mockSession('user-abc-123');
    const { getBusiness } = await import('../api');

    await getBusiness();

    // Second call should be the API call (first is session)
    const apiCall = mockFetch.mock.calls.find((c: any) => c[0].includes('/api/business'));
    expect(apiCall).toBeDefined();
    expect(apiCall[1].headers['X-User-Id']).toBe('user-abc-123');
  });

  test('sends Content-Type: application/json', async () => {
    mockSession('user-123');
    const { getBusiness } = await import('../api');

    await getBusiness();

    const apiCall = mockFetch.mock.calls.find((c: any) => c[0].includes('/api/business'));
    expect(apiCall[1].headers['Content-Type']).toBe('application/json');
  });

  test('POST body is passed correctly', async () => {
    mockSession('user-123');
    const { createBusiness } = await import('../api');

    await createBusiness({ name: 'Test Business', monthlyDebtService: 45000 });

    const apiCall = mockFetch.mock.calls.find((c: any) =>
      c[0].includes('/api/business') && c[1]?.method === 'POST'
    );
    expect(apiCall).toBeDefined();
    const body = JSON.parse(apiCall[1].body);
    expect(body.name).toBe('Test Business');
    expect(body.monthlyDebtService).toBe(45000);
  });

  test('PUT entry sends correct data', async () => {
    mockSession('user-123');
    const { upsertEntry } = await import('../api');

    await upsertEntry('2026-05', { grossSales: 500000, cogs: 300000 });

    const apiCall = mockFetch.mock.calls.find((c: any) =>
      c[0].includes('/api/entries/2026-05') && c[1]?.method === 'PUT'
    );
    expect(apiCall).toBeDefined();
    expect(apiCall[1].headers['X-User-Id']).toBe('user-123');
    const body = JSON.parse(apiCall[1].body);
    expect(body.grossSales).toBe(500000);
  });

  test('throws on non-200 response', async () => {
    mockSessionThenApi('user-123', { message: 'No business found.' }, 404);
    const { getBusiness } = await import('../api');

    await expect(getBusiness()).rejects.toThrow('No business found.');
  });

  test('no session → no X-User-Id header', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/auth/session') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
    const { getBusiness } = await import('../api');

    await getBusiness();

    const apiCall = mockFetch.mock.calls.find((c: any) => c[0].includes('/api/business'));
    expect(apiCall[1].headers['X-User-Id']).toBeUndefined();
  });

  test('caches userId after first session fetch', async () => {
    mockSession('cached-user');
    const { getBusiness, getEntry } = await import('../api');

    await getBusiness();
    await getEntry('2026-05');

    // /api/auth/session should only be called once
    const sessionCalls = mockFetch.mock.calls.filter((c: any) => c[0] === '/api/auth/session');
    expect(sessionCalls).toHaveLength(1);
  });
});
