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
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
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
    sessionId = result?.session_id || result?.sessionId;
    if (!sessionId) throw new Error('FW login returned no session_id');
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
