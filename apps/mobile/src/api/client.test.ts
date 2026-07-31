import { AuthTokens } from '@foodstra/shared';
import * as client from './client';

const store: Record<string, string | null> = {};

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { apiUrl: 'http://api.test' } } },
}));

jest.mock('../auth/storage', () => ({
  loadTokens: jest.fn(async () => {
    if (!store['access']) return null;
    return {
      accessToken: store['access'],
      refreshToken: store['refresh'],
      accessTokenExpiresAt: '2999-01-01T00:00:00.000Z',
    };
  }),
  saveTokens: jest.fn(async (t: AuthTokens) => {
    store['access'] = t.accessToken;
    store['refresh'] = t.refreshToken;
  }),
  clearTokens: jest.fn(async () => {
    store['access'] = null;
    store['refresh'] = null;
  }),
}));

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

const authPayload = (access: string): unknown => ({
  user: {
    id: 'u1',
    email: 'a@b.com',
    displayName: 'A',
    role: 'customer',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  tokens: {
    accessToken: access,
    refreshToken: `r_${access}`,
    accessTokenExpiresAt: '2999-01-01T00:00:00.000Z',
  },
});

describe('mobile api client', () => {
  beforeEach(() => {
    store['access'] = null;
    store['refresh'] = null;
  });

  it('logs in and persists the returned tokens', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, authPayload('acc1')));
    global.fetch = fetchMock as unknown as typeof fetch;

    const res = await client.login({ email: 'a@b.com', password: 'x' });
    expect(res.tokens.accessToken).toBe('acc1');
    expect(store['access']).toBe('acc1');
  });

  it('refreshes once and retries the original request on 401', async () => {
    store['access'] = 'stale';
    store['refresh'] = 'r_stale';

    const fetchMock = jest
      .fn()
      // 1) protected call -> 401
      .mockResolvedValueOnce(jsonResponse(401, { error: { code: 'unauthorized', message: 'no' } }))
      // 2) refresh -> new tokens
      .mockResolvedValueOnce(jsonResponse(200, authPayload('fresh')))
      // 3) retry -> success
      .mockResolvedValueOnce(jsonResponse(200, []));
    global.fetch = fetchMock as unknown as typeof fetch;

    await client.fetchAddresses();

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(store['access']).toBe('fresh');
    // The retried request carried the refreshed access token.
    const retryHeaders = (fetchMock.mock.calls[2]![1] as RequestInit).headers as Headers;
    expect(retryHeaders.get('Authorization')).toBe('Bearer fresh');
  });

  it('clears the session when refresh also fails', async () => {
    store['access'] = 'stale';
    store['refresh'] = 'r_stale';

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { error: { code: 'unauthorized', message: 'no' } }))
      .mockResolvedValueOnce(jsonResponse(401, { error: { code: 'unauthorized', message: 'no' } }));
    global.fetch = fetchMock as unknown as typeof fetch;

    let expired = false;
    client.setSessionExpiredHandler(() => {
      expired = true;
    });
    await expect(client.fetchAddresses()).rejects.toBeTruthy();
    expect(expired).toBe(true);
    expect(store['access']).toBeNull();
  });
});
