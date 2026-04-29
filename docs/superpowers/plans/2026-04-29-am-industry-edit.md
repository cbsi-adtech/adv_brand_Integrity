# AM Brand Industry Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an in-cell industry picker to the Brand Industry Issues tab, stage multiple changes, and apply them to FreeWheel via a local Node BFF that calls the FW Streaming Hub MCP.

**Architecture:** The Vite SPA gains editable AM Industry cells, a pending-changes bar, and a Review & Apply flow. A new Express BFF on `:8787` (proxied via `/api` from Vite on `:5173`) holds FW credentials, mediates calls to the FW MCP server, and writes a JSON Lines audit log.

**Tech Stack:** React 18 + Vite + Tailwind (existing), Express + fast-xml-parser + undici/fetch (new BFF), Vitest + Supertest (new test runner). No frontend test framework added — manual UI verification per the spec's acceptance criteria.

**Spec:** [docs/superpowers/specs/2026-04-29-am-industry-edit-design.md](../specs/2026-04-29-am-industry-edit-design.md)

---

## File structure

| File | Purpose | Status |
|---|---|---|
| `server/index.js` | Express app entry, port 8787, mounts routes | Create |
| `server/fw.js` | FW MCP JSON-RPC client (login, invoke_tool, session refresh) | Create |
| `server/routes.js` | Express handlers: `/api/health`, `/api/industries`, `/api/changes/apply` | Create |
| `server/industries.js` | Industry taxonomy + group-ID list (moved from `Dashboard.jsx`) | Create |
| `server/mutate-brand-xml.js` | Pure function that swaps the industry field in a V3 brand XML body | Create |
| `server/audit.js` | Append-only JSON Lines logger to `server/audit.log` | Create |
| `server/scripts/discover-brand.js` | One-shot CLI: log in, GET one brand, print XML — used to confirm field shape | Create |
| `server/__tests__/fw.test.js` | Vitest: login + retry on 401 | Create |
| `server/__tests__/mutate-brand-xml.test.js` | Vitest: mutation works against both anticipated XML shapes | Create |
| `server/__tests__/routes.test.js` | Vitest + Supertest: `/api/changes/apply` happy path + per-row failure | Create |
| `.env.example` | Template for FW creds + MCP URL | Create |
| `.gitignore` | Add `.env`, `server/audit.log` | Modify |
| `vite.config.js` | Add `/api` proxy to `:8787` | Modify |
| `package.json` | Add deps + scripts (`dev:server`, combined `dev`, `test`) | Modify |
| `vitest.config.js` | Vitest config — server/ only, node env | Create |
| `src/Dashboard.jsx` | Add `EnvBadge`, `IndustryEditCell`, `PendingBar`, `ReviewModal`, `ResultsModal`; fetch taxonomy from `/api/industries`; CSV validates v3 columns | Modify |
| `DATA_SCHEMA.md` | Document `v3_advertiser_id` / `v3_brand_id` columns + updated power query | Modify |

---

## Task 1: Plumbing — deps, env template, gitignore, vite proxy

**Files:**
- Modify: `package.json`
- Create: `.env.example`
- Modify: `.gitignore`
- Modify: `vite.config.js`
- Create: `vitest.config.js`

- [ ] **Step 1: Install runtime + test deps**

```bash
npm install --save express fast-xml-parser undici
npm install --save-dev concurrently vitest supertest
```

- [ ] **Step 2: Update `package.json` scripts**

Replace the `scripts` block with:

```json
"scripts": {
  "dev:client": "vite",
  "dev:server": "node --watch server/index.js",
  "dev": "concurrently -n client,server -c green,cyan \"npm:dev:client\" \"npm:dev:server\"",
  "build": "vite build",
  "preview": "vite preview",
  "lint": "eslint . --report-unused-disable-directives",
  "test": "vitest run"
}
```

- [ ] **Step 3: Create `.env.example`**

```
# FreeWheel Streaming Hub MCP
FW_MCP_URL=https://streaming-hub-mcp.example.com/
FW_USERNAME=your.username@paramount.com
FW_PASSWORD=
FW_ENVIRONMENT=staging

# BFF
BFF_PORT=8787
```

- [ ] **Step 4: Update `.gitignore`** — append:

```
# BFF
.env
server/audit.log
```

- [ ] **Step 5: Add `/api` proxy to `vite.config.js`**

Replace the file with:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: false,
      },
    },
  },
});
```

- [ ] **Step 6: Create `vitest.config.js`**

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/**/*.test.js'],
    globals: false,
  },
});
```

- [ ] **Step 7: Verify install + scripts**

Run: `npm run test`
Expected: `No test files found, exiting with code 0` (or similar — vitest exits cleanly with no tests).

Run: `npm run build`
Expected: Build succeeds (the SPA-only build still works because `server/` is not imported by Vite).

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json .env.example .gitignore vite.config.js vitest.config.js
git commit -m "Plumbing for BFF: deps, env template, vite /api proxy, vitest"
```

---

## Task 2: BFF skeleton with stub /api/health

**Files:**
- Create: `server/index.js`
- Create: `server/routes.js`

- [ ] **Step 1: Create `server/routes.js`** with a stub health endpoint

```js
import { Router } from 'express';

export function createRouter() {
  const router = Router();

  router.get('/health', (req, res) => {
    res.json({
      environment: process.env.FW_ENVIRONMENT || 'unknown',
      loggedIn: false,
      sessionExpiresAt: null,
      error: 'not yet implemented',
    });
  });

  return router;
}
```

- [ ] **Step 2: Create `server/index.js`**

```js
import 'dotenv/config';
import express from 'express';
import { createRouter } from './routes.js';

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use('/api', createRouter());

const port = Number(process.env.BFF_PORT) || 8787;
app.listen(port, () => {
  console.log(`BFF listening on http://localhost:${port}`);
  console.log(`FW environment: ${process.env.FW_ENVIRONMENT || '(unset)'}`);
});
```

- [ ] **Step 3: Add `dotenv` to deps**

```bash
npm install --save dotenv
```

- [ ] **Step 4: Smoke-test the BFF**

Run: `npm run dev:server`
In another terminal: `curl http://localhost:8787/api/health`
Expected:
```json
{"environment":"staging","loggedIn":false,"sessionExpiresAt":null,"error":"not yet implemented"}
```

Stop the server (Ctrl-C).

- [ ] **Step 5: Commit**

```bash
git add server/ package.json package-lock.json
git commit -m "BFF skeleton: Express app on :8787 with stub /api/health"
```

---

## Task 3: FW MCP client (`server/fw.js`) with login + invoke_tool + retry

**Files:**
- Create: `server/fw.js`
- Create: `server/__tests__/fw.test.js`

- [ ] **Step 1: Write the failing test** at `server/__tests__/fw.test.js`

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- fw.test.js`
Expected: FAIL — `Cannot find module '../fw.js'`.

- [ ] **Step 3: Implement `server/fw.js`**

```js
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
  if (!res.ok) throw new Error(`FW MCP HTTP ${res.status}`);
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
          parameters: { ...parameters, session_id: sessionId },
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- fw.test.js`
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add server/fw.js server/__tests__/fw.test.js
git commit -m "BFF: FW MCP JSON-RPC client with login + auth retry"
```

---

## Task 4: Wire `/api/health` to real FW login

**Files:**
- Modify: `server/index.js`
- Modify: `server/routes.js`

- [ ] **Step 1: Update `server/index.js` to construct the FW client and pass it into routes**

```js
import 'dotenv/config';
import express from 'express';
import { createFwClient } from './fw.js';
import { createRouter } from './routes.js';

const fw = createFwClient({
  url: process.env.FW_MCP_URL,
  username: process.env.FW_USERNAME,
  password: process.env.FW_PASSWORD,
  environment: process.env.FW_ENVIRONMENT || 'staging',
});

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use('/api', createRouter({ fw, environment: process.env.FW_ENVIRONMENT || 'staging' }));

const port = Number(process.env.BFF_PORT) || 8787;
app.listen(port, () => {
  console.log(`BFF listening on http://localhost:${port}`);
  console.log(`FW environment: ${process.env.FW_ENVIRONMENT || '(unset)'}`);
});

(async () => {
  try {
    await fw.login();
    console.log('FW login OK');
  } catch (err) {
    console.error('FW login FAILED on startup:', err.message);
  }
})();
```

- [ ] **Step 2: Update `server/routes.js` to expose login state**

```js
import { Router } from 'express';

export function createRouter({ fw, environment }) {
  const router = Router();

  router.get('/health', (req, res) => {
    res.json({
      environment,
      loggedIn: Boolean(fw.sessionId),
      sessionEstablishedAt: fw.sessionEstablishedAt,
    });
  });

  return router;
}
```

- [ ] **Step 3: Smoke-test against staging**

Populate `.env` with real staging creds. Run: `npm run dev:server`
In another terminal: `curl http://localhost:8787/api/health`
Expected: `{"environment":"staging","loggedIn":true,"sessionEstablishedAt":"2026-..."}`

If `loggedIn: false`, check the BFF console for the login error and resolve before continuing.

Stop the server.

- [ ] **Step 4: Commit**

```bash
git add server/index.js server/routes.js
git commit -m "BFF: /api/health reflects real FW login state"
```

---

## Task 5: Move taxonomy server-side, expose `/api/industries`

**Files:**
- Create: `server/industries.js`
- Modify: `server/routes.js`
- Modify: `src/Dashboard.jsx`

- [ ] **Step 1: Find the taxonomy in `Dashboard.jsx`**

Run: `grep -n 'TAXONOMY\\|GROUP_IDS\\|industryName\\|classifyId' src/Dashboard.jsx | head -30`

Identify the constants holding the industry list and the group-ID set. (These are referenced near `function classifyId(id)` and `function industryName(id)` at the top of the file, and in `IndustryBrowser` around line 941.)

- [ ] **Step 2: Create `server/industries.js`**

Move the raw industry list and group-ID set out of `Dashboard.jsx` into this module. The file should export:

```js
// server/industries.js
// Source-of-truth for the FW Streaming Hub industry taxonomy.
// Moved from Dashboard.jsx so the BFF and SPA share one definition.

// EACH ENTRY: { id, name, depth, parentId }
// depth: 0 = root, 1 = child, 2 = grandchild
// parentId: null for depth 0, otherwise the id of the depth-(n-1) ancestor
export const INDUSTRIES = [
  // ... copy the array contents from Dashboard.jsx verbatim ...
];

// 50 group IDs — NOT valid for assignment per DATA_SCHEMA.md.
export const GROUP_IDS = new Set([
  428, 396, 397, 435, 415, 421, 432, 399, 400, 401, 393, 430, 431, 409, 411,
  433, 405, 392, 422, 419, 391, 394, 414, 413, 398, 406, 434, 412, 436, 418,
  437, 390, 420, 429, 439, 438, 408, 423, 402, 424, 410, 425, 404, 416, 407,
  403, 417, 426, 427, 395,
]);

const BY_ID = new Map(INDUSTRIES.map((i) => [i.id, i]));

function pathOf(entry) {
  const parts = [entry.name];
  let cur = entry;
  while (cur.parentId != null) {
    cur = BY_ID.get(cur.parentId);
    if (!cur) break;
    parts.unshift(cur.name);
  }
  return parts.join(' › ');
}

export function buildAssignableList() {
  return INDUSTRIES
    .filter((i) => !GROUP_IDS.has(i.id))
    .map((i) => ({ ...i, path: pathOf(i) }));
}

export function getIndustryPayload() {
  return {
    assignable: buildAssignableList(),
    groupIds: [...GROUP_IDS],
  };
}
```

(In the Dashboard.jsx replacement step below we keep small helpers like `industryName(id)` working by deriving them from a map fetched at runtime.)

- [ ] **Step 3: Add the route**

Update `server/routes.js`:

```js
import { Router } from 'express';
import { getIndustryPayload } from './industries.js';

export function createRouter({ fw, environment }) {
  const router = Router();

  router.get('/health', (req, res) => {
    res.json({
      environment,
      loggedIn: Boolean(fw.sessionId),
      sessionEstablishedAt: fw.sessionEstablishedAt,
    });
  });

  router.get('/industries', (req, res) => {
    res.json(getIndustryPayload());
  });

  return router;
}
```

- [ ] **Step 4: Smoke-test the new endpoint**

Run: `npm run dev:server`
In another terminal: `curl -s http://localhost:8787/api/industries | head -c 300`
Expected: JSON with `assignable: [...]` and `groupIds: [...]`.

Stop the server.

- [ ] **Step 5: Update `Dashboard.jsx` to fetch the taxonomy at mount**

Inside the `Dashboard` component (top of the file, just below `useState` declarations), add:

```jsx
const [industries, setIndustries] = useState(null);
useEffect(() => {
  fetch('/api/industries')
    .then((r) => r.json())
    .then(setIndustries)
    .catch(() => setIndustries({ assignable: [], groupIds: [] }));
}, []);
```

(Add `useEffect` to the React import at the top of the file.)

Replace the in-file taxonomy constant references (`TAXONOMY_DETAIL`, `industryName`, etc.) so they read from `industries?.assignable` once it's loaded. For uses in render code, prefer the existing helper pattern but source the list from the fetched payload. If `industries` is null, render the dashboard normally — the picker we add later is the only consumer that needs it.

- [ ] **Step 6: Verify SPA still loads**

Run: `npm run dev` (boots both client and server)
Open `http://localhost:5173`
Expected: Dashboard renders the same as before. Devtools network tab shows `200 /api/industries` on load.

Stop both processes.

- [ ] **Step 7: Commit**

```bash
git add server/industries.js server/routes.js src/Dashboard.jsx
git commit -m "Taxonomy moved to BFF; SPA fetches /api/industries"
```

---

## Task 6: V3 brand XML mutation (`mutate-brand-xml.js`) with tests

**Files:**
- Create: `server/mutate-brand-xml.js`
- Create: `server/__tests__/mutate-brand-xml.test.js`

The exact XML field for industry on a V3 brand is unknown until the discovery script (Task 7) confirms it. We implement the mutation against **both anticipated shapes** — scalar `<industry_id>` and list `<industries><industry id="..."/></industries>` — so whichever FW returns, the function works.

- [ ] **Step 1: Write the failing test** at `server/__tests__/mutate-brand-xml.test.js`

```js
import { describe, it, expect } from 'vitest';
import { mutateBrandIndustry } from '../mutate-brand-xml.js';

describe('mutateBrandIndustry', () => {
  it('replaces a scalar <industry_id> element', () => {
    const before = `<?xml version="1.0"?>
<brand>
  <id>67890</id>
  <name>Geico</name>
  <industry_id>5249</industry_id>
</brand>`;

    const after = mutateBrandIndustry(before, 5251);
    expect(after).toMatch(/<industry_id>\s*5251\s*<\/industry_id>/);
    expect(after).not.toMatch(/5249/);
    expect(after).toMatch(/<name>Geico<\/name>/);
  });

  it('replaces the entry inside an <industries> list', () => {
    const before = `<?xml version="1.0"?>
<brand>
  <id>67890</id>
  <industries>
    <industry id="5249"/>
  </industries>
</brand>`;

    const after = mutateBrandIndustry(before, 5251);
    expect(after).toMatch(/id="5251"/);
    expect(after).not.toMatch(/5249/);
  });

  it('throws when no industry field is present', () => {
    const before = `<?xml version="1.0"?><brand><id>1</id></brand>`;
    expect(() => mutateBrandIndustry(before, 5251)).toThrow(/no industry field/i);
  });

  it('throws when given a non-numeric new id', () => {
    const before = `<?xml version="1.0"?><brand><industry_id>1</industry_id></brand>`;
    expect(() => mutateBrandIndustry(before, 'abc')).toThrow(/numeric/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- mutate-brand-xml.test.js`
Expected: FAIL — `Cannot find module '../mutate-brand-xml.js'`.

- [ ] **Step 3: Implement `server/mutate-brand-xml.js`**

```js
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

const PARSER_OPTS = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  preserveOrder: false,
  trimValues: false,
};

const BUILDER_OPTS = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  format: false,
  suppressEmptyNode: false,
};

function findAndMutate(node, newId, ctx) {
  if (node == null || typeof node !== 'object') return false;

  if ('industry_id' in node) {
    node.industry_id = String(newId);
    ctx.found = true;
    return true;
  }

  if ('industries' in node && node.industries && typeof node.industries === 'object') {
    const inner = node.industries.industry;
    if (Array.isArray(inner) && inner.length > 0) {
      inner[0]['@_id'] = String(newId);
      ctx.found = true;
      return true;
    }
    if (inner && typeof inner === 'object') {
      inner['@_id'] = String(newId);
      ctx.found = true;
      return true;
    }
  }

  for (const key of Object.keys(node)) {
    const v = node[key];
    if (Array.isArray(v)) {
      for (const item of v) findAndMutate(item, newId, ctx);
    } else if (v && typeof v === 'object') {
      findAndMutate(v, newId, ctx);
    }
    if (ctx.found) return true;
  }
  return false;
}

export function mutateBrandIndustry(xmlString, newIndustryId) {
  if (typeof newIndustryId !== 'number' && !/^\d+$/.test(String(newIndustryId))) {
    throw new Error('new industry id must be numeric');
  }
  const parser = new XMLParser(PARSER_OPTS);
  const tree = parser.parse(xmlString);

  const ctx = { found: false };
  findAndMutate(tree, newIndustryId, ctx);

  if (!ctx.found) {
    throw new Error('no industry field found in brand XML');
  }

  const builder = new XMLBuilder(BUILDER_OPTS);
  const body = builder.build(tree);
  return body.startsWith('<?xml') ? body : `<?xml version="1.0"?>\n${body}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- mutate-brand-xml.test.js`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add server/mutate-brand-xml.js server/__tests__/mutate-brand-xml.test.js
git commit -m "BFF: V3 brand XML industry mutation, both anticipated shapes"
```

---

## Task 7: Discovery script — confirm V3 brand XML shape

**Files:**
- Create: `server/scripts/discover-brand.js`

This is a one-shot operator script. It logs in, fetches one V3 brand, and prints the raw XML so the operator can confirm which mutation branch (scalar vs list) FW actually uses. It's not part of any automated flow — runs on demand.

- [ ] **Step 1: Create `server/scripts/discover-brand.js`**

```js
import 'dotenv/config';
import { createFwClient } from '../fw.js';

async function main() {
  const [advertiserId, brandId] = process.argv.slice(2);
  if (!advertiserId || !brandId) {
    console.error('Usage: node server/scripts/discover-brand.js <advertiser_id> <brand_id>');
    process.exit(2);
  }

  const fw = createFwClient({
    url: process.env.FW_MCP_URL,
    username: process.env.FW_USERNAME,
    password: process.env.FW_PASSWORD,
    environment: process.env.FW_ENVIRONMENT || 'staging',
  });

  console.log(`Logging in to ${process.env.FW_ENVIRONMENT || 'staging'}...`);
  await fw.login();
  console.log('Login OK; fetching brand...');

  const result = await fw.invoke('sh_1_1_show-a-brand', {
    advertiser_id: Number(advertiserId),
    brand_id: Number(brandId),
  });

  console.log('---RAW BRAND BODY---');
  if (typeof result === 'string') {
    console.log(result);
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
  console.log('---END---');
  console.log('\nLook for the industry field. Expected one of:');
  console.log('  <industry_id>NNN</industry_id>            (scalar)');
  console.log('  <industries><industry id="NNN"/></industries>  (list)');
  console.log('If neither, update server/mutate-brand-xml.js findAndMutate to handle the new shape.');
}

main().catch((err) => {
  console.error('FAIL:', err.message);
  process.exit(1);
});
```

- [ ] **Step 2: Run the discovery script (operator step)**

Pick a known staging brand (any brand; just need to see its XML). With `.env` populated:

```bash
node server/scripts/discover-brand.js <advertiser_id> <brand_id>
```

Inspect the output. Confirm the industry field uses one of the two anticipated shapes. If a third shape appears, update `server/mutate-brand-xml.js`'s `findAndMutate` and add a corresponding test before continuing.

- [ ] **Step 3: Commit**

```bash
git add server/scripts/discover-brand.js
git commit -m "BFF: discovery script to confirm V3 brand XML shape"
```

---

## Task 8: `/api/changes/apply` endpoint with audit log

**Files:**
- Create: `server/audit.js`
- Modify: `server/routes.js`
- Create: `server/__tests__/routes.test.js`

- [ ] **Step 1: Create `server/audit.js`**

```js
import { appendFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUDIT_PATH = resolve(__dirname, 'audit.log');

export async function appendAudit(entry) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n';
  await appendFile(AUDIT_PATH, line, 'utf8');
}
```

- [ ] **Step 2: Write the failing test** at `server/__tests__/routes.test.js`

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createRouter } from '../routes.js';

const SCALAR_BRAND_XML = `<?xml version="1.0"?>
<brand><id>67890</id><name>Geico</name><industry_id>5249</industry_id></brand>`;

function makeFakeFw({ updateImpl } = {}) {
  return {
    sessionId: 'sess-1',
    sessionEstablishedAt: '2026-04-29T00:00:00Z',
    invoke: vi.fn().mockImplementation(async (toolName, params) => {
      if (toolName === 'sh_1_1_show-a-brand') return SCALAR_BRAND_XML;
      if (toolName === 'sh_1_1_update-a-brand') {
        if (updateImpl) return updateImpl(params);
        return { ok: true };
      }
      throw new Error(`unexpected tool: ${toolName}`);
    }),
    login: vi.fn(),
  };
}

function buildApp(fw) {
  const app = express();
  app.use(express.json());
  app.use('/api', createRouter({ fw, environment: 'staging' }));
  return app;
}

describe('POST /api/changes/apply', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('applies a single change and returns ok', async () => {
    const fw = makeFakeFw();
    const res = await request(buildApp(fw))
      .post('/api/changes/apply')
      .send({
        changes: [{
          v3_advertiser_id: 12345,
          v3_brand_id: 67890,
          brand_name: 'Geico',
          current_industry_id: 5249,
          new_industry_id: 5251,
        }],
      });

    expect(res.status).toBe(200);
    expect(res.body.environment).toBe('staging');
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0].status).toBe('ok');
    expect(fw.invoke).toHaveBeenCalledWith('sh_1_1_show-a-brand', expect.objectContaining({ advertiser_id: 12345, brand_id: 67890 }));
    const updateCall = fw.invoke.mock.calls.find(([name]) => name === 'sh_1_1_update-a-brand');
    expect(updateCall[1].body).toMatch(/<industry_id>5251<\/industry_id>/);
  });

  it('reports per-row failure but continues with later rows', async () => {
    let count = 0;
    const fw = makeFakeFw({
      updateImpl: (params) => {
        count++;
        if (count === 1) throw new Error('FW: 422 — industry not assignable');
        return { ok: true };
      },
    });

    const res = await request(buildApp(fw))
      .post('/api/changes/apply')
      .send({
        changes: [
          { v3_advertiser_id: 1, v3_brand_id: 1, brand_name: 'A', current_industry_id: 1, new_industry_id: 5251 },
          { v3_advertiser_id: 2, v3_brand_id: 2, brand_name: 'B', current_industry_id: 1, new_industry_id: 5252 },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(2);
    expect(res.body.results[0].status).toBe('error');
    expect(res.body.results[0].error).toMatch(/422/);
    expect(res.body.results[1].status).toBe('ok');
  });

  it('rejects malformed bodies', async () => {
    const res = await request(buildApp(makeFakeFw()))
      .post('/api/changes/apply')
      .send({ changes: 'not-an-array' });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- routes.test.js`
Expected: FAIL — route returns 404 (no `/api/changes/apply` yet).

- [ ] **Step 4: Add the route to `server/routes.js`**

Replace the file with:

```js
import { Router } from 'express';
import { getIndustryPayload, GROUP_IDS } from './industries.js';
import { mutateBrandIndustry } from './mutate-brand-xml.js';
import { appendAudit } from './audit.js';

function isValidChange(c) {
  return c
    && Number.isInteger(c.v3_advertiser_id)
    && Number.isInteger(c.v3_brand_id)
    && Number.isInteger(c.new_industry_id)
    && !GROUP_IDS.has(c.new_industry_id);
}

export function createRouter({ fw, environment }) {
  const router = Router();

  router.get('/health', (req, res) => {
    res.json({
      environment,
      loggedIn: Boolean(fw.sessionId),
      sessionEstablishedAt: fw.sessionEstablishedAt,
    });
  });

  router.get('/industries', (req, res) => {
    res.json(getIndustryPayload());
  });

  router.post('/changes/apply', async (req, res) => {
    const { changes } = req.body || {};
    if (!Array.isArray(changes) || changes.length === 0) {
      return res.status(400).json({ error: 'body.changes must be a non-empty array' });
    }
    if (!changes.every(isValidChange)) {
      return res.status(400).json({ error: 'each change requires integer v3_advertiser_id, v3_brand_id, new_industry_id (non-group)' });
    }

    const results = [];
    for (const change of changes) {
      const base = {
        v3_advertiser_id: change.v3_advertiser_id,
        v3_brand_id: change.v3_brand_id,
        brand_name: change.brand_name,
        current_industry_id: change.current_industry_id,
        new_industry_id: change.new_industry_id,
      };
      try {
        const xml = await fw.invoke('sh_1_1_show-a-brand', {
          advertiser_id: change.v3_advertiser_id,
          brand_id: change.v3_brand_id,
        });
        const xmlString = typeof xml === 'string' ? xml : String(xml);
        const mutated = mutateBrandIndustry(xmlString, change.new_industry_id);
        await fw.invoke('sh_1_1_update-a-brand', {
          advertiser_id: change.v3_advertiser_id,
          brand_id: change.v3_brand_id,
          body: mutated,
        });
        results.push({ ...base, status: 'ok' });
        await appendAudit({
          environment,
          brand_id: change.v3_brand_id,
          advertiser_id: change.v3_advertiser_id,
          brand_name: change.brand_name,
          before: change.current_industry_id,
          after: change.new_industry_id,
          status: 'ok',
        });
      } catch (err) {
        const message = err?.message || String(err);
        results.push({ ...base, status: 'error', error: message });
        await appendAudit({
          environment,
          brand_id: change.v3_brand_id,
          advertiser_id: change.v3_advertiser_id,
          brand_name: change.brand_name,
          before: change.current_industry_id,
          after: change.new_industry_id,
          status: 'error',
          error: message,
        });
      }
    }

    res.json({ environment, results });
  });

  return router;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- routes.test.js`
Expected: 3 tests pass.

- [ ] **Step 6: Run full test suite**

Run: `npm test`
Expected: all tests pass (fw + mutate-brand-xml + routes).

- [ ] **Step 7: Commit**

```bash
git add server/audit.js server/routes.js server/__tests__/routes.test.js
git commit -m "BFF: /api/changes/apply with sequential apply and JSONL audit"
```

---

## Task 9: Frontend — `EnvBadge` component in header

**Files:**
- Modify: `src/Dashboard.jsx`

- [ ] **Step 1: Add `useEffect` import** if not already present at the top of `Dashboard.jsx`:

```jsx
import React, { useState, useEffect, useMemo } from 'react';
```

- [ ] **Step 2: Add `EnvBadge` component** above the `Dashboard` function (near the other helper components like `Kpi`, `TabBtn`):

```jsx
function EnvBadge() {
  const [health, setHealth] = useState({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch('/api/health');
        if (!res.ok) throw new Error('bad status');
        const data = await res.json();
        if (!cancelled) setHealth({ status: data.loggedIn ? 'ok' : 'login_failed', ...data });
      } catch {
        if (!cancelled) setHealth({ status: 'offline' });
      }
    }
    poll();
    const t = setInterval(poll, 30000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  if (health.status === 'loading') {
    return <span className="px-2 py-1 rounded text-[11px] font-semibold tracking-wider uppercase bg-slate-200 text-slate-600">Connecting…</span>;
  }
  if (health.status === 'offline') {
    return <span className="px-2 py-1 rounded text-[11px] font-semibold tracking-wider uppercase bg-slate-300 text-slate-700" title="Start the BFF with `npm run dev`">BFF Offline</span>;
  }
  if (health.status === 'login_failed') {
    return <span className="px-2 py-1 rounded text-[11px] font-semibold tracking-wider uppercase bg-amber-100 text-amber-800">Login Failed</span>;
  }
  const env = (health.environment || '').toLowerCase();
  const isProd = env === 'production';
  const cls = isProd ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700';
  return (
    <span className={`px-2 py-1 rounded text-[11px] font-semibold tracking-wider uppercase ${cls}`}>
      {env || 'unknown'}
    </span>
  );
}
```

- [ ] **Step 3: Render `<EnvBadge />` in the header**

Find the header block in `Dashboard` (around line 295 — `<header className="bg-white border-b border-slate-200">`). Add the badge to the right side of the existing flex row:

```jsx
<div className="flex items-center justify-between">
  <div>
    {/* existing title block */}
  </div>
  <div className="flex items-center gap-3">
    <EnvBadge />
    {/* any existing right-side controls remain after this */}
  </div>
</div>
```

(If there's already a right-side `div`, just add `<EnvBadge />` as its first child.)

- [ ] **Step 4: Verify**

Run: `npm run dev`
Open `http://localhost:5173`
Expected: badge shows green `STAGING` (or red `PRODUCTION`) within ~1s of load.

Stop the BFF only and refresh: badge becomes `BFF OFFLINE` within 30s.
Restart BFF: badge returns to env color.

Stop both processes.

- [ ] **Step 5: Commit**

```bash
git add src/Dashboard.jsx
git commit -m "Frontend: EnvBadge in header polls /api/health"
```

---

## Task 10: Frontend — `IndustryEditCell` (in-cell combobox + pending state)

**Files:**
- Modify: `src/Dashboard.jsx`

- [ ] **Step 1: Add `pending` state on `Dashboard`**

Just below the existing `useState` calls, add:

```jsx
const [pending, setPending] = useState({}); // key = `${v3_advertiser_id}:${v3_brand_id}`, value = { brand_name, current_industry_id, new_industry_id, new_industry_name }
```

Helper just below:

```jsx
function pendingKey(r) {
  return r.v3_advertiser_id != null && r.v3_brand_id != null
    ? `${r.v3_advertiser_id}:${r.v3_brand_id}`
    : null;
}
```

- [ ] **Step 2: Add `IndustryEditCell` component** above `MismatchTable`

```jsx
function IndustryEditCell({ row, industries, pendingEntry, onPick, onRevert }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const canEdit = row.v3_advertiser_id != null && row.v3_brand_id != null && industries?.assignable?.length > 0;

  const display = pendingEntry
    ? { id: pendingEntry.new_industry_id, name: pendingEntry.new_industry_name }
    : { id: row.am_industry_id, name: row.am_industry_nm };

  const filtered = useMemo(() => {
    if (!industries) return [];
    const q = query.trim().toLowerCase();
    const list = industries.assignable;
    if (!q) return list.slice(0, 100);
    return list
      .filter((i) => i.name.toLowerCase().includes(q) || String(i.id).includes(q) || i.path.toLowerCase().includes(q))
      .slice(0, 100);
  }, [industries, query]);

  if (!canEdit) {
    return (
      <span title={industries?.assignable?.length ? 'No V3 brand mapping — re-export with v3_advertiser_id/v3_brand_id' : 'Loading taxonomy…'}>
        <IndustryChip id={display.id} name={display.name} klass={row.am_id_class} highlight={row.status === 'mismatch'} />
      </span>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-left"
      >
        <IndustryChip id={display.id} name={display.name} klass={row.am_id_class} highlight={row.status === 'mismatch'} />
        {pendingEntry && (
          <span className="ml-2 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 align-middle">pending</span>
        )}
      </button>
      {pendingEntry && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRevert(); }}
          className="ml-1 text-slate-400 hover:text-slate-700 text-xs"
          title="Discard this pending change"
        >↺</button>
      )}
      {open && (
        <div className="absolute z-50 mt-1 left-0 w-80 bg-white border border-slate-200 rounded-md shadow-lg">
          <div className="p-2 border-b border-slate-100">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search industries…"
              className="w-full text-sm px-2 py-1 border border-slate-200 rounded outline-none focus:border-blue-400"
              onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
            />
          </div>
          <ul className="max-h-72 overflow-auto">
            {filtered.length === 0 && <li className="px-3 py-2 text-xs text-slate-400">No matches</li>}
            {filtered.map((i) => (
              <li key={i.id}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 flex items-center justify-between gap-2"
                  onClick={() => { onPick(i); setOpen(false); setQuery(''); }}
                >
                  <span className="truncate">{i.path}</span>
                  <span className="text-[10px] text-slate-400 tabular-nums">{i.id} · d{i.depth}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Wire `IndustryEditCell` into `MismatchTable`**

In `Dashboard`, replace the call to `<MismatchTable .../>` with one that passes the new props:

```jsx
<MismatchTable
  rows={activeRows}
  toggleSort={toggleSort}
  SortIcon={SortIcon}
  onIndustryClick={() => setBrowserOpen(true)}
  industries={industries}
  pending={pending}
  onPick={(row, ind) => {
    const key = pendingKey(row);
    if (!key) return;
    setPending((prev) => ({
      ...prev,
      [key]: {
        v3_advertiser_id: row.v3_advertiser_id,
        v3_brand_id: row.v3_brand_id,
        brand_name: row.global_brand_nm,
        current_industry_id: row.am_industry_id,
        new_industry_id: ind.id,
        new_industry_name: ind.name,
      },
    }));
  }}
  onRevert={(row) => {
    const key = pendingKey(row);
    setPending((prev) => {
      const { [key]: _drop, ...rest } = prev;
      return rest;
    });
  }}
/>
```

In `MismatchTable` itself, accept the new props and replace the AM Industry `<td>` with the editable cell. Locate the existing row [src/Dashboard.jsx:537](src/Dashboard.jsx#L537):

```jsx
<td className="px-3 py-3">
  <IndustryEditCell
    row={r}
    industries={industries}
    pendingEntry={pending[`${r.v3_advertiser_id}:${r.v3_brand_id}`]}
    onPick={(ind) => onPick(r, ind)}
    onRevert={() => onRevert(r)}
  />
</td>
```

Update `MismatchTable`'s signature: `function MismatchTable({ rows, toggleSort, SortIcon, onIndustryClick, industries, pending, onPick, onRevert })`.

- [ ] **Step 4: Verify**

Run: `npm run dev`
Open the **Brand Industry Issues** tab. Click an AM Industry chip on a row that has v3 IDs. Confirm:
- Popover opens, search filters as you type, Esc closes.
- Picking an industry sets the chip + a `pending` ribbon and a `↺` button.
- Clicking `↺` reverts.
- Rows without v3 IDs show the chip but no popover.

Stop both processes.

- [ ] **Step 5: Commit**

```bash
git add src/Dashboard.jsx
git commit -m "Frontend: IndustryEditCell with combobox + pending state"
```

---

## Task 11: Frontend — `PendingBar` and `Discard all`

**Files:**
- Modify: `src/Dashboard.jsx`

- [ ] **Step 1: Add `PendingBar` component**

```jsx
function PendingBar({ count, onReview, onDiscardAll }) {
  if (count === 0) return null;
  return (
    <div className="sticky top-0 z-30 bg-amber-50 border-y border-amber-200 px-6 py-2 flex items-center justify-between">
      <div className="text-sm text-amber-900">
        <strong>{count}</strong> pending change{count === 1 ? '' : 's'}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onReview}
          className="text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Review &amp; Apply
        </button>
        <button
          type="button"
          onClick={onDiscardAll}
          className="text-sm px-3 py-1 rounded text-amber-900 hover:bg-amber-100"
        >
          Discard all
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Render the bar at the top of the main content**

In `Dashboard`, just under the `<header>` and above the main `<div className="max-w-[1600px] mx-auto px-6 py-6">`, render:

```jsx
<PendingBar
  count={Object.keys(pending).length}
  onReview={() => setReviewOpen(true)}
  onDiscardAll={() => {
    if (window.confirm(`Discard ${Object.keys(pending).length} pending changes?`)) {
      setPending({});
    }
  }}
/>
```

Add a `useState` next to the others: `const [reviewOpen, setReviewOpen] = useState(false);` (we'll wire it in the next task).

- [ ] **Step 3: Guard CSV reload against pending changes**

Find `CsvPasteSection` consumers (the data drawer's `onLoad` handlers). At the top of those handlers (in `Dashboard`'s `setMismatchRaw` callsite or wherever the CSV `Load` button calls back), add:

```js
if (Object.keys(pending).length > 0) {
  if (!window.confirm(`Discard ${Object.keys(pending).length} pending changes before loading new data?`)) {
    return;
  }
  setPending({});
}
```

(Locate the existing handler that calls `setMismatchRaw(parseCsv(...))` near the data drawer wiring around [src/Dashboard.jsx:1038](src/Dashboard.jsx#L1038) and [src/Dashboard.jsx:222](src/Dashboard.jsx#L222) and prepend the guard.)

- [ ] **Step 4: Verify**

Run: `npm run dev`. Stage two changes. Confirm:
- Bar appears with count `2`.
- `Discard all` prompts for confirmation, clears bar.
- Loading new CSV with pending changes prompts for confirmation.

Stop both processes.

- [ ] **Step 5: Commit**

```bash
git add src/Dashboard.jsx
git commit -m "Frontend: PendingBar + CSV-reload guard"
```

---

## Task 12: Frontend — `ReviewModal` and apply submission

**Files:**
- Modify: `src/Dashboard.jsx`

- [ ] **Step 1: Add `ReviewModal` component**

```jsx
function ReviewModal({ open, onClose, pending, environment, onApply, applying }) {
  if (!open) return null;
  const items = Object.values(pending);
  const isProd = (environment || '').toLowerCase() === 'production';
  const envCls = isProd ? 'text-red-700' : 'text-emerald-700';

  return (
    <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold">Review &amp; Apply</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className={`text-sm font-semibold uppercase tracking-wider ${envCls}`}>
            Environment: {(environment || 'unknown').toUpperCase()}
          </div>
          <ul className="divide-y divide-slate-100 border border-slate-100 rounded">
            {items.map((it) => (
              <li key={`${it.v3_advertiser_id}:${it.v3_brand_id}`} className="px-3 py-2 text-sm flex items-center justify-between gap-3">
                <div className="font-medium text-slate-900 truncate">{it.brand_name}</div>
                <div className="text-slate-500 truncate">
                  <span className="line-through">{it.current_industry_id}</span>
                  <span className="mx-2">→</span>
                  <span className="text-slate-900 font-medium">{it.new_industry_name} <span className="text-slate-400 tabular-nums">{it.new_industry_id}</span></span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <button onClick={onClose} disabled={applying} className="text-sm px-3 py-1.5 rounded text-slate-700 hover:bg-slate-100">Cancel</button>
          <button
            onClick={onApply}
            disabled={applying || items.length === 0}
            className={`text-sm px-3 py-1.5 rounded text-white uppercase tracking-wider font-semibold ${isProd ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'} disabled:opacity-50`}
          >
            {applying ? 'Applying…' : `Apply ${items.length} change${items.length === 1 ? '' : 's'} to ${(environment || '').toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire it into `Dashboard`**

Add state next to the others:

```jsx
const [applying, setApplying] = useState(false);
const [results, setResults] = useState(null);
const [healthEnv, setHealthEnv] = useState(null);
useEffect(() => {
  fetch('/api/health').then((r) => r.json()).then((d) => setHealthEnv(d.environment)).catch(() => {});
}, []);
```

Render the modal near the bottom of the JSX (next to `IndustryBrowser`):

```jsx
<ReviewModal
  open={reviewOpen}
  onClose={() => setReviewOpen(false)}
  pending={pending}
  environment={healthEnv}
  applying={applying}
  onApply={async () => {
    setApplying(true);
    try {
      const res = await fetch('/api/changes/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes: Object.values(pending) }),
      });
      const data = await res.json();
      setResults(data);
      setReviewOpen(false);
    } catch (err) {
      setResults({ environment: healthEnv, results: Object.values(pending).map((p) => ({ ...p, status: 'error', error: err.message })) });
      setReviewOpen(false);
    } finally {
      setApplying(false);
    }
  }}
/>
```

- [ ] **Step 3: Verify**

Run: `npm run dev`. Stage 1-2 changes, click `Review & Apply`. Modal shows the diff with `Environment: STAGING` in green and the button color matched. Hitting Apply fires `/api/changes/apply` (devtools network tab confirms). Don't worry about the success state UI yet — the next task adds it.

Stop both processes.

- [ ] **Step 4: Commit**

```bash
git add src/Dashboard.jsx
git commit -m "Frontend: ReviewModal with diff list and apply submission"
```

---

## Task 13: Frontend — `ResultsModal` and commit successful changes to row state

**Files:**
- Modify: `src/Dashboard.jsx`

- [ ] **Step 1: Add `ResultsModal`**

```jsx
function ResultsModal({ data, onClose }) {
  if (!data) return null;
  const { results = [], environment } = data;
  const ok = results.filter((r) => r.status === 'ok').length;
  const fail = results.length - ok;

  return (
    <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold">Apply results · {(environment || '').toUpperCase()}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="text-sm">
            <span className="text-emerald-700 font-semibold">{ok} succeeded</span>
            {fail > 0 && <> · <span className="text-red-700 font-semibold">{fail} failed</span></>}
          </div>
          <ul className="divide-y divide-slate-100 border border-slate-100 rounded">
            {results.map((r, i) => (
              <li key={i} className="px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={r.status === 'ok' ? 'text-emerald-700' : 'text-red-700'}>
                      {r.status === 'ok' ? '✓' : '✗'}
                    </span>
                    <span className="font-medium text-slate-900">{r.brand_name}</span>
                    <span className="text-slate-400 text-xs tabular-nums">{r.v3_brand_id}</span>
                  </div>
                  <div className="text-slate-500 text-xs tabular-nums">{r.current_industry_id} → {r.new_industry_id}</div>
                </div>
                {r.status === 'error' && (
                  <div className="text-xs text-red-700 mt-1">{r.error}</div>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-end">
          <button onClick={onClose} className="text-sm px-3 py-1.5 rounded bg-slate-900 text-white hover:bg-slate-800">Close</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Render it and hook the success-commit logic**

Replace the existing `setResults` handling in the apply submission (added in Task 12) so it also updates `mismatchRaw` for successful rows and clears those rows from `pending`:

In the modal's `onApply` body (where you previously did `setResults(data); setReviewOpen(false);`), add:

```js
const okKeys = new Set(
  data.results
    .filter((r) => r.status === 'ok')
    .map((r) => `${r.v3_advertiser_id}:${r.v3_brand_id}`)
);
if (okKeys.size > 0) {
  setMismatchRaw((rows) => rows.map((row) => {
    const k = row.v3_advertiser_id != null && row.v3_brand_id != null
      ? `${row.v3_advertiser_id}:${row.v3_brand_id}` : null;
    if (!k || !okKeys.has(k)) return row;
    const change = data.results.find((r) => `${r.v3_advertiser_id}:${r.v3_brand_id}` === k);
    return { ...row, am_industry_id: change.new_industry_id, am_industry_nm: change.new_industry_name || row.am_industry_nm };
  }));
  setPending((prev) => {
    const next = { ...prev };
    for (const k of okKeys) delete next[k];
    return next;
  });
}
```

(`new_industry_name` isn't returned by the BFF — copy it from the original pending entry before clearing. Adjust by capturing `pendingNamesByKey` in a `const` before sending the request.)

Render the modal:

```jsx
<ResultsModal data={results} onClose={() => setResults(null)} />
```

- [ ] **Step 3: Verify against staging**

Run: `npm run dev`. Stage one real change against a known staging brand. Apply. Confirm:
- Results modal shows `1 succeeded`.
- The row in the table now shows the new industry as the AM Industry chip with no pending ribbon.
- `server/audit.log` has a new line with `status: "ok"`.
- A re-paste of the staging CSV (same query) shows the brand's AM industry is the new value — confirming the round-trip.

If a row fails:
- Results modal shows the FW error.
- The row stays in `pending` so the user can retry or revert.

Stop both processes.

- [ ] **Step 4: Commit**

```bash
git add src/Dashboard.jsx
git commit -m "Frontend: ResultsModal + commit successful apply to row state"
```

---

## Task 14: CSV validation — require v3 mapping columns

**Files:**
- Modify: `src/Dashboard.jsx`

- [ ] **Step 1: Find `parseCsv`**

Locate `function parseCsv(text)` near [src/Dashboard.jsx:194](src/Dashboard.jsx#L194). Identify how rows are produced (headers → row objects).

- [ ] **Step 2: Add validation in the mismatch-CSV load handler**

In the handler that calls `setMismatchRaw(parseCsv(mismatchCsv))` (in `DataDrawer` / `Dashboard`), wrap it:

```js
const rows = parseCsv(mismatchCsv);
const missing = rows.filter((r) => r.v3_advertiser_id == null || r.v3_brand_id == null);
if (missing.length > 0 && missing.length === rows.length) {
  window.alert('CSV is missing v3_advertiser_id / v3_brand_id columns. Re-export with the updated power query (see DATA_SCHEMA.md).');
  return;
}
if (missing.length > 0) {
  console.warn(`${missing.length} rows missing v3 mapping; their AM Industry cells will be read-only.`);
}
setMismatchRaw(rows);
```

Coerce IDs to integers in `parseCsv` for these two columns (or in a post-step) so the downstream check `Number.isInteger` is robust:

```js
function coerceInt(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
}
// after parseCsv produces a row:
row.v3_advertiser_id = coerceInt(row.v3_advertiser_id);
row.v3_brand_id = coerceInt(row.v3_brand_id);
```

- [ ] **Step 3: Verify**

Run: `npm run dev`. Paste the existing mock CSV (no v3 columns) — alert fires, no rows load. Paste a CSV with the new columns — rows load and AM Industry cells are editable.

Stop both processes.

- [ ] **Step 4: Commit**

```bash
git add src/Dashboard.jsx
git commit -m "Frontend: validate CSV has v3_advertiser_id and v3_brand_id"
```

---

## Task 15: Update `DATA_SCHEMA.md`

**Files:**
- Modify: `DATA_SCHEMA.md`

- [ ] **Step 1: Document the two new output columns**

Find the **Output columns** table in `DATA_SCHEMA.md` and append two rows:

```
| `v3_advertiser_id` | V3 brand-API path parameter — the sub-granular advertiser entity. From `advertiser_dim` |
| `v3_brand_id` | V3 brand-API path parameter — the sub-granular brand entity. From `brand_dim` |
```

- [ ] **Step 2: Update the working power query** to include the v3 columns

In the `WITH base AS (...)` SELECT block, also project the v3 IDs by joining the sub-granular dims. Example addition (the exact join keys depend on Paramount's mapping; document the assumption alongside the SQL):

```sql
LEFT JOIN `i-digital-adsales-prod.fw_datafeed_dim_vw.advertiser_dim` AS av
  ON av.global_advertiser_id = b.advertiser_id
LEFT JOIN `i-digital-adsales-prod.fw_datafeed_dim_vw.brand_dim`      AS bv
  ON bv.global_brand_id = b.brand_id
-- ...
SELECT
  ...,
  av.advertiser_id     AS v3_advertiser_id,
  bv.brand_id          AS v3_brand_id,
  ...
```

(Add a clear note: "If a row's `v3_advertiser_id` or `v3_brand_id` is NULL, the dashboard will render that row's AM Industry cell as read-only — re-check the dim joins.")

- [ ] **Step 3: Add a new section: "Editing the AM brand entity industry"**

Document the dashboard flow: pick from dropdown → review → apply → audit log lives at `server/audit.log`. One paragraph; the spec is the canonical source.

- [ ] **Step 4: Commit**

```bash
git add DATA_SCHEMA.md
git commit -m "DATA_SCHEMA: document v3 mapping columns and edit-and-push flow"
```

---

## Task 16: End-to-end staging verification

**Files:** none (validation only)

- [ ] **Step 1: Re-run the BigQuery export with the updated query** so the CSV has `v3_advertiser_id` and `v3_brand_id`. Save the CSV.

- [ ] **Step 2: Boot the app**

Run: `npm run dev`
Confirm header badge: green `STAGING`.

- [ ] **Step 3: Load the CSV via the data drawer**

Confirm rows render and AM Industry cells are clickable.

- [ ] **Step 4: Stage three changes**

Pick three different rows; assign each a new industry. Confirm each shows a `pending` ribbon and the bar reads `3 pending changes`.

- [ ] **Step 5: Apply**

Click `Review & Apply`. Verify the diff list and `Environment: STAGING` (green). Click Apply. Verify the results modal shows `3 succeeded · 0 failed`.

- [ ] **Step 6: Verify audit log**

```bash
tail -5 server/audit.log
```

Expected: 3 lines, each with `status: "ok"`, matching the brand IDs you changed.

- [ ] **Step 7: Verify FW round-trip**

Re-paste the same staging CSV (re-run the BigQuery query first). Confirm the three brands' AM industries now reflect the new values.

- [ ] **Step 8: Verify failure handling**

Open devtools, find a pending change, edit the in-memory `new_industry_id` to a known group ID (e.g., 428) via React DevTools. Apply. The BFF should reject with 400 (the route's `isValidChange` filter excludes group IDs) — modal shows the error, the row stays pending, no audit `ok` line.

- [ ] **Step 9: Tag the milestone**

```bash
git tag am-industry-edit-shipped
git log --oneline am-industry-edit-shipped~16..am-industry-edit-shipped
```

Expected: 16 commits matching the tasks above.

---

## Self-review notes

**Spec coverage:**
- Architecture (BFF on :8787, Vite proxy) → Tasks 1, 2.
- Data shape (v3 cols) → Tasks 14, 15.
- BFF endpoints (health, industries, apply) → Tasks 2, 4, 5, 8.
- Auth (`streaming_hub_login`, .env) → Tasks 3, 4.
- Audit log → Task 8.
- Apply algorithm → Tasks 6, 7, 8.
- Frontend (badge, edit cell, pending bar, review, results) → Tasks 9, 10, 11, 12, 13.
- Error handling (BFF offline, login failed, per-row error, fresh CSV with pending) → covered across Tasks 9, 11, 13, 14.
- Acceptance criteria → Task 16.

**Type consistency:**
- `pendingKey(row)` used consistently as `${v3_advertiser_id}:${v3_brand_id}`.
- `change` shape (`v3_advertiser_id`, `v3_brand_id`, `brand_name`, `current_industry_id`, `new_industry_id`) consistent across SPA → BFF → response.
- `IndustryEditCell` props match `MismatchTable`'s prop drilling.

**Open implementation discovery (handled in plan):**
- Task 7 (`discover-brand.js`) confirms the V3 brand XML field shape before going live; mutation in Task 6 already handles both anticipated shapes plus throws on a third unknown shape so the discovery's exit criteria is unambiguous.
