# Advertiser Module ↔ Programmatic Module Brand Industry Misalignment Dashboard — Frontend Rewrite

**Status:** Draft (2026-05-11) — pending user review
**Owner:** Jarred Wilichinsky (Paramount AdOps)
**Branch:** `feat/am-industry-edit`
**Successor to:** [2026-04-29-am-industry-edit-design.md](2026-04-29-am-industry-edit-design.md) — that spec shipped the V3 Advertiser Module edit path which we keep and reuse. This spec rewrites the surrounding UI to make Advertiser Module ↔ Programmatic Module misalignment the front-and-center workflow.

> **Terminology rule (applies throughout this spec and the resulting UI):**
> In all UI strings, badge tooltips, filter labels, column headers, and prose, use the full names **"Advertiser Module"** and **"Programmatic Module"**. Do not use "AM" or "PG" or "Programmatic" alone where a user will see it. Code identifiers (`am`, `pg`, `pg_creatives` in the canonical row, `pgRoot` in flag detection) keep their short names — the rule is about user-facing text, not the codebase.

---

## Goal

Surface, triage, and resolve **brand→industry misalignment between FreeWheel's Advertiser Module (channel_type=2) and Programmatic Module (channel_type=4)**. The two modules independently assign brands to industries — the Advertiser Module is manually maintained by Paramount, the Programmatic Module is auto-detected and globally owned by FreeWheel. Drift between them causes ad-restriction failures and pod-building issues.

The dashboard's #1 job is **surfacing misalignment**. Editing is secondary — supported but always staged, reviewed, and applied in batch.

## Non-goals

- No rewrite of the existing BFF (`server/`). All write paths reuse `/api/changes/apply` from the 2026-04-29 spec.
- No multi-user auth or per-user FW credentials. Solo-tool MVP. Multi-user audit (Google Sheets) is a future concern, accommodated by interface design.
- No CI changes beyond what the SPA build already covers.
- No automated retry/backoff. Failed applies re-stage and re-apply manually.
- No live FW MCP creative-update path in MVP — write path TBD.

---

## Background — Why two modules, why drift happens

FreeWheel has two relevant modules:

- **Advertiser Module (channel_type=2)** — Paramount manually assigns brand→industry via the V3 Streaming Hub API. This is the path the 2026-04-29 spec made editable.
- **Programmatic Module (channel_type=4)** — FreeWheel auto-detects brand→industry and owns the global mapping. Paramount cannot edit it directly; corrections require a Zendesk ticket to FW or an Advertiser-Module-side override as a workaround.

Other channel_types (3 Reseller, 5 Marketplace Private, 6 Marketplace Exchange) carry brand activity too and are surfaced as read-only context but not as primary alignment targets.

Source datasets:
- **Advertiser Module side:** BigQuery view `fw_datafeed_fact_vw.demand_portfolio_hourly_fct`, exported as a CSV the user pastes/uploads (same pattern as the current Dashboard.jsx flow). Includes `global_industry_ids[]` as an expanded ancestor/descendant chain.
- **Programmatic Module side:** FreeWheel Console CSV export (e.g. `Analytics 2026-05-11 09_42_53.csv`). Columns: `Global Brand Name, Global Brand ID, Programmatic Industry Name, Run Revenue, Gross Counted Ads`.

Taxonomy: 1,094 industries with parent chains. 50 IDs are **unassignable group IDs** that should never appear on either side as the assigned value. Sentinel `-1` means unmapped (not NULL).

**Join-key dependency / risk:** The Advertiser-Module ↔ Programmatic-Module row pivot joins on `global_brand_id` (integer, present in both CSVs). If FW ever changes the brand ID column or its semantics in the Programmatic Console export, the join breaks silently — surface as a "Programmatic Module only" badge volume spike. Worth eyeballing the brand-only-on-one-side count on every fresh load.

---

## Architecture

```
Browser (Vite SPA, :5173)
    │  CSV upload / drag-drop      fetch /api/*
    ▼                                  ▼
data/adapters/                      BFF (Node/Express, :8787)
  bq-sql.js                              │  unchanged from 2026-04-29
  fw-report.js                           ▼
       │                              FW Streaming Hub MCP
       ▼                              (V3 brand show/update)
data/canonical.js
  pivotToCanonical()
       │
       ▼
flags/detect.js  ──▶  views/ListView.jsx  ──▶  views/drawer/*
       │                       │
       │                       ▼
       └──▶  state/pendingStore.js  ──▶  views/ReviewApplyModal.jsx ──▶ /api/changes/apply
```

### Frontend file layout

```
src/
├── main.jsx, App.jsx
├── data/
│   ├── canonical.js
│   ├── adapters/
│   │   ├── index.js          (detectFormat, loadCsv)
│   │   ├── bq-sql.js         (existing BQ-CSV ingest, refactored out of Dashboard.jsx)
│   │   └── fw-report.js      (NEW — FW Programmatic Module CSV)
│   └── taxonomy.js           (byId, byName excluding 50 group IDs, walkToDepth0)
├── flags/
│   ├── config.js             (depth cutoffs, impression threshold)
│   └── detect.js             (F1, F2, F3a, F3b, F4)
├── state/
│   └── pendingStore.js       (Zustand + localStorage, with rehydrate())
└── views/
    ├── ListView.jsx
    ├── DataLoadDialog.jsx
    ├── PendingChangesBar.jsx
    ├── ReviewApplyModal.jsx
    ├── AuditPanel.jsx
    ├── IndustryPicker.jsx
    └── drawer/
        ├── BrandDrawer.jsx
        ├── SideBySide.jsx
        ├── EditAmPanel.jsx
        ├── ProgrammaticCreativesPanel.jsx
        └── ProgrammaticZendeskPanel.jsx
```

### Backend changes (small)

```
server/
├── routes.js               + GET /audit/recent, stub POST /creatives/apply
├── audit.js                refactored to use swappable writer
├── audit-writers/
│   ├── jsonl.js            (current behavior — writes server/audit.log)
│   └── sheets.js           (future — Google Sheets, not built in MVP)
├── audit-read.js           NEW — last-N-lines reader for /audit/recent
└── __tests__/
    └── audit-read.test.js  NEW
```

---

## Canonical row shape

One row per `global_brand_id`. Advertiser Module and Programmatic Module data both pivot into the same row.

```js
{
  global_brand_id, global_brand_nm,
  global_advertiser_id, global_advertiser_nm,
  v3_advertiser_id, v3_brand_id,
  am: {                                  // Advertiser Module — null if no data for this brand
    applied_industry_ids_raw,            // pipe-string from V3 BQ
    resolved_industry_id,
    resolved_industry_name,
    resolved_industry_depth,
    resolved_industry_path,              // "Tech > Software > Mobile Apps"
    impressions, revenue
  } | null,
  pg: {                                  // Programmatic Module — same shape
    /* revenue from Run Revenue; resolved_industry_* derived from name lookup */
  } | null,
  total_impressions, total_revenue,
  other_modules: [{ module, impressions, revenue, resolved_industry_name }],
  flags: [{ type, side, severity, note }],
  pg_creatives: null                     // lazy-loaded only when drawer opens
}
```

Field-naming note: code uses `am` and `pg` (the latter inherited from the current codebase — kept for continuity). All UI rendering uses the full module names.

---

## Section 3 — Data adapters

The frontend has two adapters, both producing `RawRecord[]` consumed by `pivotToCanonical()`.

### `bq-sql` adapter (existing flow, refactored)

**Source:** Paramount runs a SQL query against `fw_datafeed_fact_vw.demand_portfolio_hourly_fct` in BigQuery and pastes/uploads the resulting CSV. Same pattern the current Dashboard.jsx already supports — this rewrite **does not change the BQ side**; it extracts the parsing logic into `data/adapters/bq-sql.js` so both sides share the same `RawRecord` pipeline.

**Expected columns** (inherited from current Dashboard.jsx behavior, validated by adapter on load):
- `global_brand_id` (int), `global_brand_nm`
- `global_advertiser_id` (int), `global_advertiser_nm`
- `v3_advertiser_id`, `v3_brand_id` (nullable, resolved server-side if missing)
- `channel_type` (int — 2/3/4/5/6)
- `applied_industry_ids` (pipe-string of int IDs)
- `global_industry_ids` (ancestor-expanded array of int IDs)
- `impressions`, `revenue`

**RawRecord output:** one record per `(global_brand_id, channel_type)` row. Channel-type 2 flows into the `am` slot of canonical; 4 flows into `pg`; others into `other_modules[]`.

**Detection:** `detectFormat()` matches the BQ header signature (presence of `global_industry_ids` + `channel_type` columns).

### `fw-report` adapter (NEW — Programmatic Module CSV)

**Source:** FreeWheel Console "Analytics" report CSV export, Programmatic Module scope.

#### Input format

```
Row 1-4: report metadata (skip)
Row 5:   Global Brand Name,Global Brand ID,Programmatic Industry Name,Run Revenue,Gross Counted Ads
Row 6+:  data rows, standard RFC 4180 CSV
```

`detectFormat()` matches the row-5 header signature.

Two known FW export variants:
- **Enriched** (5 columns, including `Global Brand ID` and `Run Revenue`) — primary supported format.
- **Legacy** (3 columns, no brand ID, no revenue, whole-row outer-quoted) — adapter falls back to name-based join + null revenue. Logged as a degraded-input warning.

#### Column mapping → `RawRecord`

| FW column | Canonical target | Notes |
|---|---|---|
| Global Brand Name | `pg.global_brand_nm` (informational; AM-side name wins after join) | |
| Global Brand ID | `global_brand_id` (join key) | integer |
| Programmatic Industry Name | `pg.industry_names[]` → resolved via `taxonomy.byName()` | comma-list, names from FW canonical taxonomy |
| Run Revenue | `pg.revenue` | decimal |
| Gross Counted Ads | `pg.impressions` | integer with thousands separators in quotes |

`channel_type` is hardcoded to 4.

#### Name → ID resolution

`taxonomy.byName(name)` filters out the 50 group IDs. After filtering, names are unique → single ID. Defensive fallback for ambiguity: pick the candidate whose parent chain contains the most other names from the same FW row.

#### Resolved-industry derivation when `industry_names.length > 1`

Apply the project's existing pipe-string rule: **longest common ` > ` prefix across all resolved IDs**, not the first child's leaf. (Saved in memory as project_fw_taxonomy_pipestring_display.md.) Avoids the "Insurance Carriers → Building Carriers" misrender.

#### What's NOT in the FW report

- `global_advertiser_id/nm` — filled from the Advertiser Module / BQ join. Brands present only in the Programmatic CSV (no Advertiser Module match) show without advertiser context and get a "Programmatic Module only" badge.
- `channel_type` — hardcoded to 4.
- `global_industry_ids[]` ancestry chain — derived by walking the taxonomy from the resolved leaf.

---

## Section 4 — Flag detection rules

### Config (`src/flags/config.js`)

```js
export const flagConfig = {
  programmaticGenericDepthCutoff: 1,    // F1 (Programmatic Module) threshold
  amGenericDepthCutoff: 1,              // F1 (Advertiser Module) threshold (tentative — may remove)
  highImpressionThreshold: 100_000      // F5 sub-badge threshold
};
```

### F1 — Too-generic mapping (per-side)

**F1 (Programmatic Module)** — high severity: `pg.resolved_industry_depth <= programmaticGenericDepthCutoff && has assignable descendants`. The recurring pain: FW mapped the brand too broadly. Drawer offers two paths — Zendesk draft to FW, or Advertiser-Module override workaround.

**F1 (Advertiser Module)** — medium severity: same rule on the Advertiser Module side. Kept for now; may remove once real-world usage shows whether it's actionable.

### F2 — Root mismatch (high severity)

Different depth-0 roots between Advertiser Module and Programmatic Module. The headline misalignment the tool exists to surface.

```
amRoot = walkToDepth0(am.resolved_industry_id)
pgRoot = walkToDepth0(pg.resolved_industry_id)
if amRoot && pgRoot && amRoot !== pgRoot → F2
```

Skip if either side is null, unmapped, or group-ID (those are F4).

### F3 — Same root, different leaves

**F3a — Lateral mismatch** (medium): same root, neither side is an ancestor of the other. Each module picked a different branch within the same root.

**F3b — Ancestor mismatch** (medium): same root, one side is an ancestor of the other. Fired only in the direction where the **Advertiser Module is the parent and the Programmatic Module is the descendant** — message: "Programmatic Module may be too narrow — consider asking FW to broaden, or Advertiser Module may need to drill down to match." The reverse direction (Advertiser Module descendant, Programmatic Module parent) is currently **deferred** — see "Deferred / open" below for the question we'll revisit after first usage.

### F4 — Unmapped / group-ID misuse

- **F4a** (high): Advertiser Module applied to one of the 50 group IDs.
- **F4b** (medium): Advertiser Module is `-1` (sentinel — no assignment).
- **F4c** (low): Programmatic Module name didn't resolve to a taxonomy entry.

### F5 — Impression-weighted priority badge (not a flag)

A sort/badge enhancement: rows with F1 (Programmatic Module) AND `pg.impressions > highImpressionThreshold` get a 🔥 "high impact" sub-badge and float to the top under the default priority sort.

---

## Section 5 — List view

### Columns

| # | Column header (UI) | Source |
|---|---|---|
| 1 | Flags (compact badge stack) | `row.flags[]` |
| 2 | Brand | `global_brand_nm` (click → drawer) |
| 3 | Advertiser | `global_advertiser_nm` |
| 4 | Advertiser Module industry | `am.resolved_industry_name` |
| 5 | Programmatic Module industry | `pg.resolved_industry_name` |
| 6 | Advertiser Module impressions | `am.impressions` |
| 7 | Programmatic Module impressions | `pg.impressions` |
| 8 | Programmatic Module revenue | `pg.revenue` |
| 9 | Other modules | count badge if `other_modules.length > 0` |
| 10 | Pending | dot if row has pending changes |

10 columns is wide. We accept horizontal scroll on smaller screens as MVP behavior. A column-visibility menu (toggle each column on/off, persist to localStorage) is a near-term follow-up — not in MVP but the table component should be built so this is a one-component addition.

### Filters (combinable)

- Free-text search: brand name, advertiser name, brand id, advertiser id
- Flag types: F1 (Programmatic Module), F1 (Advertiser Module), F2, F3a, F3b, F4a, F4b, F4c (default: **show all** on first load)
- Side present: Both / Advertiser Module only / Programmatic Module only (default Both)
- Severity: high / medium / low (default high + medium)
- Has pending changes
- Industry root (taxonomy root picker)
- Minimum Programmatic Module impressions

### Sort

Default = priority score. **The weights below are a starting point; expect to tune them after first real-world usage.**

```
score =
    (hasF2          ? 1000 : 0)
  + (hasF1P_highImp ?  800 : 0)
  + (hasF4a         ?  600 : 0)
  + (hasF1P         ?  400 : 0)
  + (hasF3b         ?  200 : 0)
  + (hasF3a         ?  150 : 0)
  + (hasF1A         ?  100 : 0)
  + (hasF4b         ?   80 : 0)
  + (hasF4c         ?   20 : 0)
  + log10(1 + (pg.impressions || 0))   // tiebreaker
```

Column-header click overrides for the session.

### Performance

TanStack Table + virtualizer. Target ~3-10k rows, must stay snappy.

### Badge key (footer/help popover)

- 🔴 **F2** — Root mismatch
- 🔥 **F1 (Programmatic Module) high impact** — Generic Programmatic Module mapping + high impressions
- 🟠 **F1 (Programmatic Module)** — Generic Programmatic Module mapping
- 🟡 **F1 (Advertiser Module)** — Generic Advertiser Module assignment
- 🟣 **F3a / F3b** — Same root, different leaves (lateral / ancestor)
- ⚫ **F4a / F4b / F4c** — Unmapped or group-ID misuse

---

## Section 6 — Detail drawer

Slides in from the right when a row is clicked. URL hash `#brand/<id>`. Default width 60% viewport, full-screen toggle, draggable resize.

### Header
Brand name, advertiser, brand ID, V3 IDs (with copy buttons), flag badges.

### Panel A — Side-by-Side (always visible)
Two columns (Advertiser Module left, Programmatic Module right). Each shows resolved industry, full path, depth, raw assignment (collapsible — `applied_industry_ids_raw` for AM, `industry_names[]` for Programmatic), impressions, revenue. "Other modules" sub-section if present, read-only.

### Panel B — Edit Advertiser Module industry (collapsed by default)
V3 industry picker (excluding group IDs). Stages to `pendingStore` as `type: 'am-industry'`. Validates: blocks group IDs, `-1`, unchanged.

### Panel C — Programmatic Module creatives (lazy-loaded, hidden in MVP)
Data source: BQ or FW CSV import (TBD). Write path: TBD. Per Section 7 Q7d, this panel is hidden in MVP until the write path lands.

### Panel D — Programmatic Module Zendesk draft (MVP stub)
"Draft Programmatic Module mapping request" button opens a textarea with templated body: brand id/name, current Programmatic Module industry, suggested correction, impression/revenue context. MVP: copy-to-clipboard only. No backend submission. Revisit when email-with-standard-format vs Zendesk-API path is decided.

### Layout / behavior
- Esc/click-outside/✕ closes; unsaved pre-stage edits prompt discard.
- Staged items survive close (live in `pendingStore`).
- `J/K` navigate prev/next brand while drawer open.

---

## Section 7 — Pending changes + Review/Apply + Audit

### `pendingStore` shape

Zustand store, persisted to `localStorage`. Cleared after applied items are dismissed.

```js
{
  items: {
    [pendingId]: {
      id,                            // uuid
      type,                          // 'am-industry' | 'creative-industry' | 'zendesk-draft'
      createdAt,
      brand: { global_brand_id, global_brand_nm, global_advertiser_id, global_advertiser_nm },
      payload,                       // shape varies by type (see below)
      status,                        // 'staged' | 'applying' | 'applied' | 'failed'
      error                          // null | { message, retriedAt }
    }
  }
}
```

Per-type `payload`:
- `am-industry`: `{ before: {industry_id, industry_name, depth, path}, after: {...} }`
- `creative-industry`: `{ creative_ids: [int], before_per_creative: {[id]: industry_id|null}, after: {industry_id, industry_name} }` — hidden in MVP
- `zendesk-draft`: `{ subject, body, severity }`

### `pendingStore.rehydrate()` — runs on app load

Reads `localStorage`. For any item with `status === 'applying'`, demote to `failed` with `error: { message: "Interrupted — verify on FW side before retrying", ... }`. This is where the "refresh during apply" edge case is enforced.

### Pending Changes Bar (UI text uses full module names)

Sticky bottom-of-list-view, only when `items` is non-empty:
```
3 pending changes · 2 Advertiser Module edits · 1 Zendesk draft    [Review & Apply]  [Discard all]
```
Count badges filter list to rows with pending changes of that type.

### Review modal

Diff cards grouped by type. Per-item checkbox to exclude from this apply pass without discarding. Per-item remove deletes from store. Apply fires items in parallel by type:
- `am-industry` → `POST /api/changes/apply` (existing endpoint, unchanged)
- `creative-industry` → hidden in MVP
- `zendesk-draft` → opens clipboard-copy modal; no backend

Per-item status updates in-place: `staged` → `applying` → `applied` (✓) or `failed` (✗ with retry). **Applied items stay in the store** with faded "✓ applied" treatment until manually dismissed.

Discard-all confirmation: single "Are you sure?".

### Audit

Server-side: append-only JSONL at `server/audit.log` (existing). The new design wraps this in a swappable writer interface (`server/audit-writers/jsonl.js`) so a future Google Sheets writer can replace it without route-code changes.

Client-side: `AuditPanel.jsx` slide-out from header gear icon. Reads `GET /api/audit/recent?limit=50`. Read-only. Whether to merge in `pendingStore` items remains TBD pending real-world usage (see Deferred / open).

### Edge cases

- **Refresh during apply** → handled by `pendingStore.rehydrate()` (see above).
- **Stale staged data:** the dataset is per-session (loaded from CSV uploads), so "no longer in dataset" means the user uploaded a *different* CSV pair and the staged brand isn't present. Show "Source brand not in current dataset" warning on the item and block apply for that item until the source brand is loaded again.
- **Conflicting `am-industry` edits on same brand** → last-wins with "replaces earlier edit" indicator.

---

## Section 8 — Server changes

### Reuse without modification
- `POST /api/changes/apply` — `am-industry` apply path. Existing flow: `sh_1_1_show-a-brand` → `mutateBrandIndustry()` → `sh_1_1_update-a-brand` + audit append.
- `GET /api/industries` — taxonomy for pickers.
- `POST /api/resolve-v3` — global→V3 id resolution called from `pivotToCanonical()` for rows missing V3 IDs.
- `GET /api/health` — keep.

### New
- `GET /api/audit/recent?limit=50` — tails `server/audit.log`, parses JSONL, returns newest-first. Cap limit at 500 server-side. Tolerates malformed lines (skip + log).
- Stub `POST /api/creatives/apply` returning `501 Not Implemented` — placeholder for when the Programmatic Module creative write path is decided.

### Audit writer refactor
Extract `appendAudit()` body into `server/audit-writers/jsonl.js`. `audit.js` selects the writer by env var (`AUDIT_WRITER=jsonl` default). Future `sheets.js` writer is a separate file change, no route changes needed.

### Tests added
- `audit-read.test.js`: empty file, fewer-than-N entries, malformed lines, unicode, newest-first ordering.
- `routes.test.js` extension: `GET /api/audit/recent` happy path, limit cap, 501 stub for creatives.

---

## Deferred / open

- **F3b reverse direction** (Advertiser Module descendant, Programmatic Module parent): currently not flagged unless F1 (Programmatic Module) also fires. Could leave a gap when Programmatic depth is broader than Advertiser Module but still past the F1 cutoff. Will revisit after first real-world usage to see whether such rows actually appear and matter.
- **Q6c — Zendesk path:** clipboard-only MVP. Revisit Zendesk API vs. templated-email when usage pattern is clear.
- **Q7a / Q8a — Audit panel scope:** whether the slide-out merges `pendingStore` with server-side log entries. Deferred until first usage round.
- **Q4b — F1 (Advertiser Module) flag:** kept for now, may remove if real-world data shows it never produces actionable signal.
- **Programmatic Module creative list/write path** (Section 6 Panel C) — data source: BQ or FW CSV import. Write path: TBD. Hidden in MVP.
- **Google Sheets audit writer** — interface accommodated; not built in MVP.
- **Column visibility menu** for the 10-column list view — accept horizontal scroll in MVP; add toggle menu next.
- **Priority-score weight tuning** — starting values noted above, expect adjustment.

---

## Test plan

### Unit
- `data/adapters/fw-report.js`: detection (both header variants), CSV parsing (quoted fields, thousands separators, embedded commas), pre-header metadata skip, single vs multi industry names per row, name→ID resolution including ambiguity fallback.
- `data/adapters/bq-sql.js`: detection, column validation, channel_type splitting into am/pg/other_modules slots.
- `data/canonical.js → pivotToCanonical`: AM-only, Programmatic-only, both-sides, brand-ID join on int equality, advertiser linkage from AM side.
- `data/taxonomy.js`: `byId`, `byName` excluding group IDs, `walkToDepth0`, longest-common-prefix path.
- `flags/detect.js`: each of F1 (P), F1 (AM), F2, F3a, F3b, F4a, F4b, F4c with positive and negative cases. F5 impression-weighted badge.
- `state/pendingStore.js`: stage/replace/remove/clear, localStorage persistence, status transitions, `rehydrate()` demotes `applying` → `failed`.
- `server/audit-read.js`: see Section 8 list.

### Integration
- Load a real FW CSV + BQ CSV pair → pivot → verify expected flag counts on known-good rows.
- Stage an `am-industry` change → review → apply → confirm BFF mutation hit and audit-log entry written.
- `GET /api/audit/recent` reflects the new entry.

### UI smoke (manual, browser)
- List view loads 3-10k rows without jank under priority sort.
- All UI strings use "Advertiser Module" / "Programmatic Module" — no stray "AM" / "PG" / bare "Programmatic" labels.
- Filters combine correctly; default (show all flags) behaves.
- Drawer opens via row click and URL hash; closes on Esc/click-outside.
- Advertiser-Module edit panel rejects group IDs, `-1`, unchanged.
- Pending bar appears and persists across refresh; `rehydrate()` demotes interrupted applies.
- Apply transitions a row through staged→applying→applied with the ✓ treatment.

---

## Implementation order (rough)

1. `taxonomy.js` + tests (foundation for everything)
2. `data/adapters/bq-sql.js` + `data/adapters/fw-report.js` + `canonical.js` + tests
3. `flags/config.js` + `flags/detect.js` + tests
4. `state/pendingStore.js` (including `rehydrate()`) + tests
5. `views/ListView.jsx` (read-only) + `DataLoadDialog.jsx`
6. `views/drawer/*` — SideBySide, then EditAmPanel (reuses existing /api/changes/apply)
7. `PendingChangesBar` + `ReviewApplyModal` + wiring to /api/changes/apply
8. Server: `audit-read.js`, audit-writer refactor, GET /api/audit/recent, stub POST /api/creatives/apply
9. `AuditPanel.jsx`
10. (Deferred panels added later: Programmatic Module creatives, Zendesk submission)
