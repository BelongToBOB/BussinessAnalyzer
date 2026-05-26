/**
 * Integration test: full user flow
 * Login → Dashboard (no biz → redirect) → Onboarding → Dashboard (with data)
 *
 * Tests the api.ts layer that all pages depend on.
 */

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.resetModules();
  mockFetch.mockReset();
});

// Helper: setup fetch mock for a specific flow
function setupMocks(config: {
  session?: { user: { id: string } } | null;
  businessExists?: boolean;
  businessData?: any;
  entryExists?: boolean;
  entryData?: any;
  createBusinessOk?: boolean;
  upsertEntryOk?: boolean;
}) {
  const s = config.session ?? null;
  const businessData = config.businessData ?? { id: 'biz-1', name: 'Test' };

  mockFetch.mockImplementation((url: string, opts?: any) => {
    const method = opts?.method || 'GET';

    // Session endpoint (frontend-local)
    if (url === '/api/auth/session') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(s || {}),
      });
    }

    // Extract X-User-Id from headers
    const userId = opts?.headers?.['X-User-Id'];
    const urlPath = url.replace(/^https?:\/\/[^/]+/, '');

    // GET /api/business
    if (urlPath === '/api/business' && method === 'GET') {
      if (!userId) {
        return Promise.resolve({
          ok: false, status: 401,
          json: () => Promise.resolve({ message: 'Missing X-User-Id header. Please login first.' }),
        });
      }
      if (!config.businessExists) {
        return Promise.resolve({
          ok: false, status: 404,
          json: () => Promise.resolve({ message: 'No business found.' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(businessData),
      });
    }

    // POST /api/business
    if (urlPath === '/api/business' && method === 'POST') {
      if (config.createBusinessOk === false) {
        return Promise.resolve({
          ok: false, status: 500,
          json: () => Promise.resolve({ message: 'Create failed' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 'new-biz', ...JSON.parse(opts.body) }),
      });
    }

    // GET /api/entries/:month (dashboard computed)
    if (urlPath.match(/\/api\/entries\/\d{4}-\d{2}$/) && method === 'GET') {
      if (!config.entryExists) {
        return Promise.resolve({
          ok: false, status: 404,
          json: () => Promise.resolve({ message: 'No entry for this month' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(config.entryData ?? { month: '2026-05', boxes: {}, verdict: { level: 'ok', messages: [] } }),
      });
    }

    // PUT /api/entries/:month
    if (urlPath.match(/\/api\/entries\/\d{4}-\d{2}$/) && method === 'PUT') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 'entry-1', ...JSON.parse(opts.body) }),
      });
    }

    // Default
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
}

describe('Flow: No session (not logged in)', () => {
  test('getBusiness throws 401 when no session', async () => {
    setupMocks({ session: null });
    const { getBusiness } = await import('../api');
    // No session → no X-User-Id → backend 401
    await expect(getBusiness()).rejects.toThrow('Missing X-User-Id');
  });

  test('api calls have no X-User-Id when session is empty', async () => {
    setupMocks({ session: null });
    const { getBusiness } = await import('../api');
    try { await getBusiness(); } catch {}

    const apiCall = mockFetch.mock.calls.find((c: any) => c[0].includes('/api/business'));
    expect(apiCall[1].headers['X-User-Id']).toBeUndefined();
  });
});

describe('Flow: Logged in, no business (needs onboarding)', () => {
  test('getBusiness throws "No business found" with valid session', async () => {
    setupMocks({ session: { user: { id: 'user-1' } }, businessExists: false });
    const { getBusiness } = await import('../api');
    await expect(getBusiness()).rejects.toThrow('No business found');
  });

  test('createBusiness sends correct data with X-User-Id', async () => {
    setupMocks({ session: { user: { id: 'user-1' } } });
    const { createBusiness } = await import('../api');

    await createBusiness({ name: 'My Biz', monthlyDebtService: 45000 });

    const apiCall = mockFetch.mock.calls.find((c: any) =>
      c[0].includes('/api/business') && c[1]?.method === 'POST'
    );
    expect(apiCall).toBeDefined();
    expect(apiCall[1].headers['X-User-Id']).toBe('user-1');
    const body = JSON.parse(apiCall[1].body);
    expect(body.name).toBe('My Biz');
    expect(body.monthlyDebtService).toBe(45000);
  });
});

describe('Flow: Logged in, has business, no entry', () => {
  test('getBusiness succeeds, getEntry throws 404', async () => {
    setupMocks({
      session: { user: { id: 'user-1' } },
      businessExists: true,
      entryExists: false,
    });
    const { getBusiness, getEntry } = await import('../api');

    const biz = await getBusiness();
    expect(biz).toBeDefined();

    await expect(getEntry('2026-05')).rejects.toThrow();
  });
});

describe('Flow: Full happy path', () => {
  test('getBusiness + getEntry both succeed', async () => {
    setupMocks({
      session: { user: { id: 'user-1' } },
      businessExists: true,
      entryExists: true,
      entryData: {
        month: '2026-05',
        boxes: { '1_grossSales': { value: 500000 } },
        verdict: { level: 'ok', messages: ['Good'] },
      },
    });
    const { getBusiness, getEntry } = await import('../api');

    const biz = await getBusiness();
    expect(biz).toBeDefined();

    const entry = await getEntry('2026-05') as any;
    expect(entry.verdict.level).toBe('ok');
    expect(entry.boxes['1_grossSales'].value).toBe(500000);
  });

  test('upsertEntry sends data with X-User-Id', async () => {
    setupMocks({ session: { user: { id: 'user-1' } } });
    const { upsertEntry } = await import('../api');

    await upsertEntry('2026-05', { grossSales: 500000, cogs: 300000 });

    const apiCall = mockFetch.mock.calls.find((c: any) =>
      c[0].includes('/api/entries/2026-05') && c[1]?.method === 'PUT'
    );
    expect(apiCall[1].headers['X-User-Id']).toBe('user-1');
  });
});

describe('Error message matching (dashboard redirect logic)', () => {
  test('401 error contains identifiable text for redirect', async () => {
    setupMocks({ session: null });
    const { getBusiness } = await import('../api');
    try {
      await getBusiness();
      fail('should throw');
    } catch (e: any) {
      // Dashboard should redirect to /login on this error
      const shouldRedirectToLogin = e.message.includes('Missing') || e.message.includes('Unauthorized') || e.message.includes('login');
      expect(shouldRedirectToLogin).toBe(true);
    }
  });

  test('404 no business error contains identifiable text for redirect', async () => {
    setupMocks({ session: { user: { id: 'user-1' } }, businessExists: false });
    const { getBusiness } = await import('../api');
    try {
      await getBusiness();
      fail('should throw');
    } catch (e: any) {
      // Dashboard should redirect to /onboarding on this error
      const shouldRedirectToOnboarding = e.message.includes('No business') || e.message.includes('Not Found');
      expect(shouldRedirectToOnboarding).toBe(true);
    }
  });
});
