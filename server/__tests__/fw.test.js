import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFwClient } from '../fw.js';

function rpcResponse(id, payload) {
  return {
    jsonrpc: '2.0',
    id,
    result: {
      content: [{ type: 'text', text: JSON.stringify(payload) }],
      isError: false,
    },
  };
}

function rpcError(id, message, code = -32000) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

describe('fw client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('logs in on first call and caches session_id', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => rpcResponse(1, { session_id: 'sess-abc' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => rpcResponse(2, { brand_id: 1 }),
      });

    const fw = createFwClient({
      url: 'https://fw.example/',
      username: 'u',
      password: 'p',
      environment: 'staging',
      fetchImpl: fetchMock,
    });

    const result = await fw.invoke('sh_1_1_show-a-brand', { advertiser_id: 1, brand_id: 1 });

    expect(result).toEqual({ brand_id: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const loginBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(loginBody.params.name).toBe('streaming_hub_login');
    expect(loginBody.params.arguments).toMatchObject({ environment: 'staging', username: 'u', password: 'p' });
    const invokeBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(invokeBody.params.name).toBe('invoke_tool');
    expect(invokeBody.params.arguments.parameters.session_id).toBe('sess-abc');
  });

  it('re-logs in once on auth error then retries', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => rpcResponse(1, { session_id: 'sess-1' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => rpcError(2, 'unauthorized: session expired') })
      .mockResolvedValueOnce({ ok: true, json: async () => rpcResponse(3, { session_id: 'sess-2' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => rpcResponse(4, { brand_id: 1 }) });

    const fw = createFwClient({
      url: 'https://fw.example/',
      username: 'u', password: 'p', environment: 'staging',
      fetchImpl: fetchMock,
    });

    const result = await fw.invoke('sh_1_1_show-a-brand', { advertiser_id: 1, brand_id: 1 });
    expect(result).toEqual({ brand_id: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('surfaces non-auth errors without retrying', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => rpcResponse(1, { session_id: 'sess' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => rpcError(2, 'industry 5252 not assignable', -32602) });

    const fw = createFwClient({
      url: 'https://fw.example/',
      username: 'u', password: 'p', environment: 'staging',
      fetchImpl: fetchMock,
    });

    await expect(fw.invoke('sh_1_1_update-a-brand', { advertiser_id: 1, brand_id: 1, body: '<x/>' }))
      .rejects.toThrow(/industry 5252 not assignable/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
