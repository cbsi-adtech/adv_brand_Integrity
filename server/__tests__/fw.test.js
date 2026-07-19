// @vitest-environment node
import { describe, it, expect, vi, beforeEach, beforeAll, afterEach } from 'vitest';
import _sodium from 'libsodium-wrappers';
import { createFwClient } from '../fw.js';
import { mutateBrandIndustry } from '../mutate-brand-xml.js';

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

function rpcTextResponse(id, text, isError = false) {
  return {
    jsonrpc: '2.0',
    id,
    result: {
      content: [{ type: 'text', text }],
      isError,
    },
  };
}

function rpcError(id, message, code = -32000) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

// shmcp login is a two-step flow: streaming_hub_get_login_public_key, then
// streaming_hub_login_encrypted with a sealed-box ciphertext. This router
// serves both steps and delegates every other tools/call to onInvoke.
let keys;
let pubB64;
beforeAll(async () => {
  await _sodium.ready;
  keys = _sodium.crypto_box_keypair();
  pubB64 = _sodium.to_base64(keys.publicKey, _sodium.base64_variants.ORIGINAL);
});

function fwFetchMock({ sessionIds = ['sess-abc'], loginDelayMs = 0, onInvoke }) {
  let logins = 0;
  const mock = vi.fn(async (url, opts) => {
    const body = JSON.parse(opts.body);
    const name = body.params.name;
    if (name === 'streaming_hub_get_login_public_key') {
      return { ok: true, json: async () => rpcResponse(body.id, { public_key_b64: pubB64, kid: 'kid-1', alg: 'sealed-box-x25519' }) };
    }
    if (name === 'streaming_hub_login_encrypted') {
      const sid = sessionIds[Math.min(logins, sessionIds.length - 1)];
      logins++;
      if (loginDelayMs) await new Promise((r) => setTimeout(r, loginDelayMs));
      return { ok: true, json: async () => rpcResponse(body.id, { ok: true, session_id: sid }) };
    }
    return onInvoke(body);
  });
  mock.loginCount = () => logins;
  return mock;
}

function invokeBodies(fetchMock) {
  return fetchMock.mock.calls
    .map(([, o]) => JSON.parse(o.body))
    .filter((b) => b.params.name === 'invoke_tool');
}

function makeClient(fetchMock) {
  return createFwClient({
    url: 'https://fw.example/',
    username: 'u', password: 'p', environment: 'staging',
    fetchImpl: fetchMock,
  });
}

describe('fw client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('logs in on first call and caches session_id', async () => {
    const fetchMock = fwFetchMock({
      onInvoke: (body) => ({ ok: true, json: async () => rpcResponse(body.id, { brand_id: 1 }) }),
    });
    const fw = makeClient(fetchMock);

    const result = await fw.invoke('sh_1_1_show-a-brand', { advertiser_id: 1, brand_id: 1 });

    expect(result).toEqual({ brand_id: 1 });
    // pubkey + encrypted login + invoke
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.loginCount()).toBe(1);
    const [invokeBody] = invokeBodies(fetchMock);
    expect(invokeBody.params.arguments.session_id).toBe('sess-abc');
    expect(invokeBody.params.arguments.parameters).toEqual({ advertiser_id: 1, brand_id: 1 });

    // Second invoke reuses the cached session — no additional login.
    await fw.invoke('sh_1_1_show-a-brand', { advertiser_id: 1, brand_id: 2 });
    expect(fetchMock.loginCount()).toBe(1);
  });

  it('re-logs in once on auth error then retries', async () => {
    let invokes = 0;
    const fetchMock = fwFetchMock({
      sessionIds: ['sess-1', 'sess-2'],
      onInvoke: (body) => {
        invokes++;
        return invokes === 1
          ? { ok: true, json: async () => rpcError(body.id, 'unauthorized: session expired') }
          : { ok: true, json: async () => rpcResponse(body.id, { brand_id: 1 }) };
      },
    });
    const fw = makeClient(fetchMock);

    const result = await fw.invoke('sh_1_1_show-a-brand', { advertiser_id: 1, brand_id: 1 });
    expect(result).toEqual({ brand_id: 1 });
    expect(fetchMock.loginCount()).toBe(2);
    const retry = invokeBodies(fetchMock).at(-1);
    expect(retry.params.arguments.session_id).toBe('sess-2');
  });

  it('surfaces non-auth errors without retrying', async () => {
    const fetchMock = fwFetchMock({
      onInvoke: (body) => ({ ok: true, json: async () => rpcError(body.id, 'industry 5252 not assignable', -32602) }),
    });
    const fw = makeClient(fetchMock);

    await expect(fw.invoke('sh_1_1_update-a-brand', { advertiser_id: 1, brand_id: 1, body: '<x/>' }))
      .rejects.toThrow(/industry 5252 not assignable/);
    expect(invokeBodies(fetchMock)).toHaveLength(1);
    expect(fetchMock.loginCount()).toBe(1);
  });

  it('re-logs in on HTTP 401 and retries', async () => {
    let invokes = 0;
    const fetchMock = fwFetchMock({
      sessionIds: ['sess-1', 'sess-2'],
      onInvoke: (body) => {
        invokes++;
        return invokes === 1
          ? { ok: false, status: 401, json: async () => ({}) }
          : { ok: true, json: async () => rpcResponse(body.id, { brand_id: 1 }) };
      },
    });
    const fw = makeClient(fetchMock);

    const result = await fw.invoke('sh_1_1_show-a-brand', { advertiser_id: 1, brand_id: 1 });
    expect(result).toEqual({ brand_id: 1 });
    // Confirm the retry used the NEW session id from re-login:
    const retry = invokeBodies(fetchMock).at(-1);
    expect(retry.params.arguments.session_id).toBe('sess-2');
  });

  it('rejects when the tool result has isError: true, using content text as the message', async () => {
    const fetchMock = fwFetchMock({
      onInvoke: (body) => ({ ok: true, json: async () => rpcTextResponse(body.id, 'Tool execution failed: industry 5252 not assignable', true) }),
    });
    const fw = makeClient(fetchMock);

    await expect(fw.invoke('sh_1_1_update-a-brand', { advertiser_id: 1, brand_id: 1, body: '<x/>' }))
      .rejects.toThrow(/industry 5252 not assignable/);
    expect(invokeBodies(fetchMock)).toHaveLength(1);
  });

  it('rejects with a generic message when isError: true has no content text', async () => {
    const fetchMock = fwFetchMock({
      onInvoke: (body) => ({ ok: true, json: async () => ({ jsonrpc: '2.0', id: body.id, result: { content: [], isError: true } }) }),
    });
    const fw = makeClient(fetchMock);

    await expect(fw.invoke('sh_1_1_update-a-brand', { advertiser_id: 1, brand_id: 1, body: '<x/>' }))
      .rejects.toThrow(/FW MCP tool error/);
  });

  it('re-logs in and retries when isError: true carries a session-expired message', async () => {
    let invokes = 0;
    const fetchMock = fwFetchMock({
      sessionIds: ['sess-1', 'sess-2'],
      onInvoke: (body) => {
        invokes++;
        return invokes === 1
          ? { ok: true, json: async () => rpcTextResponse(body.id, 'Unauthorized: session expired, please login again', true) }
          : { ok: true, json: async () => rpcResponse(body.id, { brand_id: 1 }) };
      },
    });
    const fw = makeClient(fetchMock);

    const result = await fw.invoke('sh_1_1_show-a-brand', { advertiser_id: 1, brand_id: 1 });
    expect(result).toEqual({ brand_id: 1 });
    expect(fetchMock.loginCount()).toBe(2);
    const retry = invokeBodies(fetchMock).at(-1);
    expect(retry.params.arguments.session_id).toBe('sess-2');
  });

  it('preserves numeric-looking XML text values as strings through a parse+build round trip', async () => {
    const brandXml = '<brand><id>67890</id><name>Geico (Brand)</name><zip>07030</zip><industry><industry_id>5249</industry_id></industry></brand>';
    const fetchMock = fwFetchMock({
      onInvoke: (body) => ({ ok: true, json: async () => rpcTextResponse(body.id, brandXml) }),
    });
    const fw = makeClient(fetchMock);

    const result = await fw.invoke('sh_1_1_show-a-brand', { advertiser_id: 1, brand_id: 67890 });
    expect(result.brand.zip).toBe('07030');
    expect(result.brand.id).toBe('67890');

    const outXml = mutateBrandIndustry(result, 5251);
    expect(outXml).toMatch(/<zip>07030<\/zip>/);
  });

  it('shares a single in-flight login across concurrent invokes', async () => {
    const fetchMock = fwFetchMock({
      sessionIds: ['sess-x'],
      loginDelayMs: 20,
      onInvoke: (body) => ({ ok: true, json: async () => rpcResponse(body.id, { echo: body.params.arguments.tool_name }) }),
    });
    const fw = makeClient(fetchMock);

    const [a, b] = await Promise.all([
      fw.invoke('tool-a', {}),
      fw.invoke('tool-b', {}),
    ]);
    expect(a).toEqual({ echo: 'tool-a' });
    expect(b).toEqual({ echo: 'tool-b' });
    expect(fetchMock.loginCount()).toBe(1);
    // 1 pubkey + 1 login + 2 invokes
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});

describe('fw client encrypted login (shmcp sealed-box flow)', () => {
  it('logs in via sealed-box encrypted credentials and never sends the password in plaintext', async () => {
    await _sodium.ready;
    const sodium = _sodium;
    const localKeys = sodium.crypto_box_keypair();
    const localPubB64 = sodium.to_base64(localKeys.publicKey, sodium.base64_variants.ORIGINAL);

    const fetchMock = vi.fn(async (url, opts) => {
      const body = JSON.parse(opts.body);
      const name = body.params.name;
      if (name === 'streaming_hub_get_login_public_key') {
        return { ok: true, json: async () => rpcResponse(body.id, { public_key_b64: localPubB64, kid: 'kid-1', alg: 'sealed-box-x25519' }) };
      }
      if (name === 'streaming_hub_login_encrypted') {
        return { ok: true, json: async () => rpcResponse(body.id, { ok: true, session_id: 'sess-enc' }) };
      }
      return { ok: true, json: async () => rpcResponse(body.id, { brand_id: 1 }) };
    });

    const fw = createFwClient({
      url: 'https://fw.example/',
      username: 'u', password: 'p-secret', environment: 'staging',
      fetchImpl: fetchMock,
    });

    const result = await fw.invoke('sh_1_1_show-a-brand', { advertiser_id: 1, brand_id: 1 });
    expect(result).toEqual({ brand_id: 1 });

    // The plaintext password must never appear in any request body.
    for (const [, opts] of fetchMock.mock.calls) {
      expect(opts.body).not.toContain('p-secret');
    }

    // The ciphertext opens (with the test keypair) to the credentials payload.
    const bodies = fetchMock.mock.calls.map(([, o]) => JSON.parse(o.body));
    const loginBody = bodies.find((b) => b.params.name === 'streaming_hub_login_encrypted');
    expect(loginBody).toBeTruthy();
    const sealed = sodium.from_base64(loginBody.params.arguments.ciphertext, sodium.base64_variants.ORIGINAL);
    const opened = JSON.parse(sodium.to_string(sodium.crypto_box_seal_open(sealed, localKeys.publicKey, localKeys.privateKey)));
    expect(opened).toMatchObject({ kid: 'kid-1', username: 'u', password: 'p-secret', environment: 'staging' });

    // The subsequent invoke used the session id returned by the encrypted login.
    const invokeBody = bodies.find((b) => b.params.name === 'invoke_tool');
    expect(invokeBody.params.arguments.session_id).toBe('sess-enc');
  });
});

describe('fw client fetch timeout', () => {
  afterEach(() => {
    delete process.env.FW_TIMEOUT_MS;
  });

  it('aborts a hung fetch after FW_TIMEOUT_MS', async () => {
    process.env.FW_TIMEOUT_MS = '50';
    const fetchMock = vi.fn((url, opts) => new Promise((resolvePromise, reject) => {
      if (opts.signal) {
        if (opts.signal.aborted) return reject(opts.signal.reason);
        opts.signal.addEventListener('abort', () => reject(opts.signal.reason));
      }
      // otherwise: hang forever, like a stalled upstream
    }));

    const fw = createFwClient({
      url: 'https://fw.example/',
      username: 'u', password: 'p', environment: 'staging',
      fetchImpl: fetchMock,
    });

    await expect(fw.invoke('sh_1_1_show-a-brand', { advertiser_id: 1, brand_id: 1 }))
      .rejects.toThrow(/timeout|abort/i);
  }, 2000);
});
