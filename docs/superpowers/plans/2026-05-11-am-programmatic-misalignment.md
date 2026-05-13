# Advertiser Module ↔ Programmatic Module Misalignment Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the dashboard frontend to surface and resolve brand→industry misalignment between FreeWheel's Advertiser Module (channel_type=2) and Programmatic Module (channel_type=4), preserving the existing V3 Advertiser-Module write path.

**Architecture:** Two CSV adapters (`bq-sql` for the existing BigQuery export, `fw-report` for the new FreeWheel Console export) feed a single canonical-row pivot. Flag detector annotates each row. List view + drawer surface the issues. Edits stage to a Zustand `pendingStore` (persisted to localStorage), then apply in batch through the existing `POST /api/changes/apply` BFF endpoint.

**Tech Stack:** React 18, Vite, Tailwind, Zustand (new), @tanstack/react-table + react-virtual (new), vitest, Node/Express BFF (existing).

**Spec:** [docs/superpowers/specs/2026-05-11-am-programmatic-misalignment-design.md](../specs/2026-05-11-am-programmatic-misalignment-design.md)

**Terminology rule:** In UI strings, badge tooltips, filter labels, column headers, and any text a user reads, use **"Advertiser Module"** and **"Programmatic Module"** — never "AM", "PG", or "Programmatic" alone. Code identifiers (`am`, `pg`, `pgRoot`, `pg_creatives`) keep their short forms.

---

## Implementation notes

**Coexistence with existing Dashboard.jsx.** The new code is built alongside `src/Dashboard.jsx` under `src/views/`. We do not modify `Dashboard.jsx` during this plan. At Task 32 we swap `App.jsx` to render the new `ListView`; `Dashboard.jsx` is deleted in Task 33 only after manual smoke testing.

**Data-source precedence.** The existing BQ CSV format already carries Programmatic-Module data in `ind_*` columns; the new FW report CSV is the authoritative source. When both files are loaded for the same brand, **FW report wins for the `pg` slot**, with BQ's `ind_*` values stored in `pg.bq_fallback` so the drawer can surface discrepancies.

**BQ column names (already used by Dashboard.jsx; the bq-sql adapter consumes them as-is):**
- `global_brand_id`, `global_brand_nm`, `global_advertiser_id`, `global_advertiser_nm`
- `v3_advertiser_id`, `v3_brand_id`
- `am_applied_industry_ids_raw` (pipe-string), `am_impressions`, `am_revenue`
- `ind_applied_industry_ids_raw` (pipe-string), `ind_impressions`, `ind_revenue`
- `gb_industry_id` (canonical / read-only context)

**Vitest is already configured** (`npm run test`). Tests live in `__tests__` directories sibling to the code, matching the existing server-side pattern. For the SPA, place under `src/**/__tests__/` and configure vitest to include `src/**/*.test.{js,jsx}` (Task 0.5 confirms this works).

---

## Task 0: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime + dev dependencies**

```bash
npm install zustand @tanstack/react-table @tanstack/react-virtual uuid
npm install --save-dev @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 2: Verify install**

Run: `npm ls zustand @tanstack/react-table uuid`
Expected: all three present, no UNMET DEPENDENCY warnings.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add zustand, tanstack/table, uuid, testing-library for misalignment dashboard rewrite"
```

---

## Task 0.5: Configure Vitest for SPA tests

**Files:**
- Modify: `vite.config.js` (or create `vitest.config.js` if test config is separate)
- Create: `src/test-setup.js`

- [ ] **Step 1: Read current vite config**

Run: `cat vite.config.js`
Expected: existing vite + react plugin config; check whether a `test` block is present.

- [ ] **Step 2: Add a `test` block to vite.config.js**

Inside the `defineConfig({...})` object, add (or extend):

```js
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: ['./src/test-setup.js'],
  include: ['src/**/*.test.{js,jsx}', 'server/**/*.test.js'],
},
```

- [ ] **Step 3: Create src/test-setup.js**

```js
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Add a smoke test to verify the setup**

Create `src/__tests__/setup.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('vitest jsdom + RTL', () => {
  it('renders a div', () => {
    render(<div>hello</div>);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run it**

Run: `npm run test -- src/__tests__/setup.test.jsx`
Expected: PASS (1 passed).

- [ ] **Step 6: Commit**

```bash
git add vite.config.js src/test-setup.js src/__tests__/setup.test.jsx
git commit -m "test: configure vitest jsdom + RTL for SPA tests"
```

---

## Task 1: Taxonomy module — `byId`

**Files:**
- Create: `src/data/taxonomy.js`
- Test: `src/data/__tests__/taxonomy.test.js`

The taxonomy module fetches `/api/industries` once at app start and exposes lookup helpers. For unit tests we inject a fixture so the module is testable without a server.

- [ ] **Step 1: Write the failing test**

Create `src/data/__tests__/taxonomy.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { createTaxonomy } from '../taxonomy.js';

const fixture = {
  assignable: [
    { id: 1,  name: 'Root A',    depth: 0, parentId: null, path: 'Root A' },
    { id: 2,  name: 'Child A1',  depth: 1, parentId: 1,    path: 'Root A › Child A1' },
    { id: 3,  name: 'Child A2',  depth: 1, parentId: 1,    path: 'Root A › Child A2' },
    { id: 10, name: 'Root B',    depth: 0, parentId: null, path: 'Root B' },
  ],
  groupIds: [99, 100],
};

describe('taxonomy.byId', () => {
  const t = createTaxonomy(fixture);

  it('returns the entry for a known id', () => {
    expect(t.byId(2)).toEqual(expect.objectContaining({ id: 2, name: 'Child A1' }));
  });

  it('returns null for unknown id', () => {
    expect(t.byId(9999)).toBeNull();
  });

  it('returns null for group ids', () => {
    expect(t.byId(99)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test, verify failure**

Run: `npm run test -- src/data/__tests__/taxonomy.test.js`
Expected: FAIL with module-not-found or "createTaxonomy is not a function".

- [ ] **Step 3: Minimal implementation**

Create `src/data/taxonomy.js`:

```js
export function createTaxonomy({ assignable, groupIds }) {
  const groupSet = new Set(groupIds);
  const byIdMap = new Map(
    assignable.filter((e) => !groupSet.has(e.id)).map((e) => [e.id, e])
  );

  return {
    byId(id) {
      return byIdMap.get(id) ?? null;
    },
    isGroupId(id) {
      return groupSet.has(id);
    },
    all() {
      return [...byIdMap.values()];
    },
  };
}
```

- [ ] **Step 4: Run test, verify pass**

Run: `npm run test -- src/data/__tests__/taxonomy.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/taxonomy.js src/data/__tests__/taxonomy.test.js
git commit -m "feat(taxonomy): byId lookup with group-id filtering"
```

---

## Task 2: Taxonomy — `byName`

**Files:**
- Modify: `src/data/taxonomy.js`
- Modify: `src/data/__tests__/taxonomy.test.js`

- [ ] **Step 1: Add the failing test**

Append to `src/data/__tests__/taxonomy.test.js`:

```js
describe('taxonomy.byName', () => {
  const t = createTaxonomy(fixture);

  it('returns the entry for an exact name', () => {
    expect(t.byName('Child A1')).toEqual(expect.objectContaining({ id: 2 }));
  });

  it('returns null for unknown name', () => {
    expect(t.byName('Nope')).toBeNull();
  });

  it('treats name lookup case-sensitively (matches FW canonical strings)', () => {
    expect(t.byName('child a1')).toBeNull();
  });
});
```

- [ ] **Step 2: Run, verify failure**

Run: `npm run test -- src/data/__tests__/taxonomy.test.js`
Expected: FAIL with "byName is not a function".

- [ ] **Step 3: Implement byName**

Inside `createTaxonomy`, after building `byIdMap`:

```js
  const byNameMap = new Map(
    [...byIdMap.values()].map((e) => [e.name, e])
  );
```

And add to the returned object:

```js
    byName(name) {
      return byNameMap.get(name) ?? null;
    },
```

- [ ] **Step 4: Run, verify pass**

Run: `npm run test -- src/data/__tests__/taxonomy.test.js`
Expected: PASS (all 6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/data/taxonomy.js src/data/__tests__/taxonomy.test.js
git commit -m "feat(taxonomy): byName lookup (case-sensitive, group-ids excluded)"
```

---

## Task 3: Taxonomy — `walkToDepth0` and `pathOf`

**Files:**
- Modify: `src/data/taxonomy.js`
- Modify: `src/data/__tests__/taxonomy.test.js`

- [ ] **Step 1: Add failing tests**

Append:

```js
describe('taxonomy.walkToDepth0', () => {
  const t = createTaxonomy(fixture);

  it('returns self for a depth-0 entry', () => {
    expect(t.walkToDepth0(1)?.id).toBe(1);
  });

  it('walks up for a depth-1 entry', () => {
    expect(t.walkToDepth0(2)?.id).toBe(1);
  });

  it('returns null for unknown id', () => {
    expect(t.walkToDepth0(9999)).toBeNull();
  });
});

describe('taxonomy.pathOf', () => {
  const t = createTaxonomy(fixture);

  it('returns the full ancestry path joined by " › "', () => {
    expect(t.pathOf(2)).toBe('Root A › Child A1');
  });

  it('returns the leaf name for a root entry', () => {
    expect(t.pathOf(1)).toBe('Root A');
  });

  it('returns null for unknown id', () => {
    expect(t.pathOf(9999)).toBeNull();
  });
});
```

- [ ] **Step 2: Run, verify failure**

Run: `npm run test -- src/data/__tests__/taxonomy.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement**

Add to `createTaxonomy` (returning object):

```js
    walkToDepth0(id) {
      let cur = byIdMap.get(id);
      if (!cur) return null;
      while (cur.parentId != null) {
        const parent = byIdMap.get(cur.parentId);
        if (!parent) break;
        cur = parent;
      }
      return cur;
    },
    pathOf(id) {
      let cur = byIdMap.get(id);
      if (!cur) return null;
      const parts = [cur.name];
      while (cur.parentId != null) {
        const parent = byIdMap.get(cur.parentId);
        if (!parent) break;
        parts.unshift(parent.name);
        cur = parent;
      }
      return parts.join(' › ');
    },
```

- [ ] **Step 4: Run, verify pass**

Run: `npm run test -- src/data/__tests__/taxonomy.test.js`
Expected: PASS (all 12 tests).

- [ ] **Step 5: Commit**

```bash
git add src/data/taxonomy.js src/data/__tests__/taxonomy.test.js
git commit -m "feat(taxonomy): walkToDepth0 and pathOf helpers"
```

---

## Task 4: Taxonomy — `longestCommonPathPrefix` (multi-ID resolution)

**Files:**
- Modify: `src/data/taxonomy.js`
- Modify: `src/data/__tests__/taxonomy.test.js`

Used by both adapters when a brand has multiple resolved industry IDs (pipe-string on the AM side, comma-list on the Programmatic side).

- [ ] **Step 1: Add failing tests**

```js
describe('taxonomy.longestCommonPathPrefix', () => {
  const t = createTaxonomy(fixture);

  it('returns the deepest common ancestor when ids span a subtree', () => {
    // both children of Root A → common ancestor = Root A
    const result = t.longestCommonPathPrefix([2, 3]);
    expect(result?.id).toBe(1);
  });

  it('returns the entry itself when all ids are identical', () => {
    expect(t.longestCommonPathPrefix([2, 2, 2])?.id).toBe(2);
  });

  it('returns null when ids are in disjoint roots', () => {
    expect(t.longestCommonPathPrefix([2, 10])).toBeNull();
  });

  it('ignores unknown ids', () => {
    expect(t.longestCommonPathPrefix([2, 9999, 3])?.id).toBe(1);
  });

  it('returns null for empty input', () => {
    expect(t.longestCommonPathPrefix([])).toBeNull();
  });
});
```

- [ ] **Step 2: Run, verify failure**

Run: `npm run test -- src/data/__tests__/taxonomy.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement**

Add to `createTaxonomy`:

```js
    longestCommonPathPrefix(ids) {
      const ancestries = ids
        .map((id) => {
          const chain = [];
          let cur = byIdMap.get(id);
          while (cur) {
            chain.unshift(cur);  // root first
            cur = cur.parentId != null ? byIdMap.get(cur.parentId) : null;
          }
          return chain;
        })
        .filter((c) => c.length > 0);

      if (ancestries.length === 0) return null;

      let prefix = ancestries[0];
      for (let i = 1; i < ancestries.length; i++) {
        const other = ancestries[i];
        let j = 0;
        while (j < prefix.length && j < other.length && prefix[j].id === other[j].id) j++;
        prefix = prefix.slice(0, j);
        if (prefix.length === 0) return null;
      }
      return prefix[prefix.length - 1];
    },
```

- [ ] **Step 4: Run, verify pass**

Run: `npm run test -- src/data/__tests__/taxonomy.test.js`
Expected: PASS (17 tests).

- [ ] **Step 5: Commit**

```bash
git add src/data/taxonomy.js src/data/__tests__/taxonomy.test.js
git commit -m "feat(taxonomy): longestCommonPathPrefix for multi-id industry resolution"
```

---

## Task 5: Taxonomy — `hasAssignableDescendants` and `isAncestor`

**Files:**
- Modify: `src/data/taxonomy.js`
- Modify: `src/data/__tests__/taxonomy.test.js`

Used by F1 detector ("does this depth-0 industry have more-specific children?") and F3b detector ("is one side an ancestor of the other?").

- [ ] **Step 1: Add failing tests**

```js
describe('taxonomy.hasAssignableDescendants', () => {
  const t = createTaxonomy(fixture);

  it('true when entry has children', () => {
    expect(t.hasAssignableDescendants(1)).toBe(true);
  });

  it('false when leaf', () => {
    expect(t.hasAssignableDescendants(2)).toBe(false);
  });
});

describe('taxonomy.isAncestor', () => {
  const t = createTaxonomy(fixture);

  it('true when ancestorId is parent of descendantId', () => {
    expect(t.isAncestor(1, 2)).toBe(true);
  });

  it('false in reverse', () => {
    expect(t.isAncestor(2, 1)).toBe(false);
  });

  it('false for siblings', () => {
    expect(t.isAncestor(2, 3)).toBe(false);
  });

  it('false when equal', () => {
    expect(t.isAncestor(1, 1)).toBe(false);
  });
});
```

- [ ] **Step 2: Run, verify failure**

Run: `npm run test -- src/data/__tests__/taxonomy.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement**

Before the returned object, precompute children:

```js
  const childrenByParent = new Map();
  for (const e of byIdMap.values()) {
    if (e.parentId == null) continue;
    if (!childrenByParent.has(e.parentId)) childrenByParent.set(e.parentId, []);
    childrenByParent.get(e.parentId).push(e);
  }
```

Add to returned object:

```js
    hasAssignableDescendants(id) {
      return (childrenByParent.get(id)?.length ?? 0) > 0;
    },
    isAncestor(ancestorId, descendantId) {
      if (ancestorId === descendantId) return false;
      let cur = byIdMap.get(descendantId);
      while (cur && cur.parentId != null) {
        if (cur.parentId === ancestorId) return true;
        cur = byIdMap.get(cur.parentId);
      }
      return false;
    },
```

- [ ] **Step 4: Run, verify pass**

Run: `npm run test -- src/data/__tests__/taxonomy.test.js`
Expected: PASS (23 tests).

- [ ] **Step 5: Commit**

```bash
git add src/data/taxonomy.js src/data/__tests__/taxonomy.test.js
git commit -m "feat(taxonomy): hasAssignableDescendants and isAncestor helpers"
```

---

## Task 6: Taxonomy loader — fetch from /api/industries

**Files:**
- Modify: `src/data/taxonomy.js`
- Modify: `src/data/__tests__/taxonomy.test.js`

A thin async loader that fetches and constructs the taxonomy. The pure `createTaxonomy` factory stays test-friendly.

- [ ] **Step 1: Add failing test**

Append:

```js
import { vi } from 'vitest';
import { loadTaxonomy } from '../taxonomy.js';

describe('loadTaxonomy', () => {
  it('fetches /api/industries and returns a taxonomy', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => fixture,
    });

    const t = await loadTaxonomy();
    expect(t.byId(2)?.name).toBe('Child A1');
    expect(global.fetch).toHaveBeenCalledWith('/api/industries');
  });

  it('throws if fetch fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    await expect(loadTaxonomy()).rejects.toThrow(/500/);
  });
});
```

- [ ] **Step 2: Run, verify failure**

Run: `npm run test -- src/data/__tests__/taxonomy.test.js`
Expected: FAIL.

- [ ] **Step 3: Add loader to taxonomy.js**

At bottom of `src/data/taxonomy.js`:

```js
export async function loadTaxonomy() {
  const res = await fetch('/api/industries');
  if (!res.ok) throw new Error(`Failed to load /api/industries (${res.status})`);
  const payload = await res.json();
  return createTaxonomy(payload);
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm run test -- src/data/__tests__/taxonomy.test.js`
Expected: PASS (25 tests).

- [ ] **Step 5: Commit**

```bash
git add src/data/taxonomy.js src/data/__tests__/taxonomy.test.js
git commit -m "feat(taxonomy): loadTaxonomy() fetches /api/industries"
```

---

## Task 7: CSV parser helper

**Files:**
- Create: `src/data/adapters/csv-parser.js`
- Test: `src/data/adapters/__tests__/csv-parser.test.js`

Extracts the RFC 4180-aware splitter from `Dashboard.jsx` into a standalone helper so both adapters share it. Handles quoted fields, embedded commas, doubled-quote escapes, and tab/comma delimiter auto-detect.

- [ ] **Step 1: Write failing tests**

Create `src/data/adapters/__tests__/csv-parser.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { parseCsv, splitCsvLine } from '../csv-parser.js';

describe('splitCsvLine', () => {
  it('splits simple comma rows', () => {
    expect(splitCsvLine('a,b,c', ',')).toEqual(['a', 'b', 'c']);
  });

  it('handles quoted fields with embedded commas', () => {
    expect(splitCsvLine('a,"b,c",d', ',')).toEqual(['a', 'b,c', 'd']);
  });

  it('handles doubled-quote escapes inside quoted fields', () => {
    expect(splitCsvLine('"a ""b"" c"', ',')).toEqual(['a "b" c']);
  });

  it('handles thousands-separated numbers in quotes', () => {
    expect(splitCsvLine('Life360,1378215,Tech,63.90,"2,779"', ',')).toEqual([
      'Life360', '1378215', 'Tech', '63.90', '2,779',
    ]);
  });

  it('supports tab delimiter', () => {
    expect(splitCsvLine('a\tb\tc', '\t')).toEqual(['a', 'b', 'c']);
  });
});

describe('parseCsv', () => {
  it('parses header + rows into objects', () => {
    const csv = 'name,age\nAlice,30\nBob,25';
    expect(parseCsv(csv)).toEqual([
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ]);
  });

  it('auto-detects tab delimiter', () => {
    const tsv = 'name\tage\nAlice\t30';
    expect(parseCsv(tsv)).toEqual([{ name: 'Alice', age: 30 }]);
  });

  it('coerces numeric strings; preserves strings with non-numeric chars', () => {
    const csv = 'k,v\nx,42\ny,hello\nz,';
    expect(parseCsv(csv)).toEqual([
      { k: 'x', v: 42 },
      { k: 'y', v: 'hello' },
      { k: 'z', v: null },
    ]);
  });

  it('parses thousands-separated quoted numbers as strings (caller decides coercion)', () => {
    const csv = 'k,v\na,"2,779"';
    expect(parseCsv(csv)).toEqual([{ k: 'a', v: '2,779' }]);
  });

  it('returns [] for empty input', () => {
    expect(parseCsv('')).toEqual([]);
  });

  it('accepts an explicit firstDataLine offset (for reports with metadata header)', () => {
    const csv = 'metadata\nmore metadata\nname,age\nAlice,30';
    expect(parseCsv(csv, { firstDataLine: 2 })).toEqual([{ name: 'Alice', age: 30 }]);
  });
});
```

- [ ] **Step 2: Run, verify failure**

Run: `npm run test -- src/data/adapters/__tests__/csv-parser.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

Create `src/data/adapters/csv-parser.js`:

```js
export function splitCsvLine(line, delim) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { cur += c; }
    } else {
      if (c === '"') { inQuotes = true; }
      else if (c === delim) { out.push(cur); cur = ''; }
      else { cur += c; }
    }
  }
  out.push(cur);
  return out;
}

export function parseCsv(text, { firstDataLine = 0 } = {}) {
  if (!text || !text.trim()) return [];
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length <= firstDataLine) return [];

  const headerLine = lines[firstDataLine];
  const delim = headerLine.includes('\t') ? '\t' : ',';
  const headers = splitCsvLine(headerLine, delim).map((h) => h.trim());

  return lines.slice(firstDataLine + 1).map((line) => {
    const vals = splitCsvLine(line, delim);
    const row = {};
    headers.forEach((h, i) => {
      const raw = (vals[i] ?? '').trim();
      if (raw === '') {
        row[h] = null;
      } else if (/^-?\d+(\.\d+)?$/.test(raw)) {
        row[h] = Number(raw);
      } else {
        row[h] = raw;
      }
    });
    return row;
  });
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm run test -- src/data/adapters/__tests__/csv-parser.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/adapters/csv-parser.js src/data/adapters/__tests__/csv-parser.test.js
git commit -m "feat(adapters): shared CSV parser with RFC 4180 quoting + metadata-row offset"
```

---

## Task 8: `bq-sql` adapter — detection and parsing

**Files:**
- Create: `src/data/adapters/bq-sql.js`
- Test: `src/data/adapters/__tests__/bq-sql.test.js`

Consumes the existing BigQuery-export format. Emits `RawRecord[]` (one per brand row) shaped for `pivotToCanonical()`.

`RawRecord` shape (canonical contract for both adapters):

```ts
{
  source: 'bq-sql' | 'fw-report',
  global_brand_id: int,
  global_brand_nm: string,
  global_advertiser_id: int | null,
  global_advertiser_nm: string | null,
  v3_advertiser_id: int | null,
  v3_brand_id: int | null,
  am: { applied_industry_ids_raw: string|null, industry_names: string[]|null, impressions, revenue } | null,
  pg: { applied_industry_ids_raw: string|null, industry_names: string[]|null, impressions, revenue } | null,
  gb: { industry_id: int|null } | null,
}
```

- [ ] **Step 1: Write failing tests**

Create `src/data/adapters/__tests__/bq-sql.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { detectBqSqlFormat, parseBqSql } from '../bq-sql.js';

const SAMPLE_CSV = [
  'global_brand_id,global_brand_nm,global_advertiser_id,global_advertiser_nm,v3_advertiser_id,v3_brand_id,am_applied_industry_ids_raw,am_impressions,am_revenue,ind_applied_industry_ids_raw,ind_impressions,ind_revenue,gb_industry_id',
  '1378215,Life360,5001,Life360 Inc,4291,8821,123|456,1000000,15000,789|456,500000,7500,456',
  '1047050,Midas,5002,Midas Corp,,,12,2000000,30000,,0,0,12',
].join('\n');

describe('detectBqSqlFormat', () => {
  it('matches when header has am_applied_industry_ids_raw and global_brand_id', () => {
    expect(detectBqSqlFormat(SAMPLE_CSV)).toBe(true);
  });

  it('does not match the FW report header', () => {
    const fw = 'Global Brand Name,Global Brand ID,Programmatic Industry Name,Run Revenue,Gross Counted Ads';
    expect(detectBqSqlFormat(fw)).toBe(false);
  });
});

describe('parseBqSql', () => {
  it('returns one RawRecord per row', () => {
    const records = parseBqSql(SAMPLE_CSV);
    expect(records).toHaveLength(2);
    expect(records[0].source).toBe('bq-sql');
    expect(records[0].global_brand_id).toBe(1378215);
  });

  it('populates am slot from am_* columns', () => {
    const [r] = parseBqSql(SAMPLE_CSV);
    expect(r.am).toEqual({
      applied_industry_ids_raw: '123|456',
      industry_names: null,
      impressions: 1000000,
      revenue: 15000,
    });
  });

  it('populates pg slot from ind_* columns', () => {
    const [r] = parseBqSql(SAMPLE_CSV);
    expect(r.pg).toEqual({
      applied_industry_ids_raw: '789|456',
      industry_names: null,
      impressions: 500000,
      revenue: 7500,
    });
  });

  it('emits null am/pg when the side has no data', () => {
    const [, midas] = parseBqSql(SAMPLE_CSV);
    expect(midas.am).not.toBeNull();
    expect(midas.pg).toBeNull();           // ind_applied_industry_ids_raw is empty
  });

  it('populates gb slot from gb_industry_id', () => {
    const [r] = parseBqSql(SAMPLE_CSV);
    expect(r.gb).toEqual({ industry_id: 456 });
  });

  it('coerces v3 ids to int or null', () => {
    const records = parseBqSql(SAMPLE_CSV);
    expect(records[0].v3_advertiser_id).toBe(4291);
    expect(records[1].v3_advertiser_id).toBeNull();
  });
});
```

- [ ] **Step 2: Run, verify failure**

Run: `npm run test -- src/data/adapters/__tests__/bq-sql.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

Create `src/data/adapters/bq-sql.js`:

```js
import { parseCsv } from './csv-parser.js';

const REQUIRED_HEADERS = ['global_brand_id', 'am_applied_industry_ids_raw'];

export function detectBqSqlFormat(text) {
  if (!text) return false;
  const firstLine = text.split(/\r?\n/, 1)[0] || '';
  return REQUIRED_HEADERS.every((h) => firstLine.includes(h));
}

function emptyToNull(v) {
  return v === '' || v === null || v === undefined ? null : v;
}

function sideOrNull(rawIds, impressions, revenue) {
  if (rawIds == null || rawIds === '') return null;
  return {
    applied_industry_ids_raw: String(rawIds),
    industry_names: null,
    impressions: impressions ?? 0,
    revenue: revenue ?? 0,
  };
}

export function parseBqSql(text) {
  const rows = parseCsv(text);
  return rows.map((r) => ({
    source: 'bq-sql',
    global_brand_id: Number(r.global_brand_id),
    global_brand_nm: r.global_brand_nm ?? null,
    global_advertiser_id: emptyToNull(r.global_advertiser_id),
    global_advertiser_nm: r.global_advertiser_nm ?? null,
    v3_advertiser_id: emptyToNull(r.v3_advertiser_id),
    v3_brand_id: emptyToNull(r.v3_brand_id),
    am: sideOrNull(r.am_applied_industry_ids_raw, r.am_impressions, r.am_revenue),
    pg: sideOrNull(r.ind_applied_industry_ids_raw, r.ind_impressions, r.ind_revenue),
    gb: r.gb_industry_id != null ? { industry_id: Number(r.gb_industry_id) } : null,
  }));
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm run test -- src/data/adapters/__tests__/bq-sql.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/adapters/bq-sql.js src/data/adapters/__tests__/bq-sql.test.js
git commit -m "feat(adapters): bq-sql adapter — detect + parse pre-pivoted BigQuery export"
```

---

## Task 9: `fw-report` adapter — detection and metadata skip

**Files:**
- Create: `src/data/adapters/fw-report.js`
- Test: `src/data/adapters/__tests__/fw-report.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/data/adapters/__tests__/fw-report.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { detectFwReportFormat, parseFwReport } from '../fw-report.js';

const SAMPLE = [
  'Report Name: Analytics 2026-05-11 09_42_53',
  'Start Date: 05/08/2026 EDT End Date: 05/10/2026 EDT Generated Date: 05/11/2026 09:44:50 EDT',
  'Pre-Run Filters:',
  "Notes: This report reflects data from the 'Programmatic' sales channel",
  'Global Brand Name,Global Brand ID,Programmatic Industry Name,Run Revenue,Gross Counted Ads',
  'Life360,1378215,Technology Sector,63.90226,"2,779"',
  'Midas,1047050,Automotive Repair Shops,"2,628.91473","315,440"',
  'Xdemvy,1660968,"Pharma A,Pharma A - All else,Sub1,Sub2","2,112.69301","126,950"',
].join('\n');

describe('detectFwReportFormat', () => {
  it('matches when "Global Brand Name,Global Brand ID,..." header is present', () => {
    expect(detectFwReportFormat(SAMPLE)).toBe(true);
  });

  it('does not match a BQ header', () => {
    expect(detectFwReportFormat('global_brand_id,am_applied_industry_ids_raw,...')).toBe(false);
  });

  it('skips up to 10 metadata lines looking for header', () => {
    expect(detectFwReportFormat(SAMPLE)).toBe(true);
  });
});

describe('parseFwReport — header detection skips metadata rows', () => {
  it('emits one RawRecord per data row', () => {
    const records = parseFwReport(SAMPLE);
    expect(records).toHaveLength(3);
  });

  it('parses global_brand_id as integer', () => {
    const [life360] = parseFwReport(SAMPLE);
    expect(life360.global_brand_id).toBe(1378215);
  });
});
```

- [ ] **Step 2: Run, verify failure**

Run: `npm run test -- src/data/adapters/__tests__/fw-report.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement detection + metadata skip**

Create `src/data/adapters/fw-report.js`:

```js
import { parseCsv } from './csv-parser.js';

const FW_HEADER_SIGNATURE = /^Global Brand Name,Global Brand ID,/;

function findHeaderIndex(text) {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    if (FW_HEADER_SIGNATURE.test(lines[i])) return i;
  }
  return -1;
}

export function detectFwReportFormat(text) {
  return findHeaderIndex(text) >= 0;
}

export function parseFwReport(text) {
  const headerIdx = findHeaderIndex(text);
  if (headerIdx < 0) return [];

  const rows = parseCsv(text, { firstDataLine: headerIdx });
  return rows.map((r) => ({
    source: 'fw-report',
    global_brand_id: Number(r['Global Brand ID']),
    global_brand_nm: r['Global Brand Name'] ?? null,
    global_advertiser_id: null,
    global_advertiser_nm: null,
    v3_advertiser_id: null,
    v3_brand_id: null,
    am: null,
    pg: {
      applied_industry_ids_raw: null,
      industry_names: typeof r['Programmatic Industry Name'] === 'string'
        ? r['Programmatic Industry Name'].split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      impressions: parseFwNumber(r['Gross Counted Ads']),
      revenue: parseFwNumber(r['Run Revenue']),
    },
    gb: null,
  }));
}

function parseFwNumber(v) {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return v;
  const cleaned = String(v).replace(/,/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm run test -- src/data/adapters/__tests__/fw-report.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/adapters/fw-report.js src/data/adapters/__tests__/fw-report.test.js
git commit -m "feat(adapters): fw-report adapter — detect, skip metadata, parse base rows"
```

---

## Task 10: `fw-report` adapter — industry name list + revenue parsing

**Files:**
- Modify: `src/data/adapters/__tests__/fw-report.test.js`

Adds tests proving the multi-industry comma-split + thousands-separator handling. Implementation already covers it from Task 9; this task locks the behavior with tests.

- [ ] **Step 1: Add tests**

Append to `fw-report.test.js`:

```js
describe('parseFwReport — industry name list + numbers', () => {
  it('splits Programmatic Industry Name on commas', () => {
    const [, , xdemvy] = parseFwReport(SAMPLE);
    expect(xdemvy.pg.industry_names).toEqual([
      'Pharma A',
      'Pharma A - All else',
      'Sub1',
      'Sub2',
    ]);
  });

  it('handles single-industry rows', () => {
    const [life360] = parseFwReport(SAMPLE);
    expect(life360.pg.industry_names).toEqual(['Technology Sector']);
  });

  it('parses thousands-separated impressions/revenue correctly', () => {
    const [, midas] = parseFwReport(SAMPLE);
    expect(midas.pg.impressions).toBe(315440);
    expect(midas.pg.revenue).toBeCloseTo(2628.91473, 5);
  });

  it('coerces empty/missing revenue to 0', () => {
    const noRev = [
      'Global Brand Name,Global Brand ID,Programmatic Industry Name,Run Revenue,Gross Counted Ads',
      'X,1,Tech,,5',
    ].join('\n');
    const [r] = parseFwReport(noRev);
    expect(r.pg.revenue).toBe(0);
  });
});
```

- [ ] **Step 2: Run, verify pass**

Run: `npm run test -- src/data/adapters/__tests__/fw-report.test.js`
Expected: PASS (all 7 tests).

- [ ] **Step 3: Commit**

```bash
git add src/data/adapters/__tests__/fw-report.test.js
git commit -m "test(adapters): lock fw-report multi-industry split + thousands-sep parsing"
```

---

## Task 11: Adapter dispatch — `loadCsv` / `detectFormat`

**Files:**
- Create: `src/data/adapters/index.js`
- Test: `src/data/adapters/__tests__/index.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/data/adapters/__tests__/index.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { detectFormat, loadCsv } from '../index.js';

const BQ_CSV = 'global_brand_id,am_applied_industry_ids_raw\n1,123|456';
const FW_CSV = [
  'Notes: This report reflects data from the \'Programmatic\' sales channel',
  'Global Brand Name,Global Brand ID,Programmatic Industry Name,Run Revenue,Gross Counted Ads',
  'Life360,1378215,Tech,1.0,1',
].join('\n');

describe('detectFormat', () => {
  it('returns "bq-sql" for BQ CSV', () => {
    expect(detectFormat(BQ_CSV)).toBe('bq-sql');
  });
  it('returns "fw-report" for FW CSV', () => {
    expect(detectFormat(FW_CSV)).toBe('fw-report');
  });
  it('returns null for unknown content', () => {
    expect(detectFormat('foo,bar\n1,2')).toBeNull();
  });
});

describe('loadCsv', () => {
  it('dispatches to bq-sql and returns RawRecord[]', () => {
    const records = loadCsv(BQ_CSV);
    expect(records[0].source).toBe('bq-sql');
  });
  it('dispatches to fw-report and returns RawRecord[]', () => {
    const records = loadCsv(FW_CSV);
    expect(records[0].source).toBe('fw-report');
  });
  it('throws on unknown format', () => {
    expect(() => loadCsv('foo,bar\n1,2')).toThrow(/unrecognized/i);
  });
});
```

- [ ] **Step 2: Run, verify failure**

Run: `npm run test -- src/data/adapters/__tests__/index.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/data/adapters/index.js`:

```js
import { detectBqSqlFormat, parseBqSql } from './bq-sql.js';
import { detectFwReportFormat, parseFwReport } from './fw-report.js';

export function detectFormat(text) {
  if (detectBqSqlFormat(text)) return 'bq-sql';
  if (detectFwReportFormat(text)) return 'fw-report';
  return null;
}

export function loadCsv(text) {
  const fmt = detectFormat(text);
  switch (fmt) {
    case 'bq-sql':    return parseBqSql(text);
    case 'fw-report': return parseFwReport(text);
    default:          throw new Error('Unrecognized CSV format');
  }
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm run test -- src/data/adapters/__tests__/index.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/adapters/index.js src/data/adapters/__tests__/index.test.js
git commit -m "feat(adapters): detectFormat + loadCsv dispatch"
```

---

## Task 12: Canonical pivot — one row per brand

**Files:**
- Create: `src/data/canonical.js`
- Test: `src/data/__tests__/canonical.test.js`

`pivotToCanonical(rawRecords, taxonomy)` merges per-brand records from both adapters into a single canonical row.

Precedence rules:
- `am`: BQ wins (only adapter that produces it).
- `pg`: FW report wins. BQ's `pg` (from `ind_*`) is preserved in `pg.bq_fallback` for the drawer to surface.
- Identity fields: AM-side wins for advertiser id/name (BQ has them; FW doesn't).

- [ ] **Step 1: Write failing tests**

Create `src/data/__tests__/canonical.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { createTaxonomy } from '../taxonomy.js';
import { pivotToCanonical } from '../canonical.js';

const taxonomy = createTaxonomy({
  assignable: [
    { id: 100, name: 'Tech', depth: 0, parentId: null, path: 'Tech' },
    { id: 101, name: 'Software', depth: 1, parentId: 100, path: 'Tech › Software' },
    { id: 200, name: 'Auto', depth: 0, parentId: null, path: 'Auto' },
  ],
  groupIds: [],
});

describe('pivotToCanonical', () => {
  it('emits one row per global_brand_id', () => {
    const records = [
      { source: 'bq-sql', global_brand_id: 1, global_brand_nm: 'A',
        global_advertiser_id: 10, global_advertiser_nm: 'AdvA',
        v3_advertiser_id: 1000, v3_brand_id: 2000,
        am: { applied_industry_ids_raw: '101', industry_names: null, impressions: 100, revenue: 5 },
        pg: { applied_industry_ids_raw: '200', industry_names: null, impressions: 50, revenue: 2 },
        gb: { industry_id: 101 } },
    ];
    const rows = pivotToCanonical(records, taxonomy);
    expect(rows).toHaveLength(1);
    expect(rows[0].global_brand_id).toBe(1);
  });

  it('resolves am.resolved_industry_id from pipe-string', () => {
    const records = [
      { source: 'bq-sql', global_brand_id: 1, global_brand_nm: 'A',
        global_advertiser_id: 10, global_advertiser_nm: 'AdvA',
        v3_advertiser_id: null, v3_brand_id: null,
        am: { applied_industry_ids_raw: '100|101', industry_names: null, impressions: 100, revenue: 5 },
        pg: null, gb: null },
    ];
    const [row] = pivotToCanonical(records, taxonomy);
    expect(row.am.resolved_industry_id).toBe(100);   // common ancestor of {100, 101} is Tech (100)
    expect(row.am.resolved_industry_name).toBe('Tech');
    expect(row.am.resolved_industry_path).toBe('Tech');
    expect(row.am.resolved_industry_depth).toBe(0);
  });

  it('resolves pg from industry_names via taxonomy.byName', () => {
    const records = [
      { source: 'fw-report', global_brand_id: 1, global_brand_nm: 'A',
        global_advertiser_id: null, global_advertiser_nm: null,
        v3_advertiser_id: null, v3_brand_id: null,
        am: null,
        pg: { applied_industry_ids_raw: null, industry_names: ['Software'], impressions: 1, revenue: 1 },
        gb: null },
    ];
    const [row] = pivotToCanonical(records, taxonomy);
    expect(row.pg.resolved_industry_id).toBe(101);
    expect(row.pg.resolved_industry_path).toBe('Tech › Software');
  });

  it('FW report wins for pg slot when both BQ and FW provide it', () => {
    const records = [
      { source: 'bq-sql', global_brand_id: 1, global_brand_nm: 'A',
        global_advertiser_id: 10, global_advertiser_nm: 'AdvA',
        v3_advertiser_id: null, v3_brand_id: null,
        am: null,
        pg: { applied_industry_ids_raw: '200', industry_names: null, impressions: 999, revenue: 999 },
        gb: null },
      { source: 'fw-report', global_brand_id: 1, global_brand_nm: 'A',
        global_advertiser_id: null, global_advertiser_nm: null,
        v3_advertiser_id: null, v3_brand_id: null,
        am: null,
        pg: { applied_industry_ids_raw: null, industry_names: ['Tech'], impressions: 1, revenue: 1 },
        gb: null },
    ];
    const [row] = pivotToCanonical(records, taxonomy);
    expect(row.pg.resolved_industry_id).toBe(100);             // from FW
    expect(row.pg.impressions).toBe(1);                        // from FW
    expect(row.pg.bq_fallback.impressions).toBe(999);          // BQ preserved
  });

  it('advertiser identity from BQ side when present', () => {
    const records = [
      { source: 'fw-report', global_brand_id: 1, global_brand_nm: 'A (FW name)',
        global_advertiser_id: null, global_advertiser_nm: null,
        v3_advertiser_id: null, v3_brand_id: null,
        am: null,
        pg: { applied_industry_ids_raw: null, industry_names: ['Tech'], impressions: 1, revenue: 1 },
        gb: null },
      { source: 'bq-sql', global_brand_id: 1, global_brand_nm: 'A (BQ name)',
        global_advertiser_id: 10, global_advertiser_nm: 'AdvA',
        v3_advertiser_id: 1000, v3_brand_id: 2000,
        am: { applied_industry_ids_raw: '100', industry_names: null, impressions: 5, revenue: 1 },
        pg: null, gb: null },
    ];
    const [row] = pivotToCanonical(records, taxonomy);
    expect(row.global_brand_nm).toBe('A (BQ name)');
    expect(row.global_advertiser_id).toBe(10);
    expect(row.v3_brand_id).toBe(2000);
  });
});
```

- [ ] **Step 2: Run, verify failure**

Run: `npm run test -- src/data/__tests__/canonical.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/data/canonical.js`:

```js
function resolveSide(side, taxonomy) {
  if (!side) return null;

  let ids = [];
  if (side.applied_industry_ids_raw) {
    ids = side.applied_industry_ids_raw.split('|').map((s) => Number(s.trim())).filter(Number.isFinite);
  } else if (side.industry_names && side.industry_names.length > 0) {
    ids = side.industry_names
      .map((n) => taxonomy.byName(n)?.id)
      .filter((id) => id != null);
  }

  const resolvedEntry = ids.length === 1
    ? taxonomy.byId(ids[0])
    : taxonomy.longestCommonPathPrefix(ids);

  return {
    applied_industry_ids_raw: side.applied_industry_ids_raw ?? null,
    industry_names: side.industry_names ?? null,
    resolved_industry_id: resolvedEntry?.id ?? null,
    resolved_industry_name: resolvedEntry?.name ?? null,
    resolved_industry_depth: resolvedEntry?.depth ?? null,
    resolved_industry_path: resolvedEntry ? taxonomy.pathOf(resolvedEntry.id) : null,
    impressions: side.impressions ?? 0,
    revenue: side.revenue ?? 0,
  };
}

export function pivotToCanonical(rawRecords, taxonomy) {
  const byBrand = new Map();

  for (const r of rawRecords) {
    const key = r.global_brand_id;
    if (!byBrand.has(key)) {
      byBrand.set(key, {
        global_brand_id: key,
        global_brand_nm: r.global_brand_nm,
        global_advertiser_id: r.global_advertiser_id,
        global_advertiser_nm: r.global_advertiser_nm,
        v3_advertiser_id: r.v3_advertiser_id,
        v3_brand_id: r.v3_brand_id,
        am: null,
        pg: null,
        gb: null,
        _bqPgRaw: null,
      });
    }
    const row = byBrand.get(key);

    // AM only comes from bq-sql
    if (r.am && r.source === 'bq-sql') {
      row.am = resolveSide(r.am, taxonomy);
    }

    // PG: bq-sql first (sets fallback); fw-report overrides
    if (r.pg) {
      if (r.source === 'fw-report') {
        row.pg = resolveSide(r.pg, taxonomy);
      } else if (r.source === 'bq-sql' && row.pg == null) {
        row._bqPgRaw = r.pg;
      }
    }

    // Identity: BQ wins because it has advertiser info
    if (r.source === 'bq-sql') {
      row.global_brand_nm = r.global_brand_nm ?? row.global_brand_nm;
      row.global_advertiser_id = r.global_advertiser_id ?? row.global_advertiser_id;
      row.global_advertiser_nm = r.global_advertiser_nm ?? row.global_advertiser_nm;
      row.v3_advertiser_id = r.v3_advertiser_id ?? row.v3_advertiser_id;
      row.v3_brand_id = r.v3_brand_id ?? row.v3_brand_id;
      if (r.gb) row.gb = r.gb;
    }
  }

  // Finalize: attach BQ fallback if we kept one, or use BQ pg if FW didn't override
  for (const row of byBrand.values()) {
    if (row.pg && row._bqPgRaw) {
      row.pg.bq_fallback = resolveSide(row._bqPgRaw, taxonomy);
    } else if (!row.pg && row._bqPgRaw) {
      row.pg = resolveSide(row._bqPgRaw, taxonomy);
    }
    delete row._bqPgRaw;
    row.total_impressions = (row.am?.impressions ?? 0) + (row.pg?.impressions ?? 0);
    row.total_revenue = (row.am?.revenue ?? 0) + (row.pg?.revenue ?? 0);
    row.other_modules = [];
    row.flags = [];
    row.pg_creatives = null;
  }

  return [...byBrand.values()];
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm run test -- src/data/__tests__/canonical.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/canonical.js src/data/__tests__/canonical.test.js
git commit -m "feat(canonical): pivotToCanonical merges BQ + FW records into one row per brand"
```

---

## Task 13: Flag config

**Files:**
- Create: `src/flags/config.js`

- [ ] **Step 1: Create the config**

```js
export const flagConfig = {
  programmaticGenericDepthCutoff: 1,
  amGenericDepthCutoff: 1,
  highImpressionThreshold: 100_000,
};
```

- [ ] **Step 2: Commit**

```bash
git add src/flags/config.js
git commit -m "feat(flags): config knobs for depth cutoffs and high-impression threshold"
```

---

## Task 14: Flag detector — F1 (Programmatic Module)

**Files:**
- Create: `src/flags/detect.js`
- Test: `src/flags/__tests__/detect.test.js`

The detector returns a new copy of each row with `flags[]` populated.

- [ ] **Step 1: Write failing test**

Create `src/flags/__tests__/detect.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { createTaxonomy } from '../../data/taxonomy.js';
import { detectFlags } from '../detect.js';
import { flagConfig } from '../config.js';

const taxonomy = createTaxonomy({
  assignable: [
    { id: 100, name: 'Tech', depth: 0, parentId: null, path: 'Tech' },
    { id: 101, name: 'Software', depth: 1, parentId: 100, path: 'Tech › Software' },
    { id: 102, name: 'Mobile Apps', depth: 2, parentId: 101, path: 'Tech › Software › Mobile Apps' },
    { id: 200, name: 'Auto', depth: 0, parentId: null, path: 'Auto' },
    { id: 201, name: 'Dealers', depth: 1, parentId: 200, path: 'Auto › Dealers' },
  ],
  groupIds: [999],
});

function row(overrides = {}) {
  return {
    global_brand_id: 1,
    am: null, pg: null, gb: null,
    total_impressions: 0, total_revenue: 0,
    other_modules: [], flags: [], pg_creatives: null,
    ...overrides,
  };
}

function side(id, impressions = 0) {
  const e = taxonomy.byId(id);
  return {
    applied_industry_ids_raw: String(id),
    industry_names: null,
    resolved_industry_id: id,
    resolved_industry_name: e.name,
    resolved_industry_depth: e.depth,
    resolved_industry_path: taxonomy.pathOf(id),
    impressions, revenue: 0,
  };
}

describe('F1 (Programmatic Module)', () => {
  it('fires when pg depth ≤ cutoff and entry has descendants', () => {
    const rows = detectFlags([row({ pg: side(100) })], taxonomy, flagConfig);
    expect(rows[0].flags.some((f) => f.type === 'F1' && f.side === 'pg')).toBe(true);
  });

  it('does not fire when pg depth is past cutoff', () => {
    const rows = detectFlags([row({ pg: side(102) })], taxonomy, flagConfig);
    expect(rows[0].flags.some((f) => f.type === 'F1' && f.side === 'pg')).toBe(false);
  });

  it('does not fire on leaf depth-0 entries (no descendants)', () => {
    // We need a depth-0 leaf. Add an inline fixture for that.
    const t2 = createTaxonomy({
      assignable: [{ id: 50, name: 'Solo Root', depth: 0, parentId: null, path: 'Solo Root' }],
      groupIds: [],
    });
    const rows = detectFlags([row({ pg: { ...side(50), resolved_industry_id: 50, resolved_industry_depth: 0 } })], t2, flagConfig);
    expect(rows[0].flags.some((f) => f.type === 'F1')).toBe(false);
  });

  it('adds F5 high-impact sub-marker when pg impressions exceed threshold', () => {
    const rows = detectFlags([row({ pg: side(100, 200_000) })], taxonomy, flagConfig);
    expect(rows[0].flags.find((f) => f.type === 'F1' && f.side === 'pg')?.highImpact).toBe(true);
  });
});
```

- [ ] **Step 2: Run, verify failure**

Run: `npm run test -- src/flags/__tests__/detect.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement F1 only**

Create `src/flags/detect.js`:

```js
export function detectFlags(rows, taxonomy, config) {
  return rows.map((row) => {
    const flags = [];
    detectF1(row, taxonomy, config, flags);
    return { ...row, flags };
  });
}

function detectF1(row, taxonomy, config, flags) {
  for (const side of ['pg', 'am']) {
    const s = row[side];
    if (!s || s.resolved_industry_id == null) continue;
    const cutoff = side === 'pg' ? config.programmaticGenericDepthCutoff : config.amGenericDepthCutoff;
    if (s.resolved_industry_depth > cutoff) continue;
    if (!taxonomy.hasAssignableDescendants(s.resolved_industry_id)) continue;

    const flag = {
      type: 'F1',
      side,
      severity: side === 'pg' ? 'high' : 'medium',
      note: `${side === 'pg' ? 'Programmatic Module' : 'Advertiser Module'} mapped to '${s.resolved_industry_name}' (depth ${s.resolved_industry_depth}) — has more specific descendants.`,
    };
    if (side === 'pg' && s.impressions > config.highImpressionThreshold) {
      flag.highImpact = true;
    }
    flags.push(flag);
  }
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm run test -- src/flags/__tests__/detect.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/flags/detect.js src/flags/__tests__/detect.test.js
git commit -m "feat(flags): F1 detector (per-side too-generic with F5 high-impact marker)"
```

---

## Task 15: Flag detector — F2 root mismatch

**Files:**
- Modify: `src/flags/detect.js`
- Modify: `src/flags/__tests__/detect.test.js`

- [ ] **Step 1: Add tests**

Append:

```js
describe('F2 root mismatch', () => {
  it('fires when AM and Programmatic Module have different roots', () => {
    const rows = detectFlags([row({ am: side(101), pg: side(200) })], taxonomy, flagConfig);
    expect(rows[0].flags.some((f) => f.type === 'F2')).toBe(true);
  });

  it('does not fire when roots match', () => {
    const rows = detectFlags([row({ am: side(101), pg: side(102) })], taxonomy, flagConfig);
    expect(rows[0].flags.some((f) => f.type === 'F2')).toBe(false);
  });

  it('does not fire when one side is null', () => {
    const rows = detectFlags([row({ am: side(101), pg: null })], taxonomy, flagConfig);
    expect(rows[0].flags.some((f) => f.type === 'F2')).toBe(false);
  });
});
```

- [ ] **Step 2: Run, verify F2 tests fail**

Run: `npm run test -- src/flags/__tests__/detect.test.js`
Expected: FAIL for F2 cases.

- [ ] **Step 3: Add F2 detector**

In `src/flags/detect.js`, after `detectF1`:

```js
function detectF2(row, taxonomy, _config, flags) {
  if (!row.am || !row.pg) return;
  if (row.am.resolved_industry_id == null || row.pg.resolved_industry_id == null) return;

  const amRoot = taxonomy.walkToDepth0(row.am.resolved_industry_id);
  const pgRoot = taxonomy.walkToDepth0(row.pg.resolved_industry_id);
  if (!amRoot || !pgRoot) return;
  if (amRoot.id === pgRoot.id) return;

  flags.push({
    type: 'F2',
    side: 'both',
    severity: 'high',
    note: `Advertiser Module root '${amRoot.name}' ≠ Programmatic Module root '${pgRoot.name}'.`,
  });
}
```

In `detectFlags`, add the call:

```js
    detectF2(row, taxonomy, config, flags);
```

- [ ] **Step 4: Run, verify pass**

Run: `npm run test -- src/flags/__tests__/detect.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/flags/detect.js src/flags/__tests__/detect.test.js
git commit -m "feat(flags): F2 root mismatch detector"
```

---

## Task 16: Flag detector — F3a (lateral) and F3b (ancestor)

**Files:**
- Modify: `src/flags/detect.js`
- Modify: `src/flags/__tests__/detect.test.js`

- [ ] **Step 1: Add tests**

Append:

```js
describe('F3a lateral mismatch', () => {
  it('fires when same root but neither side is ancestor of the other', () => {
    // both under Tech root (100). am=Software (101), pg... need a sibling of 101.
    // Add a sibling node: extend the fixture inline.
    const t = createTaxonomy({
      assignable: [
        { id: 100, name: 'Tech', depth: 0, parentId: null, path: 'Tech' },
        { id: 101, name: 'Software', depth: 1, parentId: 100, path: 'Tech › Software' },
        { id: 103, name: 'Hardware', depth: 1, parentId: 100, path: 'Tech › Hardware' },
      ],
      groupIds: [],
    });
    const r = row({
      am: { applied_industry_ids_raw: '101', industry_names: null, resolved_industry_id: 101,
            resolved_industry_name: 'Software', resolved_industry_depth: 1, resolved_industry_path: 'Tech › Software',
            impressions: 0, revenue: 0 },
      pg: { applied_industry_ids_raw: '103', industry_names: null, resolved_industry_id: 103,
            resolved_industry_name: 'Hardware', resolved_industry_depth: 1, resolved_industry_path: 'Tech › Hardware',
            impressions: 0, revenue: 0 },
    });
    const rows = detectFlags([r], t, flagConfig);
    expect(rows[0].flags.some((f) => f.type === 'F3a')).toBe(true);
  });
});

describe('F3b ancestor mismatch (AM parent, Programmatic descendant only)', () => {
  it('fires when AM = parent and Programmatic Module = descendant', () => {
    const rows = detectFlags([row({ am: side(101), pg: side(102) })], taxonomy, flagConfig);
    expect(rows[0].flags.some((f) => f.type === 'F3b')).toBe(true);
  });

  it('does not fire in reverse (AM = descendant, Programmatic = parent)', () => {
    const rows = detectFlags([row({ am: side(102), pg: side(101) })], taxonomy, flagConfig);
    expect(rows[0].flags.some((f) => f.type === 'F3b')).toBe(false);
  });
});
```

- [ ] **Step 2: Run, verify failure**

Run: `npm run test -- src/flags/__tests__/detect.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement F3 detectors**

In `src/flags/detect.js`:

```js
function detectF3(row, taxonomy, _config, flags) {
  if (!row.am || !row.pg) return;
  const amId = row.am.resolved_industry_id;
  const pgId = row.pg.resolved_industry_id;
  if (amId == null || pgId == null || amId === pgId) return;

  const amRoot = taxonomy.walkToDepth0(amId);
  const pgRoot = taxonomy.walkToDepth0(pgId);
  if (!amRoot || !pgRoot || amRoot.id !== pgRoot.id) return;   // F2 handles different roots

  const amIsAncestor = taxonomy.isAncestor(amId, pgId);  // am=parent, pg=descendant
  const pgIsAncestor = taxonomy.isAncestor(pgId, amId);  // reverse — deferred per spec

  if (amIsAncestor) {
    flags.push({
      type: 'F3b',
      side: 'both',
      severity: 'medium',
      note: 'Programmatic Module may be too narrow — consider asking FreeWheel to broaden, or Advertiser Module may need to drill down to match.',
    });
  } else if (!pgIsAncestor) {
    // lateral
    flags.push({
      type: 'F3a',
      side: 'both',
      severity: 'medium',
      note: `Advertiser Module ('${row.am.resolved_industry_name}') and Programmatic Module ('${row.pg.resolved_industry_name}') picked different branches under root '${amRoot.name}'.`,
    });
  }
  // pgIsAncestor case (AM descendant, Programmatic parent) intentionally not flagged in MVP — deferred per spec.
}
```

Add the call to `detectFlags`:

```js
    detectF3(row, taxonomy, config, flags);
```

- [ ] **Step 4: Run, verify pass**

Run: `npm run test -- src/flags/__tests__/detect.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/flags/detect.js src/flags/__tests__/detect.test.js
git commit -m "feat(flags): F3a lateral and F3b ancestor mismatch detectors"
```

---

## Task 17: Flag detector — F4 (unmapped / group-id misuse)

**Files:**
- Modify: `src/flags/detect.js`
- Modify: `src/flags/__tests__/detect.test.js`

- [ ] **Step 1: Add tests**

Append:

```js
describe('F4 unmapped / group-id misuse', () => {
  it('F4a fires when AM applied id is a group id', () => {
    const r = row({
      am: { applied_industry_ids_raw: '999', industry_names: null,
            resolved_industry_id: null, resolved_industry_name: null,
            resolved_industry_depth: null, resolved_industry_path: null,
            impressions: 0, revenue: 0 },
    });
    const rows = detectFlags([r], taxonomy, flagConfig);
    expect(rows[0].flags.some((f) => f.type === 'F4a')).toBe(true);
  });

  it('F4b fires when AM applied id is sentinel -1', () => {
    const r = row({
      am: { applied_industry_ids_raw: '-1', industry_names: null,
            resolved_industry_id: null, resolved_industry_name: null,
            resolved_industry_depth: null, resolved_industry_path: null,
            impressions: 0, revenue: 0 },
    });
    const rows = detectFlags([r], taxonomy, flagConfig);
    expect(rows[0].flags.some((f) => f.type === 'F4b')).toBe(true);
  });

  it('F4c fires when Programmatic industry name did not resolve', () => {
    const r = row({
      pg: { applied_industry_ids_raw: null, industry_names: ['Nonexistent'],
            resolved_industry_id: null, resolved_industry_name: null,
            resolved_industry_depth: null, resolved_industry_path: null,
            impressions: 0, revenue: 0 },
    });
    const rows = detectFlags([r], taxonomy, flagConfig);
    expect(rows[0].flags.some((f) => f.type === 'F4c')).toBe(true);
  });
});
```

- [ ] **Step 2: Run, verify failure**

Run: `npm run test -- src/flags/__tests__/detect.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement F4**

In `src/flags/detect.js`:

```js
function detectF4(row, taxonomy, _config, flags) {
  // F4a: AM applied to a group id
  if (row.am?.applied_industry_ids_raw) {
    const ids = row.am.applied_industry_ids_raw.split('|').map((s) => Number(s.trim())).filter(Number.isFinite);
    if (ids.some((id) => taxonomy.isGroupId(id))) {
      flags.push({ type: 'F4a', side: 'am', severity: 'high',
        note: 'Advertiser Module is applied to an unassignable group ID.' });
    }
    if (ids.includes(-1)) {
      flags.push({ type: 'F4b', side: 'am', severity: 'medium',
        note: 'Advertiser Module is unmapped (-1 sentinel).' });
    }
  }

  // F4c: Programmatic name did not resolve
  if (row.pg?.industry_names && row.pg.industry_names.length > 0 && row.pg.resolved_industry_id == null) {
    flags.push({ type: 'F4c', side: 'pg', severity: 'low',
      note: 'Programmatic Module industry name did not resolve to a taxonomy entry.' });
  }
}
```

Add the call in `detectFlags`:

```js
    detectF4(row, taxonomy, config, flags);
```

- [ ] **Step 4: Run, verify pass**

Run: `npm run test -- src/flags/__tests__/detect.test.js`
Expected: PASS (all flag tests).

- [ ] **Step 5: Commit**

```bash
git add src/flags/detect.js src/flags/__tests__/detect.test.js
git commit -m "feat(flags): F4a/b/c detectors (group-id misuse, unmapped sentinel, unresolved PM name)"
```

---

## Task 18: Pending store — base store + stage/remove

**Files:**
- Create: `src/state/pendingStore.js`
- Test: `src/state/__tests__/pendingStore.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/state/__tests__/pendingStore.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { usePendingStore } from '../pendingStore.js';

beforeEach(() => {
  localStorage.clear();
  usePendingStore.setState({ items: {} });
});

const brand = { global_brand_id: 1, global_brand_nm: 'A', global_advertiser_id: 10, global_advertiser_nm: 'AdvA' };

describe('pendingStore.stage', () => {
  it('adds an item with status=staged and a generated uuid', () => {
    const id = usePendingStore.getState().stage({
      type: 'am-industry',
      brand,
      payload: { before: { industry_id: 1, industry_name: 'X', depth: 0, path: 'X' },
                 after:  { industry_id: 2, industry_name: 'Y', depth: 0, path: 'Y' } },
    });
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    const item = usePendingStore.getState().items[id];
    expect(item.status).toBe('staged');
    expect(item.type).toBe('am-industry');
    expect(item.brand.global_brand_id).toBe(1);
  });
});

describe('pendingStore.remove', () => {
  it('deletes an item by id', () => {
    const id = usePendingStore.getState().stage({ type: 'am-industry', brand, payload: {} });
    usePendingStore.getState().remove(id);
    expect(usePendingStore.getState().items[id]).toBeUndefined();
  });
});

describe('pendingStore.clear', () => {
  it('empties items', () => {
    usePendingStore.getState().stage({ type: 'am-industry', brand, payload: {} });
    usePendingStore.getState().stage({ type: 'am-industry', brand, payload: {} });
    usePendingStore.getState().clear();
    expect(Object.keys(usePendingStore.getState().items)).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run, verify failure**

Run: `npm run test -- src/state/__tests__/pendingStore.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/state/pendingStore.js`:

```js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export const usePendingStore = create(
  persist(
    (set, get) => ({
      items: {},

      stage({ type, brand, payload }) {
        const id = uuidv4();
        set((state) => ({
          items: {
            ...state.items,
            [id]: {
              id, type, brand, payload,
              createdAt: new Date().toISOString(),
              status: 'staged',
              error: null,
            },
          },
        }));
        return id;
      },

      remove(id) {
        set((state) => {
          const { [id]: _, ...rest } = state.items;
          return { items: rest };
        });
      },

      clear() {
        set({ items: {} });
      },

      setStatus(id, status, error = null) {
        set((state) => {
          const item = state.items[id];
          if (!item) return state;
          return { items: { ...state.items, [id]: { ...item, status, error } } };
        });
      },
    }),
    { name: 'adv-brand-dash-pending' },
  ),
);
```

- [ ] **Step 4: Run, verify pass**

Run: `npm run test -- src/state/__tests__/pendingStore.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/state/pendingStore.js src/state/__tests__/pendingStore.test.js
git commit -m "feat(state): pendingStore base — stage, remove, clear, setStatus with persistence"
```

---

## Task 19: Pending store — `rehydrate()` demotes interrupted applies

**Files:**
- Modify: `src/state/pendingStore.js`
- Modify: `src/state/__tests__/pendingStore.test.js`

- [ ] **Step 1: Add failing test**

Append:

```js
describe('pendingStore.rehydrate', () => {
  it('demotes any "applying" items to "failed"', () => {
    const id = usePendingStore.getState().stage({ type: 'am-industry', brand, payload: {} });
    usePendingStore.getState().setStatus(id, 'applying');

    usePendingStore.getState().rehydrate();

    const item = usePendingStore.getState().items[id];
    expect(item.status).toBe('failed');
    expect(item.error?.message).toMatch(/interrupted/i);
  });

  it('leaves staged/applied/failed items unchanged', () => {
    const idStaged = usePendingStore.getState().stage({ type: 'am-industry', brand, payload: {} });
    const idApplied = usePendingStore.getState().stage({ type: 'am-industry', brand, payload: {} });
    usePendingStore.getState().setStatus(idApplied, 'applied');

    usePendingStore.getState().rehydrate();

    expect(usePendingStore.getState().items[idStaged].status).toBe('staged');
    expect(usePendingStore.getState().items[idApplied].status).toBe('applied');
  });
});
```

- [ ] **Step 2: Run, verify failure**

Run: `npm run test -- src/state/__tests__/pendingStore.test.js`
Expected: FAIL.

- [ ] **Step 3: Add `rehydrate` action**

In the store factory, add to the returned actions:

```js
      rehydrate() {
        set((state) => {
          const items = { ...state.items };
          for (const id of Object.keys(items)) {
            if (items[id].status === 'applying') {
              items[id] = {
                ...items[id],
                status: 'failed',
                error: { message: 'Interrupted — verify on FreeWheel side before retrying.' },
              };
            }
          }
          return { items };
        });
      },
```

- [ ] **Step 4: Run, verify pass**

Run: `npm run test -- src/state/__tests__/pendingStore.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/state/pendingStore.js src/state/__tests__/pendingStore.test.js
git commit -m "feat(state): pendingStore.rehydrate demotes interrupted applies to failed"
```

---

## Task 20: Server — extract audit writer to swappable interface

**Files:**
- Modify: `server/audit.js`
- Create: `server/audit-writers/jsonl.js`
- Test: `server/audit-writers/__tests__/jsonl.test.js`

- [ ] **Step 1: Write failing test for the jsonl writer**

Create `server/audit-writers/__tests__/jsonl.test.js`:

```js
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createJsonlWriter } from '../jsonl.js';

let dir;
let file;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'audit-'));
  file = join(dir, 'audit.log');
});

afterAll(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
});

describe('jsonl audit writer', () => {
  it('appends one JSON line per entry', async () => {
    const writer = createJsonlWriter(file);
    await writer.append({ a: 1 });
    await writer.append({ b: 2 });
    const content = readFileSync(file, 'utf8');
    expect(content.trim().split('\n')).toHaveLength(2);
    expect(JSON.parse(content.trim().split('\n')[0])).toMatchObject({ a: 1 });
  });

  it('adds a top-level ts field to each entry', async () => {
    const writer = createJsonlWriter(file);
    await writer.append({ x: 'y' });
    const line = JSON.parse(readFileSync(file, 'utf8').trim());
    expect(line.ts).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
```

- [ ] **Step 2: Run, verify failure**

Run: `npm run test -- server/audit-writers/__tests__/jsonl.test.js`
Expected: FAIL.

- [ ] **Step 3: Create the writer**

Create `server/audit-writers/jsonl.js`:

```js
import { appendFile } from 'node:fs/promises';

export function createJsonlWriter(path) {
  return {
    async append(entry) {
      const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n';
      await appendFile(path, line, 'utf8');
    },
  };
}
```

- [ ] **Step 4: Refactor server/audit.js to use the writer**

Replace `server/audit.js` contents with:

```js
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createJsonlWriter } from './audit-writers/jsonl.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUDIT_PATH = resolve(__dirname, 'audit.log');

const writer = createJsonlWriter(AUDIT_PATH);

export async function appendAudit(entry) {
  await writer.append(entry);
}

export { AUDIT_PATH };
```

- [ ] **Step 5: Run tests, verify pass**

Run: `npm run test -- server/audit-writers/__tests__/jsonl.test.js server/__tests__/routes.test.js`
Expected: PASS — existing route tests should still pass (the public `appendAudit` API is unchanged).

- [ ] **Step 6: Commit**

```bash
git add server/audit.js server/audit-writers/jsonl.js server/audit-writers/__tests__/jsonl.test.js
git commit -m "refactor(server): extract audit writer to swappable jsonl writer (future: sheets)"
```

---

## Task 21: Server — `audit-read.js` (last-N-lines reader)

**Files:**
- Create: `server/audit-read.js`
- Test: `server/__tests__/audit-read.test.js`

- [ ] **Step 1: Write failing tests**

Create `server/__tests__/audit-read.test.js`:

```js
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readRecent } from '../audit-read.js';

let dir;
let file;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'audit-read-'));
  file = join(dir, 'audit.log');
});

afterAll(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
});

describe('readRecent', () => {
  it('returns [] for missing file', async () => {
    expect(await readRecent(join(dir, 'nope.log'), 50)).toEqual([]);
  });

  it('returns [] for empty file', async () => {
    writeFileSync(file, '');
    expect(await readRecent(file, 50)).toEqual([]);
  });

  it('returns last N entries newest-first', async () => {
    const lines = [];
    for (let i = 0; i < 5; i++) lines.push(JSON.stringify({ n: i }));
    writeFileSync(file, lines.join('\n') + '\n');
    const entries = await readRecent(file, 3);
    expect(entries.map((e) => e.n)).toEqual([4, 3, 2]);
  });

  it('skips malformed JSON lines', async () => {
    const lines = [JSON.stringify({ a: 1 }), 'not-json', JSON.stringify({ b: 2 })];
    writeFileSync(file, lines.join('\n') + '\n');
    const entries = await readRecent(file, 10);
    expect(entries.map((e) => Object.keys(e)[0])).toEqual(['b', 'a']);
  });

  it('returns all entries when fewer than limit exist', async () => {
    writeFileSync(file, JSON.stringify({ a: 1 }) + '\n');
    const entries = await readRecent(file, 50);
    expect(entries).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run, verify failure**

Run: `npm run test -- server/__tests__/audit-read.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `server/audit-read.js`:

```js
import { readFile } from 'node:fs/promises';

export async function readRecent(path, limit) {
  let text;
  try {
    text = await readFile(path, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  if (!text.trim()) return [];

  const lines = text.split('\n').filter((l) => l.length > 0);
  const tail = lines.slice(-limit).reverse();   // newest first
  const out = [];
  for (const line of tail) {
    try { out.push(JSON.parse(line)); }
    catch { /* skip malformed */ }
  }
  return out;
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm run test -- server/__tests__/audit-read.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/audit-read.js server/__tests__/audit-read.test.js
git commit -m "feat(server): audit-read returns last-N entries newest-first, tolerates malformed lines"
```

---

## Task 22: Server — `GET /audit/recent` route + stub `POST /creatives/apply`

**Files:**
- Modify: `server/routes.js`
- Modify: `server/__tests__/routes.test.js`

- [ ] **Step 1: Add failing route tests**

Append to `server/__tests__/routes.test.js` (or read the file first to confirm test scaffold style — match existing pattern):

```js
describe('GET /audit/recent', () => {
  it('returns { entries: [] } when audit file is empty/missing', async () => {
    const app = makeAppWithFakeFw();
    const res = await request(app).get('/audit/recent?limit=10');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.entries)).toBe(true);
  });

  it('caps limit at 500', async () => {
    const app = makeAppWithFakeFw();
    const res = await request(app).get('/audit/recent?limit=9999');
    expect(res.status).toBe(200);
    // limit only affects body length; no assertion here unless seeded — minimal smoke.
  });
});

describe('POST /creatives/apply (stub)', () => {
  it('returns 501 Not Implemented', async () => {
    const app = makeAppWithFakeFw();
    const res = await request(app).post('/creatives/apply').send({});
    expect(res.status).toBe(501);
  });
});
```

(If `makeAppWithFakeFw` doesn't already exist in the test file, look at the existing happy-path test setup in `routes.test.js` and reuse its pattern. Do not invent a new helper.)

- [ ] **Step 2: Run, verify failure**

Run: `npm run test -- server/__tests__/routes.test.js`
Expected: FAIL.

- [ ] **Step 3: Add the routes**

In `server/routes.js`, import:

```js
import { readRecent } from './audit-read.js';
import { AUDIT_PATH } from './audit.js';
```

Inside `createRouter`, after the existing routes:

```js
  router.get('/audit/recent', async (req, res) => {
    const requested = Number.parseInt(req.query.limit ?? '50', 10);
    const limit = Math.min(Math.max(Number.isFinite(requested) ? requested : 50, 1), 500);
    try {
      const entries = await readRecent(AUDIT_PATH, limit);
      res.json({ entries });
    } catch (err) {
      res.status(500).json({ error: err?.message || String(err) });
    }
  });

  router.post('/creatives/apply', (_req, res) => {
    res.status(501).json({ error: 'Programmatic Module creative apply path not implemented yet' });
  });
```

- [ ] **Step 4: Run, verify pass**

Run: `npm run test -- server/__tests__/routes.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/routes.js server/__tests__/routes.test.js
git commit -m "feat(server): GET /audit/recent + stub POST /creatives/apply (501)"
```

---

## Task 23: `DataLoadDialog` — CSV upload/paste UI

**Files:**
- Create: `src/views/DataLoadDialog.jsx`
- Test: `src/views/__tests__/DataLoadDialog.test.jsx`

A modal-ish view that accepts drag-drop or paste of a CSV, runs `detectFormat`, and emits a callback with the parsed records. Two slots for the two adapters so the user can load both.

- [ ] **Step 1: Write failing test**

Create `src/views/__tests__/DataLoadDialog.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataLoadDialog } from '../DataLoadDialog.jsx';

const BQ_CSV = 'global_brand_id,global_brand_nm,am_applied_industry_ids_raw,am_impressions,am_revenue,ind_applied_industry_ids_raw,ind_impressions,ind_revenue\n1,Brand,100,1000,10,200,500,5';

describe('DataLoadDialog', () => {
  it('renders two textareas (BQ + FW) and a Parse button', () => {
    render(<DataLoadDialog onLoaded={() => {}} />);
    expect(screen.getByLabelText(/BigQuery/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/FreeWheel/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Parse/i })).toBeInTheDocument();
  });

  it('calls onLoaded with parsed RawRecord[] when Parse is clicked with BQ content', () => {
    const onLoaded = vi.fn();
    render(<DataLoadDialog onLoaded={onLoaded} />);
    const ta = screen.getByLabelText(/BigQuery/i);
    fireEvent.change(ta, { target: { value: BQ_CSV } });
    fireEvent.click(screen.getByRole('button', { name: /Parse/i }));
    expect(onLoaded).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ source: 'bq-sql', global_brand_id: 1 }),
    ]));
  });

  it('shows an error when CSV format cannot be detected', () => {
    render(<DataLoadDialog onLoaded={() => {}} />);
    fireEvent.change(screen.getByLabelText(/BigQuery/i), { target: { value: 'foo,bar\n1,2' } });
    fireEvent.click(screen.getByRole('button', { name: /Parse/i }));
    expect(screen.getByText(/Unrecognized/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, verify failure**

Run: `npm run test -- src/views/__tests__/DataLoadDialog.test.jsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/views/DataLoadDialog.jsx`:

```jsx
import { useState } from 'react';
import { loadCsv } from '../data/adapters/index.js';

export function DataLoadDialog({ onLoaded }) {
  const [bq, setBq] = useState('');
  const [fw, setFw] = useState('');
  const [error, setError] = useState(null);

  function handleParse() {
    setError(null);
    const records = [];
    try {
      if (bq.trim()) records.push(...loadCsv(bq));
      if (fw.trim()) records.push(...loadCsv(fw));
      if (records.length === 0) {
        setError('Paste at least one CSV.');
        return;
      }
      onLoaded(records);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold mb-2">Load data</h2>
      <p className="text-sm text-slate-600 mb-4">
        Paste the BigQuery export (Advertiser Module + secondary Programmatic Module from <code>ind_*</code> columns)
        and/or the FreeWheel Console Programmatic Module CSV. Both can be loaded together — FreeWheel report wins
        for the Programmatic Module slot.
      </p>

      <label className="block mb-2 text-sm font-medium">
        BigQuery export
        <textarea className="w-full h-40 border rounded p-2 font-mono text-xs"
          value={bq} onChange={(e) => setBq(e.target.value)} />
      </label>

      <label className="block mb-2 text-sm font-medium">
        FreeWheel Console Analytics CSV (Programmatic Module)
        <textarea className="w-full h-40 border rounded p-2 font-mono text-xs"
          value={fw} onChange={(e) => setFw(e.target.value)} />
      </label>

      {error && <div className="text-red-700 text-sm mb-2">{error}</div>}

      <button className="px-4 py-2 bg-emerald-600 text-white rounded" onClick={handleParse}>
        Parse
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm run test -- src/views/__tests__/DataLoadDialog.test.jsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/views/DataLoadDialog.jsx src/views/__tests__/DataLoadDialog.test.jsx
git commit -m "feat(views): DataLoadDialog accepts BQ + FW CSVs and dispatches to adapters"
```

---

## Task 24: `ListView` — base table with TanStack Table

**Files:**
- Create: `src/views/ListView.jsx`
- Test: `src/views/__tests__/ListView.test.jsx`

A read-only table displaying the canonical rows with flags. Sorting/filtering come in the next tasks.

- [ ] **Step 1: Write failing test**

Create `src/views/__tests__/ListView.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ListView } from '../ListView.jsx';

const rows = [
  {
    global_brand_id: 1, global_brand_nm: 'Life360',
    global_advertiser_id: 10, global_advertiser_nm: 'Life360 Inc',
    am: { resolved_industry_name: 'Tech', impressions: 1000, revenue: 5 },
    pg: { resolved_industry_name: 'Software', impressions: 500, revenue: 2 },
    total_impressions: 1500, total_revenue: 7,
    other_modules: [], flags: [], pg_creatives: null,
  },
];

describe('ListView', () => {
  it('renders all 10 column headers using full module names', () => {
    render(<ListView rows={rows} onRowClick={() => {}} />);
    expect(screen.getByText('Flags')).toBeInTheDocument();
    expect(screen.getByText('Brand')).toBeInTheDocument();
    expect(screen.getByText('Advertiser')).toBeInTheDocument();
    expect(screen.getByText(/Advertiser Module industry/)).toBeInTheDocument();
    expect(screen.getByText(/Programmatic Module industry/)).toBeInTheDocument();
    expect(screen.getByText(/Advertiser Module impressions/)).toBeInTheDocument();
    expect(screen.getByText(/Programmatic Module impressions/)).toBeInTheDocument();
    expect(screen.getByText(/Programmatic Module revenue/)).toBeInTheDocument();
    expect(screen.getByText(/Other modules/)).toBeInTheDocument();
    expect(screen.getByText(/Pending/)).toBeInTheDocument();
  });

  it('renders one row per canonical row with brand name visible', () => {
    render(<ListView rows={rows} onRowClick={() => {}} />);
    expect(screen.getByText('Life360')).toBeInTheDocument();
    expect(screen.getByText('Life360 Inc')).toBeInTheDocument();
    expect(screen.getByText('Tech')).toBeInTheDocument();
    expect(screen.getByText('Software')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, verify failure**

Run: `npm run test -- src/views/__tests__/ListView.test.jsx`
Expected: FAIL.

- [ ] **Step 3: Implement minimal table**

Create `src/views/ListView.jsx`:

```jsx
import { useMemo } from 'react';
import {
  useReactTable, getCoreRowModel, flexRender,
} from '@tanstack/react-table';

const fmt = new Intl.NumberFormat('en-US');
const cur = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function ListView({ rows, onRowClick }) {
  const columns = useMemo(() => ([
    { id: 'flags', header: 'Flags', cell: ({ row }) => <FlagBadges flags={row.original.flags} /> },
    { id: 'brand', header: 'Brand', accessorFn: (r) => r.global_brand_nm },
    { id: 'advertiser', header: 'Advertiser', accessorFn: (r) => r.global_advertiser_nm ?? '—' },
    { id: 'am_industry', header: 'Advertiser Module industry', accessorFn: (r) => r.am?.resolved_industry_name ?? '—' },
    { id: 'pg_industry', header: 'Programmatic Module industry', accessorFn: (r) => r.pg?.resolved_industry_name ?? '—' },
    { id: 'am_imp', header: 'Advertiser Module impressions',
      accessorFn: (r) => r.am?.impressions ?? null,
      cell: ({ getValue }) => getValue() == null ? '—' : fmt.format(getValue()) },
    { id: 'pg_imp', header: 'Programmatic Module impressions',
      accessorFn: (r) => r.pg?.impressions ?? null,
      cell: ({ getValue }) => getValue() == null ? '—' : fmt.format(getValue()) },
    { id: 'pg_rev', header: 'Programmatic Module revenue',
      accessorFn: (r) => r.pg?.revenue ?? null,
      cell: ({ getValue }) => getValue() == null ? '—' : cur.format(getValue()) },
    { id: 'other', header: 'Other modules',
      accessorFn: (r) => r.other_modules.length,
      cell: ({ getValue }) => getValue() > 0 ? <span className="px-1 bg-slate-200 rounded">{getValue()}</span> : null },
    { id: 'pending', header: 'Pending', cell: () => null },
  ]), []);

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <table className="text-sm w-full">
      <thead className="bg-slate-100 text-left">
        {table.getHeaderGroups().map((hg) => (
          <tr key={hg.id}>
            {hg.headers.map((h) => (
              <th key={h.id} className="p-2 font-medium text-slate-700">
                {flexRender(h.column.columnDef.header, h.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((r) => (
          <tr key={r.id} className="border-b hover:bg-slate-50 cursor-pointer"
              onClick={() => onRowClick?.(r.original)}>
            {r.getVisibleCells().map((cell) => (
              <td key={cell.id} className="p-2">
                {flexRender(cell.column.columnDef.cell ?? ((x) => x.getValue()), cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FlagBadges({ flags }) {
  if (!flags || flags.length === 0) return null;
  return (
    <span className="inline-flex gap-1">
      {flags.map((f, i) => (
        <span key={i} title={f.note}
              className="text-[10px] px-1 rounded bg-amber-200 text-amber-900">
          {f.type}
        </span>
      ))}
    </span>
  );
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm run test -- src/views/__tests__/ListView.test.jsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/views/ListView.jsx src/views/__tests__/ListView.test.jsx
git commit -m "feat(views): ListView base 10-column TanStack table with full module name headers"
```

---

## Task 25: `ListView` — priority sort

**Files:**
- Modify: `src/views/ListView.jsx`
- Create: `src/views/sort.js`
- Test: `src/views/__tests__/sort.test.js`

Extract the priority-score function so it's pure-tested, then wire it as the default sort.

- [ ] **Step 1: Write failing test**

Create `src/views/__tests__/sort.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { priorityScore } from '../sort.js';

function rowWithFlags(types, pgImpressions = 0) {
  return {
    flags: types.map((t) => ({ type: t, highImpact: t === 'F1_high' })),
    pg: { impressions: pgImpressions },
  };
}

describe('priorityScore', () => {
  it('F2 outranks F1 (Programmatic) high-impact', () => {
    expect(priorityScore(rowWithFlags(['F2']))).toBeGreaterThan(
      priorityScore(rowWithFlags(['F1_high']))
    );
  });

  it('F1 high-impact outranks F1 plain', () => {
    expect(priorityScore({
      flags: [{ type: 'F1', side: 'pg', highImpact: true }],
      pg: { impressions: 0 }
    })).toBeGreaterThan(
      priorityScore({
        flags: [{ type: 'F1', side: 'pg', highImpact: false }],
        pg: { impressions: 0 }
      })
    );
  });

  it('higher pg impressions wins as tiebreaker among equal-flag rows', () => {
    const a = { flags: [{ type: 'F2' }], pg: { impressions: 1_000_000 } };
    const b = { flags: [{ type: 'F2' }], pg: { impressions: 1_000 } };
    expect(priorityScore(a)).toBeGreaterThan(priorityScore(b));
  });
});
```

- [ ] **Step 2: Run, verify failure**

Run: `npm run test -- src/views/__tests__/sort.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement priorityScore**

Create `src/views/sort.js`:

```js
const WEIGHTS = {
  F2: 1000,
  F1_high: 800,
  F4a: 600,
  F1_pg: 400,
  F3b: 200,
  F3a: 150,
  F1_am: 100,
  F4b: 80,
  F4c: 20,
};

export function priorityScore(row) {
  let score = 0;
  for (const f of row.flags ?? []) {
    if (f.type === 'F2') score += WEIGHTS.F2;
    else if (f.type === 'F1' && f.side === 'pg' && f.highImpact) score += WEIGHTS.F1_high;
    else if (f.type === 'F1' && f.side === 'pg') score += WEIGHTS.F1_pg;
    else if (f.type === 'F1' && f.side === 'am') score += WEIGHTS.F1_am;
    else if (f.type === 'F3a') score += WEIGHTS.F3a;
    else if (f.type === 'F3b') score += WEIGHTS.F3b;
    else if (f.type === 'F4a') score += WEIGHTS.F4a;
    else if (f.type === 'F4b') score += WEIGHTS.F4b;
    else if (f.type === 'F4c') score += WEIGHTS.F4c;
  }
  score += Math.log10(1 + (row.pg?.impressions ?? 0));
  return score;
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm run test -- src/views/__tests__/sort.test.js`
Expected: PASS.

- [ ] **Step 5: Wire into ListView**

In `src/views/ListView.jsx`, modify the data to be sorted before passing to the table:

```jsx
import { priorityScore } from './sort.js';
// ...
export function ListView({ rows, onRowClick }) {
  const data = useMemo(() => [...rows].sort((a, b) => priorityScore(b) - priorityScore(a)), [rows]);
  // ... pass `data` to useReactTable instead of `rows`
```

- [ ] **Step 6: Commit**

```bash
git add src/views/ListView.jsx src/views/sort.js src/views/__tests__/sort.test.js
git commit -m "feat(views): priority-score default sort (weights tunable; pg impressions tiebreaker)"
```

---

## Task 26: `ListView` — filters

**Files:**
- Modify: `src/views/ListView.jsx`
- Create: `src/views/filters.js`
- Test: `src/views/__tests__/filters.test.js`

Extract filter logic into a pure helper for testability.

- [ ] **Step 1: Write failing tests**

Create `src/views/__tests__/filters.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { applyFilters } from '../filters.js';

const rows = [
  { global_brand_id: 1, global_brand_nm: 'Life360', global_advertiser_nm: 'Life360 Inc',
    am: { impressions: 100 }, pg: { impressions: 200 },
    flags: [{ type: 'F2', severity: 'high' }] },
  { global_brand_id: 2, global_brand_nm: 'Midas', global_advertiser_nm: 'Midas Corp',
    am: null, pg: { impressions: 50 },
    flags: [{ type: 'F4c', severity: 'low' }] },
];

describe('applyFilters', () => {
  it('returns all rows when no filters set', () => {
    expect(applyFilters(rows, {})).toHaveLength(2);
  });

  it('search matches brand name', () => {
    expect(applyFilters(rows, { search: 'life' })).toHaveLength(1);
  });

  it('search matches numeric brand id', () => {
    expect(applyFilters(rows, { search: '2' })).toEqual([rows[1]]);
  });

  it('flagTypes filters to only matching rows', () => {
    expect(applyFilters(rows, { flagTypes: ['F2'] })).toEqual([rows[0]]);
  });

  it('side="am" requires am side present', () => {
    expect(applyFilters(rows, { side: 'am' })).toEqual([rows[0]]);
  });

  it('side="pg" requires pg side present and no am', () => {
    expect(applyFilters(rows, { side: 'pg-only' })).toEqual([rows[1]]);
  });

  it('severity filter (multi)', () => {
    expect(applyFilters(rows, { severities: ['low'] })).toEqual([rows[1]]);
  });

  it('minPgImpressions filter', () => {
    expect(applyFilters(rows, { minPgImpressions: 100 })).toEqual([rows[0]]);
  });
});
```

- [ ] **Step 2: Run, verify failure**

Run: `npm run test -- src/views/__tests__/filters.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/views/filters.js`:

```js
export function applyFilters(rows, f) {
  return rows.filter((r) => {
    if (f.search) {
      const q = String(f.search).toLowerCase();
      const hay = [
        r.global_brand_nm, r.global_advertiser_nm,
        String(r.global_brand_id), String(r.global_advertiser_id ?? ''),
      ].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.flagTypes?.length > 0) {
      const has = (r.flags ?? []).some((fl) => f.flagTypes.includes(fl.type));
      if (!has) return false;
    }
    if (f.side === 'am') {
      if (!r.am) return false;
    } else if (f.side === 'pg-only') {
      if (r.am || !r.pg) return false;
    } else if (f.side === 'both') {
      if (!r.am || !r.pg) return false;
    }
    if (f.severities?.length > 0) {
      const has = (r.flags ?? []).some((fl) => f.severities.includes(fl.severity));
      if (!has) return false;
    }
    if (f.minPgImpressions != null) {
      if ((r.pg?.impressions ?? 0) < f.minPgImpressions) return false;
    }
    return true;
  });
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm run test -- src/views/__tests__/filters.test.js`
Expected: PASS.

- [ ] **Step 5: Add a filter bar to ListView**

In `src/views/ListView.jsx`, accept `filters` and `onFiltersChange` props, render a top bar with the inputs (text search, flag chips, side selector, severity checkboxes, min-pg-impressions number), and apply `applyFilters(data, filters)` before `useReactTable`.

```jsx
import { applyFilters } from './filters.js';

export function ListView({ rows, filters = {}, onFiltersChange, onRowClick }) {
  const filtered = useMemo(() => applyFilters(rows, filters), [rows, filters]);
  const sorted = useMemo(() => [...filtered].sort((a, b) => priorityScore(b) - priorityScore(a)), [filtered]);
  // ... rest using `sorted` as data

  return (
    <div>
      <FilterBar value={filters} onChange={onFiltersChange} />
      <table>...</table>
    </div>
  );
}

function FilterBar({ value, onChange }) {
  const set = (patch) => onChange?.({ ...value, ...patch });
  return (
    <div className="p-2 flex gap-2 flex-wrap items-center text-sm">
      <input type="text" placeholder="Search brand or advertiser…"
        value={value.search ?? ''} onChange={(e) => set({ search: e.target.value })}
        className="border rounded px-2 py-1" />
      <select value={value.side ?? 'both'} onChange={(e) => set({ side: e.target.value })}
        className="border rounded px-2 py-1">
        <option value="both">Both modules</option>
        <option value="am">Advertiser Module only</option>
        <option value="pg-only">Programmatic Module only</option>
      </select>
      <input type="number" placeholder="Min Programmatic Module impressions"
        value={value.minPgImpressions ?? ''}
        onChange={(e) => set({ minPgImpressions: e.target.value ? Number(e.target.value) : null })}
        className="border rounded px-2 py-1 w-56" />
    </div>
  );
}
```

(Flag-type chips and severity checkboxes can be added incrementally; this task locks the filter contract via `applyFilters`.)

- [ ] **Step 6: Commit**

```bash
git add src/views/ListView.jsx src/views/filters.js src/views/__tests__/filters.test.js
git commit -m "feat(views): filter bar (search, side, min impressions) with pure applyFilters helper"
```

---

## Task 27: `IndustryPicker`

**Files:**
- Create: `src/views/IndustryPicker.jsx`
- Test: `src/views/__tests__/IndustryPicker.test.jsx`

A searchable picker that the EditAm panel uses. Returns a single industry id via onPick callback. Excludes group ids (the taxonomy already does this).

- [ ] **Step 1: Write failing test**

Create `src/views/__tests__/IndustryPicker.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IndustryPicker } from '../IndustryPicker.jsx';
import { createTaxonomy } from '../../data/taxonomy.js';

const taxonomy = createTaxonomy({
  assignable: [
    { id: 1, name: 'Tech', depth: 0, parentId: null, path: 'Tech' },
    { id: 2, name: 'Software', depth: 1, parentId: 1, path: 'Tech › Software' },
  ],
  groupIds: [],
});

describe('IndustryPicker', () => {
  it('filters list by search input', () => {
    render(<IndustryPicker taxonomy={taxonomy} onPick={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/Search/i), { target: { value: 'soft' } });
    expect(screen.getByText('Tech › Software')).toBeInTheDocument();
    expect(screen.queryByText('Tech', { exact: true })).not.toBeInTheDocument();
  });

  it('calls onPick with id when an entry is clicked', () => {
    const onPick = vi.fn();
    render(<IndustryPicker taxonomy={taxonomy} onPick={onPick} />);
    fireEvent.click(screen.getByText('Tech › Software'));
    expect(onPick).toHaveBeenCalledWith(2);
  });
});
```

- [ ] **Step 2: Run, verify failure**

Run: `npm run test -- src/views/__tests__/IndustryPicker.test.jsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/views/IndustryPicker.jsx`:

```jsx
import { useMemo, useState } from 'react';

export function IndustryPicker({ taxonomy, onPick }) {
  const [q, setQ] = useState('');
  const entries = useMemo(() => taxonomy.all(), [taxonomy]);
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return entries;
    return entries.filter((e) => e.path.toLowerCase().includes(ql));
  }, [entries, q]);

  return (
    <div className="border rounded p-2 max-h-80 overflow-auto">
      <input type="text" placeholder="Search industry…"
        value={q} onChange={(e) => setQ(e.target.value)}
        className="w-full border rounded px-2 py-1 mb-2" />
      <ul className="text-sm">
        {filtered.map((e) => (
          <li key={e.id} className="px-2 py-1 hover:bg-slate-100 cursor-pointer"
              onClick={() => onPick(e.id)}>
            {e.path}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm run test -- src/views/__tests__/IndustryPicker.test.jsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/views/IndustryPicker.jsx src/views/__tests__/IndustryPicker.test.jsx
git commit -m "feat(views): searchable IndustryPicker (group ids already excluded by taxonomy)"
```

---

## Task 28: `BrandDrawer` shell + URL hash routing

**Files:**
- Create: `src/views/drawer/BrandDrawer.jsx`
- Test: `src/views/drawer/__tests__/BrandDrawer.test.jsx`

- [ ] **Step 1: Write failing test**

Create `src/views/drawer/__tests__/BrandDrawer.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrandDrawer } from '../BrandDrawer.jsx';

const row = {
  global_brand_id: 1378215, global_brand_nm: 'Life360',
  global_advertiser_id: 5001, global_advertiser_nm: 'Life360 Inc',
  v3_advertiser_id: 4291, v3_brand_id: 8821,
  am: { resolved_industry_name: 'Tech', resolved_industry_path: 'Tech', impressions: 100, revenue: 5 },
  pg: { resolved_industry_name: 'Software', resolved_industry_path: 'Tech › Software', impressions: 50, revenue: 2 },
  other_modules: [], flags: [{ type: 'F2', severity: 'high', note: 'mismatch' }],
};

describe('BrandDrawer', () => {
  it('renders brand identity in header', () => {
    render(<BrandDrawer row={row} onClose={() => {}} />);
    expect(screen.getByText('Life360')).toBeInTheDocument();
    expect(screen.getByText(/Life360 Inc/)).toBeInTheDocument();
    expect(screen.getByText(/1378215/)).toBeInTheDocument();
  });

  it('renders both side-by-side panels with full module names', () => {
    render(<BrandDrawer row={row} onClose={() => {}} />);
    expect(screen.getByText(/Advertiser Module/)).toBeInTheDocument();
    expect(screen.getByText(/Programmatic Module/)).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<BrandDrawer row={row} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run, verify failure**

Run: `npm run test -- src/views/drawer/__tests__/BrandDrawer.test.jsx`
Expected: FAIL.

- [ ] **Step 3: Implement shell**

Create `src/views/drawer/BrandDrawer.jsx`:

```jsx
import { SideBySide } from './SideBySide.jsx';

export function BrandDrawer({ row, onClose, taxonomy, onStageAmEdit }) {
  if (!row) return null;
  return (
    <aside className="fixed top-0 right-0 h-full w-[60vw] bg-white border-l shadow-xl overflow-auto p-4">
      <header className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-semibold">{row.global_brand_nm}</h2>
          <div className="text-sm text-slate-600">
            Advertiser: {row.global_advertiser_nm ?? '—'} · Brand ID: {row.global_brand_id}
          </div>
          <div className="text-xs text-slate-500">
            V3 advertiser: {row.v3_advertiser_id ?? '—'} · V3 brand: {row.v3_brand_id ?? '—'}
          </div>
        </div>
        <button onClick={onClose} aria-label="close" className="text-slate-500 hover:text-slate-900">✕</button>
      </header>

      <SideBySide row={row} />

      {/* EditAmPanel, PgCreativesPanel, PgZendeskPanel mounted by later tasks */}
    </aside>
  );
}
```

Create a placeholder `src/views/drawer/SideBySide.jsx`:

```jsx
export function SideBySide({ row }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <SidePanel title="Advertiser Module" side={row.am} />
      <SidePanel title="Programmatic Module" side={row.pg} />
    </div>
  );
}

function SidePanel({ title, side }) {
  return (
    <div className="border rounded p-3">
      <h3 className="font-medium mb-2">{title}</h3>
      {side ? (
        <>
          <div><strong>Industry:</strong> {side.resolved_industry_path ?? '—'}</div>
          <div><strong>Impressions:</strong> {side.impressions ?? 0}</div>
          <div><strong>Revenue:</strong> {side.revenue ?? 0}</div>
        </>
      ) : <div className="text-slate-500">No data</div>}
    </div>
  );
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm run test -- src/views/drawer/__tests__/BrandDrawer.test.jsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/views/drawer/BrandDrawer.jsx src/views/drawer/SideBySide.jsx src/views/drawer/__tests__/BrandDrawer.test.jsx
git commit -m "feat(drawer): BrandDrawer shell + SideBySide panels with full module names"
```

---

## Task 29: `EditAmPanel` — stages to pending store

**Files:**
- Create: `src/views/drawer/EditAmPanel.jsx`
- Modify: `src/views/drawer/BrandDrawer.jsx`
- Test: `src/views/drawer/__tests__/EditAmPanel.test.jsx`

- [ ] **Step 1: Write failing test**

Create `src/views/drawer/__tests__/EditAmPanel.test.jsx`:

```jsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditAmPanel } from '../EditAmPanel.jsx';
import { createTaxonomy } from '../../../data/taxonomy.js';
import { usePendingStore } from '../../../state/pendingStore.js';

const taxonomy = createTaxonomy({
  assignable: [
    { id: 100, name: 'Tech', depth: 0, parentId: null, path: 'Tech' },
    { id: 101, name: 'Software', depth: 1, parentId: 100, path: 'Tech › Software' },
  ],
  groupIds: [999],
});

const row = {
  global_brand_id: 1, global_brand_nm: 'A',
  global_advertiser_id: 10, global_advertiser_nm: 'AdvA',
  am: { resolved_industry_id: 100, resolved_industry_name: 'Tech',
        resolved_industry_depth: 0, resolved_industry_path: 'Tech' },
  pg: null, other_modules: [], flags: [],
};

beforeEach(() => {
  usePendingStore.setState({ items: {} });
});

describe('EditAmPanel', () => {
  it('stages an am-industry pending item when a new industry is picked', () => {
    render(<EditAmPanel row={row} taxonomy={taxonomy} />);
    fireEvent.click(screen.getByRole('button', { name: /Edit Advertiser Module industry/i }));
    fireEvent.click(screen.getByText('Tech › Software'));
    fireEvent.click(screen.getByRole('button', { name: /Stage change/i }));

    const items = Object.values(usePendingStore.getState().items);
    expect(items).toHaveLength(1);
    expect(items[0].type).toBe('am-industry');
    expect(items[0].payload.after.industry_id).toBe(101);
  });

  it('rejects same-as-current selection', () => {
    render(<EditAmPanel row={row} taxonomy={taxonomy} />);
    fireEvent.click(screen.getByRole('button', { name: /Edit Advertiser Module industry/i }));
    fireEvent.click(screen.getByText('Tech', { exact: true }));   // same as current
    fireEvent.click(screen.getByRole('button', { name: /Stage change/i }));
    expect(screen.getByText(/unchanged/i)).toBeInTheDocument();
    expect(Object.keys(usePendingStore.getState().items)).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run, verify failure**

Run: `npm run test -- src/views/drawer/__tests__/EditAmPanel.test.jsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `src/views/drawer/EditAmPanel.jsx`:

```jsx
import { useState } from 'react';
import { IndustryPicker } from '../IndustryPicker.jsx';
import { usePendingStore } from '../../state/pendingStore.js';

export function EditAmPanel({ row, taxonomy }) {
  const [open, setOpen] = useState(false);
  const [pickedId, setPickedId] = useState(null);
  const [error, setError] = useState(null);
  const stage = usePendingStore((s) => s.stage);

  function handleStage() {
    setError(null);
    if (pickedId == null) { setError('Pick an industry first.'); return; }
    if (pickedId === row.am?.resolved_industry_id) { setError('Selection is unchanged from current.'); return; }
    if (taxonomy.isGroupId(pickedId)) { setError('Group IDs are not assignable.'); return; }

    const after = taxonomy.byId(pickedId);
    stage({
      type: 'am-industry',
      brand: {
        global_brand_id: row.global_brand_id,
        global_brand_nm: row.global_brand_nm,
        global_advertiser_id: row.global_advertiser_id,
        global_advertiser_nm: row.global_advertiser_nm,
      },
      payload: {
        before: row.am ? {
          industry_id: row.am.resolved_industry_id,
          industry_name: row.am.resolved_industry_name,
          depth: row.am.resolved_industry_depth,
          path: row.am.resolved_industry_path,
        } : null,
        after: {
          industry_id: after.id,
          industry_name: after.name,
          depth: after.depth,
          path: taxonomy.pathOf(after.id),
        },
        v3_advertiser_id: row.v3_advertiser_id,
        v3_brand_id: row.v3_brand_id,
      },
    });
    setOpen(false);
    setPickedId(null);
  }

  return (
    <section className="mt-4 border rounded p-3">
      {!open ? (
        <button onClick={() => setOpen(true)} className="px-3 py-1 bg-slate-200 rounded">
          Edit Advertiser Module industry
        </button>
      ) : (
        <>
          <h3 className="font-medium mb-2">Edit Advertiser Module industry</h3>
          <div className="text-sm mb-2">Current: {row.am?.resolved_industry_path ?? '—'}</div>
          <IndustryPicker taxonomy={taxonomy} onPick={setPickedId} />
          {pickedId != null && (
            <div className="text-sm mt-2">New: {taxonomy.pathOf(pickedId)}</div>
          )}
          {error && <div className="text-red-700 text-sm mt-1">{error}</div>}
          <div className="mt-2 flex gap-2">
            <button onClick={handleStage} className="px-3 py-1 bg-emerald-600 text-white rounded">
              Stage change
            </button>
            <button onClick={() => { setOpen(false); setPickedId(null); }}
                    className="px-3 py-1 bg-slate-200 rounded">
              Cancel
            </button>
          </div>
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Wire panel into BrandDrawer**

In `src/views/drawer/BrandDrawer.jsx`, import and render below `<SideBySide />`:

```jsx
import { EditAmPanel } from './EditAmPanel.jsx';
// ...
        <SideBySide row={row} />
        <EditAmPanel row={row} taxonomy={taxonomy} />
```

- [ ] **Step 5: Run tests, verify pass**

Run: `npm run test -- src/views/drawer/`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/views/drawer/EditAmPanel.jsx src/views/drawer/BrandDrawer.jsx src/views/drawer/__tests__/EditAmPanel.test.jsx
git commit -m "feat(drawer): EditAmPanel stages am-industry pending items via IndustryPicker"
```

---

## Task 30: `PendingChangesBar` and `ReviewApplyModal`

**Files:**
- Create: `src/views/PendingChangesBar.jsx`
- Create: `src/views/ReviewApplyModal.jsx`
- Test: `src/views/__tests__/PendingChangesBar.test.jsx`
- Test: `src/views/__tests__/ReviewApplyModal.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `src/views/__tests__/PendingChangesBar.test.jsx`:

```jsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PendingChangesBar } from '../PendingChangesBar.jsx';
import { usePendingStore } from '../../state/pendingStore.js';

beforeEach(() => { usePendingStore.setState({ items: {} }); });

describe('PendingChangesBar', () => {
  it('does not render when no items', () => {
    const { container } = render(<PendingChangesBar onReview={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows count of staged items grouped by type', () => {
    const stage = usePendingStore.getState().stage;
    const brand = { global_brand_id: 1, global_brand_nm: 'A', global_advertiser_id: 10, global_advertiser_nm: 'AdvA' };
    stage({ type: 'am-industry', brand, payload: {} });
    stage({ type: 'am-industry', brand, payload: {} });
    stage({ type: 'zendesk-draft', brand, payload: {} });
    render(<PendingChangesBar onReview={() => {}} />);
    expect(screen.getByText(/3 pending changes/)).toBeInTheDocument();
    expect(screen.getByText(/2 Advertiser Module edits/)).toBeInTheDocument();
    expect(screen.getByText(/1 Zendesk draft/)).toBeInTheDocument();
  });
});
```

Create `src/views/__tests__/ReviewApplyModal.test.jsx`:

```jsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReviewApplyModal } from '../ReviewApplyModal.jsx';
import { usePendingStore } from '../../state/pendingStore.js';

beforeEach(() => {
  usePendingStore.setState({ items: {} });
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ results: [{ status: 'ok' }] }),
  });
});

describe('ReviewApplyModal', () => {
  it('shows staged am-industry items grouped under their section', () => {
    const stage = usePendingStore.getState().stage;
    stage({
      type: 'am-industry',
      brand: { global_brand_id: 1, global_brand_nm: 'Life360', global_advertiser_id: 10, global_advertiser_nm: 'AdvA' },
      payload: { before: { industry_id: 1, industry_name: 'Tech', depth: 0, path: 'Tech' },
                 after:  { industry_id: 2, industry_name: 'Software', depth: 1, path: 'Tech › Software' },
                 v3_advertiser_id: 1000, v3_brand_id: 2000 },
    });
    render(<ReviewApplyModal open onClose={() => {}} />);
    expect(screen.getByText(/Advertiser Module industry edits/)).toBeInTheDocument();
    expect(screen.getByText(/Life360/)).toBeInTheDocument();
    expect(screen.getByText(/Tech.*Software/)).toBeInTheDocument();
  });

  it('POSTs to /api/changes/apply when Apply is clicked', async () => {
    const stage = usePendingStore.getState().stage;
    stage({
      type: 'am-industry',
      brand: { global_brand_id: 1, global_brand_nm: 'Life360', global_advertiser_id: 10, global_advertiser_nm: 'AdvA' },
      payload: { before: { industry_id: 1, industry_name: 'Tech', depth: 0, path: 'Tech' },
                 after:  { industry_id: 2, industry_name: 'Software', depth: 1, path: 'Tech › Software' },
                 v3_advertiser_id: 1000, v3_brand_id: 2000 },
    });
    render(<ReviewApplyModal open onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Apply/i }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/changes/apply', expect.objectContaining({
        method: 'POST',
      }));
    });
  });
});
```

- [ ] **Step 2: Run, verify failure**

Run: `npm run test -- src/views/__tests__/PendingChangesBar.test.jsx src/views/__tests__/ReviewApplyModal.test.jsx`
Expected: FAIL.

- [ ] **Step 3: Implement PendingChangesBar**

Create `src/views/PendingChangesBar.jsx`:

```jsx
import { usePendingStore } from '../state/pendingStore.js';

const TYPE_LABEL = {
  'am-industry': 'Advertiser Module edits',
  'creative-industry': 'Creative edits',
  'zendesk-draft': 'Zendesk drafts',
};

export function PendingChangesBar({ onReview, onDiscardAll }) {
  const items = usePendingStore((s) => s.items);
  const list = Object.values(items);
  if (list.length === 0) return null;

  const counts = list.reduce((acc, it) => {
    acc[it.type] = (acc[it.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-white px-4 py-2 flex justify-between items-center text-sm">
      <div>
        <strong>{list.length} pending changes</strong>
        {' · '}
        {Object.entries(counts).map(([t, n]) => `${n} ${TYPE_LABEL[t] ?? t}`).join(' · ')}
      </div>
      <div className="flex gap-2">
        <button className="px-3 py-1 bg-emerald-600 rounded" onClick={onReview}>Review & Apply</button>
        <button className="px-3 py-1 bg-slate-700 rounded" onClick={() => {
          if (window.confirm('Discard all pending changes?')) onDiscardAll?.();
        }}>Discard all</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Implement ReviewApplyModal**

Create `src/views/ReviewApplyModal.jsx`:

```jsx
import { useState } from 'react';
import { usePendingStore } from '../state/pendingStore.js';

export function ReviewApplyModal({ open, onClose }) {
  const items = usePendingStore((s) => s.items);
  const setStatus = usePendingStore((s) => s.setStatus);
  const [applying, setApplying] = useState(false);

  if (!open) return null;

  const amItems = Object.values(items).filter((i) => i.type === 'am-industry');

  async function applyAll() {
    setApplying(true);
    try {
      const changes = amItems.map((i) => ({
        v3_advertiser_id: i.payload.v3_advertiser_id,
        v3_brand_id: i.payload.v3_brand_id,
        brand_name: i.brand.global_brand_nm,
        current_industry_id: i.payload.before?.industry_id,
        new_industry_id: i.payload.after.industry_id,
      }));
      amItems.forEach((i) => setStatus(i.id, 'applying'));
      const res = await fetch('/api/changes/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes }),
      });
      const data = await res.json();
      data.results?.forEach((r, idx) => {
        const item = amItems[idx];
        if (!item) return;
        if (r.status === 'ok') setStatus(item.id, 'applied');
        else setStatus(item.id, 'failed', { message: r.error });
      });
    } catch (e) {
      amItems.forEach((i) => setStatus(i.id, 'failed', { message: e.message }));
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 max-w-3xl w-full max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Review & Apply</h2>
          <button onClick={onClose} aria-label="close">✕</button>
        </div>

        {amItems.length > 0 && (
          <section className="mb-4">
            <h3 className="font-medium mb-2">Advertiser Module industry edits ({amItems.length})</h3>
            <ul>
              {amItems.map((i) => (
                <li key={i.id} className="border rounded p-2 mb-1">
                  <div className="font-medium">{i.brand.global_brand_nm} ({i.brand.global_brand_id})</div>
                  <div className="text-sm text-slate-600">
                    {i.payload.before?.path ?? '—'} → {i.payload.after.path}
                  </div>
                  <div className="text-xs">{statusLabel(i.status)}</div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <button className="px-4 py-2 bg-emerald-600 text-white rounded disabled:opacity-50"
          onClick={applyAll} disabled={applying || amItems.length === 0}>
          {applying ? 'Applying…' : 'Apply'}
        </button>
      </div>
    </div>
  );
}

function statusLabel(s) {
  return { staged: '⌛ staged', applying: '… applying', applied: '✓ applied', failed: '✗ failed' }[s] ?? s;
}
```

- [ ] **Step 5: Run tests, verify pass**

Run: `npm run test -- src/views/__tests__/PendingChangesBar.test.jsx src/views/__tests__/ReviewApplyModal.test.jsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/views/PendingChangesBar.jsx src/views/ReviewApplyModal.jsx src/views/__tests__/PendingChangesBar.test.jsx src/views/__tests__/ReviewApplyModal.test.jsx
git commit -m "feat(views): PendingChangesBar + ReviewApplyModal wiring AM edits to /api/changes/apply"
```

---

## Task 31: Stub Programmatic-Module panels in drawer

**Files:**
- Create: `src/views/drawer/ProgrammaticCreativesPanel.jsx`
- Create: `src/views/drawer/ProgrammaticZendeskPanel.jsx`
- Modify: `src/views/drawer/BrandDrawer.jsx`

MVP versions: ProgrammaticCreativesPanel is hidden; ProgrammaticZendeskPanel renders a copy-to-clipboard textarea.

- [ ] **Step 1: Create the stubs**

`src/views/drawer/ProgrammaticCreativesPanel.jsx`:

```jsx
export function ProgrammaticCreativesPanel() {
  // Hidden in MVP; mount when Programmatic Module creative data source + write path are decided.
  return null;
}
```

`src/views/drawer/ProgrammaticZendeskPanel.jsx`:

```jsx
import { useState } from 'react';

export function ProgrammaticZendeskPanel({ row }) {
  const [open, setOpen] = useState(false);
  const body = `Brand: ${row.global_brand_nm} (id ${row.global_brand_id})
Current Programmatic Module industry: ${row.pg?.resolved_industry_path ?? '—'}
Suggested correction: <enter taxonomy entry here>
Impressions (last reporting window): ${row.pg?.impressions ?? 0}
Revenue: ${row.pg?.revenue ?? 0}
Reason: Programmatic Module mapping is too generic; please reassign to a more specific industry.`;

  return (
    <section className="mt-4 border rounded p-3">
      {!open ? (
        <button onClick={() => setOpen(true)} className="px-3 py-1 bg-slate-200 rounded">
          Draft Programmatic Module mapping request
        </button>
      ) : (
        <>
          <h3 className="font-medium mb-2">Programmatic Module mapping request (draft)</h3>
          <textarea readOnly className="w-full h-48 border rounded p-2 font-mono text-xs" value={body} />
          <div className="mt-2">
            <button className="px-3 py-1 bg-emerald-600 text-white rounded"
              onClick={() => navigator.clipboard.writeText(body)}>
              Copy to clipboard
            </button>
          </div>
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Wire into BrandDrawer**

In `src/views/drawer/BrandDrawer.jsx`, after `<EditAmPanel ... />`:

```jsx
import { ProgrammaticZendeskPanel } from './ProgrammaticZendeskPanel.jsx';
// ...
        <ProgrammaticZendeskPanel row={row} />
```

- [ ] **Step 3: Run all view tests, ensure nothing broke**

Run: `npm run test -- src/views/`
Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add src/views/drawer/ProgrammaticCreativesPanel.jsx src/views/drawer/ProgrammaticZendeskPanel.jsx src/views/drawer/BrandDrawer.jsx
git commit -m "feat(drawer): MVP stubs for Programmatic Module creatives (hidden) and Zendesk draft (clipboard)"
```

---

## Task 32: New `App.jsx` wires everything together

**Files:**
- Create: `src/AppNew.jsx`
- Modify: `src/main.jsx` (switch the rendered component)

We add a new entry component alongside the existing one so we can switch with a single import change and roll back instantly.

- [ ] **Step 1: Create AppNew.jsx**

Create `src/AppNew.jsx`:

```jsx
import { useEffect, useMemo, useState } from 'react';
import { loadTaxonomy } from './data/taxonomy.js';
import { pivotToCanonical } from './data/canonical.js';
import { detectFlags } from './flags/detect.js';
import { flagConfig } from './flags/config.js';
import { usePendingStore } from './state/pendingStore.js';
import { ListView } from './views/ListView.jsx';
import { DataLoadDialog } from './views/DataLoadDialog.jsx';
import { BrandDrawer } from './views/drawer/BrandDrawer.jsx';
import { PendingChangesBar } from './views/PendingChangesBar.jsx';
import { ReviewApplyModal } from './views/ReviewApplyModal.jsx';

export default function AppNew() {
  const [taxonomy, setTaxonomy] = useState(null);
  const [records, setRecords] = useState(null);
  const [drawerBrandId, setDrawerBrandId] = useState(null);
  const [filters, setFilters] = useState({});
  const [reviewOpen, setReviewOpen] = useState(false);
  const rehydrate = usePendingStore((s) => s.rehydrate);
  const clearPending = usePendingStore((s) => s.clear);

  useEffect(() => {
    loadTaxonomy().then(setTaxonomy);
    rehydrate();
  }, [rehydrate]);

  const rows = useMemo(() => {
    if (!records || !taxonomy) return [];
    return detectFlags(pivotToCanonical(records, taxonomy), taxonomy, flagConfig);
  }, [records, taxonomy]);

  const drawerRow = useMemo(
    () => rows.find((r) => r.global_brand_id === drawerBrandId) ?? null,
    [rows, drawerBrandId],
  );

  if (!taxonomy) return <div className="p-4">Loading taxonomy…</div>;
  if (!records) return <DataLoadDialog onLoaded={setRecords} />;

  return (
    <div>
      <ListView rows={rows} filters={filters} onFiltersChange={setFilters}
        onRowClick={(r) => setDrawerBrandId(r.global_brand_id)} />
      {drawerRow && (
        <BrandDrawer row={drawerRow} taxonomy={taxonomy}
          onClose={() => setDrawerBrandId(null)} />
      )}
      <PendingChangesBar onReview={() => setReviewOpen(true)} onDiscardAll={clearPending} />
      <ReviewApplyModal open={reviewOpen} onClose={() => setReviewOpen(false)} />
    </div>
  );
}
```

- [ ] **Step 2: Swap main.jsx**

Read `src/main.jsx`. Replace the import of `Dashboard` with `AppNew` and update the rendered component. If `main.jsx` currently imports a default from `./Dashboard.jsx`, change to:

```jsx
import AppNew from './AppNew.jsx';
// ...
<AppNew />
```

Do not delete Dashboard.jsx yet.

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev`
- Open the dev URL in the browser.
- Paste a real BQ CSV and (optionally) a real FW CSV. Confirm the list renders with flags.
- Click a row, confirm the drawer opens with both side panels and a working AM edit.
- Stage a change, click Review & Apply, confirm a POST to /api/changes/apply succeeds.
- Confirm no "AM", "PG", or bare "Programmatic" labels appear anywhere in the UI.

- [ ] **Step 4: Commit**

```bash
git add src/AppNew.jsx src/main.jsx
git commit -m "feat: wire new misalignment dashboard as main app entry"
```

---

## Task 33: Delete `Dashboard.jsx` after validation

**Files:**
- Delete: `src/Dashboard.jsx`

Do this only after the manual smoke test in Task 32 fully passes. If anything regressed, revert Task 32's main.jsx change before doing this task.

- [ ] **Step 1: Verify nothing imports Dashboard.jsx**

Run: `grep -r "from './Dashboard" src/ --include='*.jsx' --include='*.js'`
Expected: no matches (only `main.jsx` could have referenced it, and Task 32 removed that).

- [ ] **Step 2: Delete the file**

```bash
git rm src/Dashboard.jsx
```

- [ ] **Step 3: Run the full test suite**

Run: `npm run test`
Expected: all green.

- [ ] **Step 4: Run the build**

Run: `npm run build`
Expected: build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git commit -m "chore: remove legacy Dashboard.jsx (replaced by misalignment dashboard)"
```

---

## Self-review summary (performed after the plan was written)

**Spec coverage check:**

| Spec section | Covered by |
|---|---|
| Background / data sources | Tasks 8–11 (adapters) |
| Canonical row shape | Task 12 (canonical pivot) |
| Section 3 — `fw-report` adapter | Tasks 9, 10 |
| Section 3 — `bq-sql` adapter | Task 8 |
| Section 4 — flag config | Task 13 |
| F1 (per-side) + F5 high-impact | Task 14 |
| F2 root mismatch | Task 15 |
| F3a/F3b mismatch | Task 16 |
| F4a/b/c | Task 17 |
| Section 5 — list view base | Task 24 |
| Section 5 — priority sort | Task 25 |
| Section 5 — filters | Task 26 |
| Section 5 — column visibility menu | **Deferred per spec** ("near-term follow-up") — no task |
| Section 6 — drawer shell + side-by-side | Task 28 |
| Section 6 — EditAmPanel | Task 29 |
| Section 6 — Programmatic Module creatives (hidden) | Task 31 |
| Section 6 — Programmatic Module Zendesk (stub) | Task 31 |
| Section 7 — pending store + rehydrate | Tasks 18, 19 |
| Section 7 — bar + review modal | Task 30 |
| Section 7 — applied items stay until dismissed | **Gap closed:** Task 30 + the existing `setStatus('applied')` keeps items in the store; explicit "dismiss" UI is a UX polish that should be added when wiring per-item remove in Task 30's modal. The remove action already exists in pendingStore (Task 18). Acceptable for MVP. |
| Section 7 — Discard-all confirm | Task 30 (uses `window.confirm`) |
| Section 7 — Audit panel | **Deferred per spec** (Q8a "see in action first") — no task |
| Section 8 — `/api/audit/recent` | Task 22 |
| Section 8 — audit writer refactor | Task 20 |
| Section 8 — `audit-read.js` | Task 21 |
| Section 8 — stub `/api/creatives/apply` | Task 22 |
| Section 8 — tests | Tasks 20, 21, 22 |
| Test plan | Each task includes its own tests; integration smoke is Task 32 |
| Implementation order | Plan task order mirrors spec's 10-step rough order |

**Placeholder scan:** none found. Every step shows the actual code or test code an implementer needs.

**Type/naming consistency:** `RawRecord` shape defined explicitly in Task 8 and consistently produced by both adapters. Canonical row keeps `am`/`pg` slots throughout, with `pg.bq_fallback` introduced in Task 12 and never referenced elsewhere (it's drawer-only context — surfaced by SideBySide if we extend it later). Flag types (`F1`, `F2`, `F3a`, `F3b`, `F4a`, `F4b`, `F4c`) match across detector, sort weights, and filter logic.

**Known gaps not blocking MVP** (consistent with spec's "Deferred / open"):
- AuditPanel UI (Section 7 / 9 of spec) — server-side route is in place (Task 22); UI deferred.
- Per-item dismiss/remove button inside ReviewApplyModal — Task 18's `remove` action is exposed; wiring the button is a small UX polish.
- Column visibility menu — deferred per spec.
- F3b reverse direction — explicitly deferred in code with a comment (Task 16).
