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

async function postRpc(fetchImpl, url, body) {
  const res = await fetchImpl(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(fetchTimeoutMs()),
  });
  if (!res.ok) {
    const err = new Error(`FW MCP HTTP ${res.status}`);
    if (res.status === 401) err.isAuth = true;
    throw err;
  }
  return res.json();
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
  if (structured && typeof structured === 'object') return structured;

  const content = rpc.result?.content;
  if (!Array.isArray(content) || content.length === 0) return rpc.result;
  const text = content[0]?.text;
  if (typeof text !== 'string') return rpc.result;
  // 1) JSON
  try { return JSON.parse(text); } catch { /* fall through */ }
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
  let sessionId = null;
  let sessionEstablishedAt = null;
  let loginInFlight = null;

  // Share one in-flight login: when many invoke() calls need a session at the
  // same moment, only a single login RPC is issued.
  function login() {
    if (!loginInFlight) {
      loginInFlight = doLogin().finally(() => { loginInFlight = null; });
    }
    return loginInFlight;
  }

  // shmcp login flow: fetch the server's X25519 public key, seal the
  // credentials into a libsodium sealed box, and exchange the ciphertext for
  // a session_id via streaming_hub_login_encrypted. (The old plaintext
  // streaming_hub_login tool no longer exists on the FW MCP.)
  async function doLogin() {
    await _sodium.ready;
    const sodium = _sodium;

    const keyRpc = await postRpc(fetchImpl, url, {
      jsonrpc: '2.0',
      id: nextRpcId++,
      method: 'tools/call',
      params: { name: 'streaming_hub_get_login_public_key', arguments: {} },
    });
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

    const rpc = await postRpc(fetchImpl, url, {
      jsonrpc: '2.0',
      id: nextRpcId++,
      method: 'tools/call',
      params: { name: 'streaming_hub_login_encrypted', arguments: { ciphertext } },
    });
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
    if (!sessionId) await login();
    const body = {
      jsonrpc: '2.0',
      id: nextRpcId++,
      method: 'tools/call',
      params: {
        name: 'invoke_tool',
        arguments: {
          tool_name: toolName,
          parameters,
          session_id: sessionId,
        },
      },
    };
    const rpc = await postRpc(fetchImpl, url, body);
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
        sessionId = null;
        return await invokeOnce(toolName, parameters);
      }
      throw err;
    }
  }

  return {
    invoke,
    login,
    get sessionId() { return sessionId; },
    get sessionEstablishedAt() { return sessionEstablishedAt; },
  };
}
