import { XMLParser } from 'fast-xml-parser';
import _sodium from 'libsodium-wrappers';

const XML_PARSER = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: false,
  // Keep element text as strings: "07030" must not become the number 7030,
  // or the XML round trip through mutate-brand-xml corrupts the value.
  parseTagValue: false,
  trimValues: true,
});

const DEFAULT_TIMEOUT_MS = 30000;

function fetchTimeoutMs() {
  const fromEnv = Number(process.env.FW_TIMEOUT_MS);
  return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : DEFAULT_TIMEOUT_MS;
}

let nextRpcId = 1;

function isAuthError(message) {
  if (!message) return false;
  const m = String(message).toLowerCase();
  return m.includes('unauthorized') || m.includes('session expired') || m.includes('not authenticated');
}

// Streaming Hub's streamable-HTTP transport may answer a JSON-RPC POST with
// either application/json or text/event-stream. Pull the last JSON `data:`
// frame out of an SSE body.
function parseSse(text) {
  let last = null;
  for (const line of text.split(/\r?\n/)) {
    if (!line.startsWith('data:')) continue;
    const chunk = line.slice(5).trim();
    if (!chunk) continue;
    try { last = JSON.parse(chunk); } catch { /* ignore non-JSON frames */ }
  }
  return last;
}

// `auth` carries the transport-level bits that differ between the legacy
// (unauthenticated POST to the MCP root) and v3.3 (Bearer token against
// /mcp/oauth) paths. onSession lets the caller record a rotated MCP session id.
async function postRpc(fetchImpl, url, body, auth = {}) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  };
  if (auth.bearerToken) headers.Authorization = `Bearer ${auth.bearerToken}`;
  if (auth.mcpSessionId) headers['Mcp-Session-Id'] = auth.mcpSessionId;

  const res = await fetchImpl(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(fetchTimeoutMs()),
  });

  const rotated = res.headers?.get?.('Mcp-Session-Id');
  if (rotated && auth.onSession) auth.onSession(rotated);

  if (!res.ok) {
    const err = new Error(`FW MCP HTTP ${res.status}`);
    if (res.status === 401 || res.status === 403) err.isAuth = true;
    throw err;
  }

  const ctype = res.headers?.get?.('Content-Type') || '';
  if (ctype.includes('text/event-stream')) {
    const parsed = parseSse(await res.text());
    if (parsed == null) throw new Error('FW MCP returned an empty event-stream response');
    return parsed;
  }
  // Notifications are answered with an empty body (202); there is nothing to
  // parse and nothing for the caller to read.
  if (body.method?.startsWith('notifications/')) return {};
  return res.json();
}

async function postJson(fetchImpl, url, payload) {
  let res;
  try {
    res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(fetchTimeoutMs()),
    });
  } catch (err) {
    throw new Error(`FW auth: could not reach ${url}: ${err?.message || err}`);
  }
  let body = null;
  const raw = await res.text();
  if (raw.trim()) {
    try { body = JSON.parse(raw); } catch { body = { detail: raw.slice(0, 1000) }; }
  }
  return { status: res.status, body };
}

// Current Streaming Hub generations wrap every invoke_tool payload in an
// `{ok, data}` envelope, with failures reported as `{ok: false, error}` rather
// than an MCP isError. Peel it off so callers always see the bare FW entity.
function unwrapEnvelope(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  if (!('ok' in value)) return value;
  if (value.ok === false) {
    const raw = value.error;
    const text = typeof raw === 'string' ? raw : JSON.stringify(raw ?? value);
    const err = new Error(text.slice(0, 500));
    err.isToolError = true;
    if (isAuthError(text)) err.isAuth = true;
    throw err;
  }
  return 'data' in value ? value.data : value;
}

function unwrapToolResult(rpc) {
  if (rpc.error) {
    const err = new Error(rpc.error.message || 'FW MCP error');
    err.rpc = rpc.error;
    throw err;
  }
  // MCP tool-level failure: the RPC succeeded but the tool reports isError.
  // This must surface as a rejection, never as a "successful" text payload.
  if (rpc.result?.isError === true) {
    const errContent = rpc.result?.content;
    const errText = Array.isArray(errContent)
      ? errContent.find((c) => typeof c?.text === 'string' && c.text)?.text
      : undefined;
    const err = new Error(errText || 'FW MCP tool error (isError with no message)');
    err.isToolError = true;
    // Session-expired/unauthorized tool errors are retryable via re-login,
    // same as rpc.error-shaped auth failures.
    if (isAuthError(errText)) err.isAuth = true;
    throw err;
  }
  // MCP allows tools to return BOTH a human-readable `content[0].text` banner
  // (often "Tool executed successfully…") AND a machine-readable
  // `structuredContent` object. Prefer the structured one when present.
  const structured = rpc.result?.structuredContent;
  if (structured && typeof structured === 'object') return unwrapEnvelope(structured);

  const content = rpc.result?.content;
  if (!Array.isArray(content) || content.length === 0) return rpc.result;
  const text = content[0]?.text;
  if (typeof text !== 'string') return rpc.result;
  // 1) JSON
  try { return unwrapEnvelope(JSON.parse(text)); } catch (err) {
    if (err.isToolError) throw err;
    /* not JSON — fall through */
  }
  // 2) XML (FW V3 brand/advertiser endpoints return XML over the MCP wire)
  const trimmed = text.trimStart();
  if (trimmed.startsWith('<')) {
    try { return XML_PARSER.parse(text); } catch { /* fall through */ }
  }
  // 3) plain text (e.g. streaming_hub_login banner)
  return text;
}

export function createFwClient({ url, username, password, environment, fetchImpl = fetch }) {
  if (!url) throw new Error('FW MCP url required');
  const baseUrl = String(url).replace(/\/+$/, '');
  let sessionId = null;          // legacy Streaming Hub session; null under OAuth
  let bearerToken = null;        // machine token (Streaming Hub v3.3+)
  let tokenExpiresAt = null;     // epoch ms; null when unknown
  let mcpUrl = baseUrl;          // JSON-RPC endpoint: root, or /mcp/oauth under Bearer auth
  let mcpSessionId = null;       // MCP transport session (HTTP header)
  let sessionEstablishedAt = null;
  let loginInFlight = null;

  function authCtx() {
    return {
      bearerToken,
      mcpSessionId,
      onSession: (id) => { mcpSessionId = id; },
    };
  }

  function tokenExpired() {
    // Refresh a minute early so a long call can't straddle the expiry.
    return tokenExpiresAt != null && Date.now() >= tokenExpiresAt - 60_000;
  }

  function authenticated() {
    return Boolean((bearerToken && !tokenExpired()) || sessionId);
  }

  // Share one in-flight login: when many invoke() calls need a session at the
  // same moment, only a single login RPC is issued.
  function login() {
    if (!loginInFlight) {
      loginInFlight = doLogin().finally(() => { loginInFlight = null; });
    }
    return loginInFlight;
  }

  function resetAuth() {
    sessionId = null;
    bearerToken = null;
    tokenExpiresAt = null;
    mcpSessionId = null;
    mcpUrl = baseUrl;
  }

  // MCP handshake. Best-effort: some server generations accept tools/call
  // without it, so a failure here must not sink an otherwise valid session.
  async function mcpInitialize() {
    try {
      await postRpc(fetchImpl, mcpUrl, {
        jsonrpc: '2.0',
        id: nextRpcId++,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'adv-brand-integrity', version: '1.0' },
        },
      }, authCtx());
      await postRpc(fetchImpl, mcpUrl, {
        jsonrpc: '2.0',
        method: 'notifications/initialized',
      }, authCtx());
    } catch (err) {
      console.warn('[fw.login] MCP initialize failed (continuing):', err?.message || err);
    }
  }

  async function doLogin() {
    resetAuth();
    // Preferred path (Streaming Hub v3.3+). Falls back to the legacy encrypted
    // login tool when the server predates /register.
    const machine = await machineTokenLogin();
    if (machine) return machine;
    return legacyEncryptedLogin();
  }

  // v3.3+ auth: dynamically register a client, exchange it plus the FW
  // credentials for a machine token, then talk MCP over /mcp/oauth with a
  // Bearer header. Returns null when the server has no /register or
  // /token/machine, signalling the caller to try the legacy flow.
  async function machineTokenLogin() {
    const reg = await postJson(fetchImpl, `${baseUrl}/register`, {});
    if (reg.status === 404) return null;
    const clientId = reg.body?.client_id;
    if (reg.status >= 400 || !clientId) {
      throw new Error(`FW client registration failed (HTTP ${reg.status}): ${JSON.stringify(reg.body).slice(0, 300)}`);
    }

    const tok = await postJson(fetchImpl, `${baseUrl}/token/machine`, {
      client_id: clientId,
      client_secret: reg.body?.client_secret ?? '',
      sh_username: username,
      sh_password: password,
      environment,
    });
    if (tok.status === 404) return null;
    if (tok.status >= 400) {
      const detail = tok.body?.detail ?? tok.body;
      const err = new Error(`FW login failed: ${JSON.stringify(detail).slice(0, 400)}`);
      err.isAuth = true;
      throw err;
    }

    const access = tok.body?.access_token || tok.body?.token || tok.body?.auth_token;
    if (!access) {
      throw new Error(`FW token endpoint returned no access token: ${JSON.stringify(tok.body).slice(0, 300)}`);
    }

    bearerToken = access;
    const expiresIn = Number(tok.body?.expires_in);
    tokenExpiresAt = Number.isFinite(expiresIn) && expiresIn > 0 ? Date.now() + expiresIn * 1000 : null;
    mcpUrl = `${baseUrl}/mcp/oauth`;
    sessionId = null;

    await mcpInitialize();
    sessionEstablishedAt = new Date().toISOString();
    return access;
  }

  // Legacy shmcp login flow: fetch the server's X25519 public key, seal the
  // credentials into a libsodium sealed box, and exchange the ciphertext for
  // a session_id via streaming_hub_login_encrypted.
  async function legacyEncryptedLogin() {
    await _sodium.ready;
    const sodium = _sodium;

    const keyRpc = await postRpc(fetchImpl, mcpUrl, {
      jsonrpc: '2.0',
      id: nextRpcId++,
      method: 'tools/call',
      params: { name: 'streaming_hub_get_login_public_key', arguments: {} },
    }, authCtx());
    const keyResult = unwrapToolResult(keyRpc);
    const publicKeyB64 = keyResult?.public_key_b64 ?? keyResult?.public_key;
    if (!publicKeyB64) throw new Error('FW login: no public key in streaming_hub_get_login_public_key result');

    const publicKey = sodium.from_base64(publicKeyB64, sodium.base64_variants.ORIGINAL);
    const payload = JSON.stringify({
      kid: keyResult.kid ?? keyResult.key_id,
      username,
      password,
      environment,
    });
    const ciphertext = sodium.to_base64(
      sodium.crypto_box_seal(sodium.from_string(payload), publicKey),
      sodium.base64_variants.ORIGINAL,
    );

    const rpc = await postRpc(fetchImpl, mcpUrl, {
      jsonrpc: '2.0',
      id: nextRpcId++,
      method: 'tools/call',
      params: { name: 'streaming_hub_login_encrypted', arguments: { ciphertext } },
    }, authCtx());
    const result = unwrapToolResult(rpc);

    // FW MCP returns a plain-string result like:
    //   "Authenticated successfully. session_id=<uuid>, environment=production, expires_in=<n>s."
    // Pull the session_id out of either shape (object or string).
    if (typeof result === 'string') {
      const m = result.match(/session_id\s*=\s*([0-9a-f-]+)/i);
      if (m) sessionId = m[1];
    } else {
      sessionId = result?.session_id || result?.sessionId;
    }

    if (!sessionId) {
      const safe = typeof result === 'string'
        ? result
        : JSON.stringify(result, (k, v) => /token|password|secret/i.test(k) ? '[redacted]' : v);
      console.error('[fw.login] no session_id in result. Raw result:', safe);
      throw new Error('FW login returned no session_id');
    }
    sessionEstablishedAt = new Date().toISOString();
    return sessionId;
  }

  async function invokeOnce(toolName, parameters) {
    if (!authenticated()) await login();
    // Under Bearer auth the server derives the Streaming Hub session from the
    // token and discards any client-supplied session_id; only send one on the
    // legacy path.
    const args = { tool_name: toolName, parameters };
    if (sessionId) args.session_id = sessionId;

    const body = {
      jsonrpc: '2.0',
      id: nextRpcId++,
      method: 'tools/call',
      params: { name: 'invoke_tool', arguments: args },
    };
    const rpc = await postRpc(fetchImpl, mcpUrl, body, authCtx());
    if (rpc.error && isAuthError(rpc.error.message)) {
      const err = new Error('auth');
      err.isAuth = true;
      throw err;
    }
    return unwrapToolResult(rpc);
  }

  async function invoke(toolName, parameters) {
    try {
      return await invokeOnce(toolName, parameters);
    } catch (err) {
      if (err.isAuth) {
        resetAuth();
        return await invokeOnce(toolName, parameters);
      }
      throw err;
    }
  }

  return {
    invoke,
    login,
    get sessionId() { return sessionId; },
    get bearerToken() { return bearerToken; },
    get authenticated() { return authenticated(); },
    get sessionEstablishedAt() { return sessionEstablishedAt; },
  };
}
