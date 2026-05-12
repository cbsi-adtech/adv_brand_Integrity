import { XMLParser } from 'fast-xml-parser';

const XML_PARSER = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: false,
  trimValues: true,
});

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

  async function login() {
    const body = {
      jsonrpc: '2.0',
      id: nextRpcId++,
      method: 'tools/call',
      params: {
        name: 'streaming_hub_login',
        arguments: { environment, username, password },
      },
    };
    const rpc = await postRpc(fetchImpl, url, body);
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
