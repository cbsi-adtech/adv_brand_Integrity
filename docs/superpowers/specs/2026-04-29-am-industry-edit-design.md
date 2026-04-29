# In-Dashboard AM Brand Industry Editing → FreeWheel

**Status:** Approved (2026-04-29) — pending implementation plan
**Owner:** Jarred Wilichinsky (Paramount AdOps)
**Scope:** First of N "resolve issues in the dashboard and push to FreeWheel" features. This spec covers **only** the AM Industry (applied) column on the Brand Industry Issues tab. Other columns (Global Brand canonical, Indirect Applied, etc.) are out of scope until this ships and is validated.

---

## Goal

On the **Brand Industry Issues** tab, let the operator change the **AM brand entity industry assignment** directly from a row, stage multiple changes, and apply them in one batch to FreeWheel Streaming Hub via the FW MCP server. The dashboard's local row state updates only after FW confirms the write.

The "AM brand entity" is the **V3 brand** at `/services/v3/advertisers/{advertiser_id}/brands/{brand_id}` — the sub-granular Streaming Hub entity Paramount's AM team manages. The V3 update is the only writeable path; V4 `global_brands` is read-only.

## Non-goals

- No edits to Global Brand canonical industry, Indirect Applied industry, or any other column.
- No multi-user, no accounts, no per-user FW credentials. Single-user A-light deployment (local BFF, your laptop).
- No OAuth PKCE flow. Deferred until/if this graduates to a shared deployment.
- No automated retry / backoff / scheduling. If a row fails, the user re-applies the still-pending row.
- No CI changes for the BFF. CI continues to lint + build the SPA only.

---

## Architecture

A small Node BFF runs locally next to the Vite dev server. The browser SPA never sees FW credentials or session IDs.

```
Browser (Vite SPA, :5173)
    │  fetch /api/...   (same-origin via Vite proxy)
    ▼
BFF (Node/Express, :8787)
    │  JSON-RPC over HTTPS to streaming_hub_login + invoke_tool
    ▼
FreeWheel Streaming Hub MCP server
    │  XML over HTTPS
    ▼
FreeWheel Streaming Hub V3 Brand API
```

`vite.config.js` proxies `/api/**` → `http://localhost:8787`. `npm run dev` boots both via `concurrently`.

---

## Data shape change (BigQuery → CSV)

The mismatch CSV gains two columns the dashboard needs to call the V3 endpoint:

| Column | Source | Notes |
|---|---|---|
| `v3_advertiser_id` | join through `advertiser_dim` (or equivalent) on the global advertiser | Required path parameter for `PUT /services/v3/advertisers/{advertiser_id}/brands/{brand_id}` |
| `v3_brand_id` | from `brand_dim` | Required path parameter |

`DATA_SCHEMA.md` and the working power query are updated accordingly. The CSV paste dialog validates these columns are present. Rows missing either ID render the AM Industry cell as a non-editable chip with a tooltip: *"No V3 brand mapping — re-run the BigQuery export with v3_advertiser_id and v3_brand_id columns."*

---

## BFF surface

The BFF exposes three endpoints. All requests/responses are JSON.

### `GET /api/health`

Returns the data the header badge needs:

```json
{
  "environment": "staging",
  "loggedIn": true,
  "sessionExpiresAt": "2026-04-29T13:00:00Z"
}
```

If FW login has failed (bad creds, network), `loggedIn: false` and an `error` field. The browser polls this every 30s.

### `GET /api/industries`

Returns the FW industry taxonomy as JSON, with the 50 group IDs flagged but **filtered out** of the assignable list:

```json
{
  "assignable": [
    { "id": 66, "name": "Insurance Carriers", "depth": 0, "parentId": null, "path": "Insurance Carriers" },
    { "id": 5249, "name": "Auto Insurance", "depth": 1, "parentId": 66, "path": "Insurance Carriers › Auto Insurance" },
    ...
  ],
  "groupIds": [428, 396, 397, ...]
}
```

The taxonomy currently lives inside `Dashboard.jsx`; this endpoint moves it server-side so picker and dashboard share one source. (Migration step in the plan.)

### `POST /api/changes/apply`

**Request body:**

```json
{
  "changes": [
    {
      "v3_advertiser_id": 12345,
      "v3_brand_id": 67890,
      "brand_name": "Geico",
      "current_industry_id": 5249,
      "new_industry_id": 5251
    }
  ]
}
```

**Response (200 even on per-row failures):**

```json
{
  "environment": "staging",
  "results": [
    {
      "v3_advertiser_id": 12345,
      "v3_brand_id": 67890,
      "brand_name": "Geico",
      "current_industry_id": 5249,
      "new_industry_id": 5251,
      "status": "ok"
    },
    {
      "v3_advertiser_id": 12346,
      "v3_brand_id": 67891,
      "brand_name": "...",
      "current_industry_id": 66,
      "new_industry_id": 5252,
      "status": "error",
      "error": "FW: 422 — industry 5252 not assignable"
    }
  ]
}
```

The BFF processes changes sequentially (no parallelism — V3 updates may have implicit per-brand ordering). On per-row failure, it continues and collects results.

### Auth

BFF reads on startup:

```
FW_USERNAME=...
FW_PASSWORD=...
FW_ENVIRONMENT=staging   # or production
```

Calls `streaming_hub_login` once, caches the `session_id` in memory. On 401 from any subsequent `invoke_tool`, re-runs login once and retries the failed call. No session cookies to the browser.

### Audit

Every apply attempt appends one JSON line to `server/audit.log` (gitignored):

```
{"ts":"2026-04-29T18:42:11Z","environment":"staging","brand_id":67890,"advertiser_id":12345,"brand_name":"Geico","before":5249,"after":5251,"status":"ok"}
```

One file, append-only, JSON Lines. FW Streaming Hub keeps its own audit trail; this is for dashboard-side observability only.

---

## Apply algorithm (per-change, BFF-side)

```
for change in changes:
  brand_xml = invoke_tool('sh_1_1_show-a-brand',
                          { advertiser_id, brand_id, session_id })
  mutated   = mutate_industry(brand_xml, new_industry_id)
  invoke_tool('sh_1_1_update-a-brand',
              { advertiser_id, brand_id, body: mutated, session_id })
  audit.append(...)
  results.push(...)
```

**The exact XML field for industry on a V3 brand body is unknown until we inspect a live response.** The implementation plan's first task is "GET one real brand from staging, document the field name and shape, then implement `mutate_industry`." Two anticipated cases the plan must handle:

- The field is a single `<industry_id>` scalar → simple replace.
- The field is a list `<industries><industry id="..."/></industries>` → replace the AM-applied entry while preserving any others.

Likewise unknown: whether the V3 update accepts a partial XML body or requires the full mutated round-trip. Plan defaults to **full round-trip** (safer), revises if FW V3 docs say otherwise during the discovery task.

---

## Frontend changes (`src/Dashboard.jsx`)

### 1. Header badge

Top-right pill showing `STAGING` (green) or `PRODUCTION` (red), populated from `GET /api/health` on mount and every 30s. If the BFF is unreachable: pill reads `BFF OFFLINE` (gray) and **all AM Industry cells become read-only** with a tooltip *"BFF offline — start it with `npm run dev`."*

### 2. `MismatchTable` AM Industry cell → `IndustryEditCell`

The existing `IndustryChip` in the **AM Industry** column [src/Dashboard.jsx:537](src/Dashboard.jsx#L537) becomes an editable component:

- Default state: same chip as today.
- Click → popover anchored to the cell with:
  - Search input (autoFocus)
  - Virtualized list of assignable industries (depth-indented, path on hover)
  - Group IDs filtered out
  - Keyboard nav: ↑/↓ to move, Enter to select, Esc to close
- After selection: cell shows new industry chip with a small pending ribbon (`pending`) and a `↺` revert icon.
- Revert: removes the pending change for that row; restores the original chip.

Rows missing `v3_advertiser_id` / `v3_brand_id` render the chip as today (no popover, no ribbon, tooltip explains why).

### 3. Pending bar

When ≥1 row is pending, a sticky bar appears below the tab strip:

```
3 pending changes  ·  [Review & Apply]  [Discard all]
```

`Discard all` clears pending state with a confirm. Re-loading CSV with pending changes prompts: "Discard 3 pending changes?" — confirm required.

### 4. Review & Apply modal

Triggered by `Review & Apply`. Renders:

- Top line, in the same color as the badge: `Environment: PRODUCTION` (or staging).
- Diff list, one row per pending change: `Geico · Auto Insurance (5249) → P&C Insurance (5251)`
- Single button: `Apply 3 changes to PRODUCTION` (full-caps, color-matched).
- Cancel returns to the table without changes.

### 5. Results modal

After apply returns:

- Summary line: `2 succeeded · 1 failed`
- Per-row list with status icon and (if failed) the FW error message
- Successes are committed to the dashboard's local row state (the `am_industry_id` / `am_industry_nm` of those rows are now the new values; the row's `status` is recomputed via the existing `rowStatus()` logic — a previously-mismatched row may now read `aligned`).
- Failures stay in the pending list so the user can retry or revert.
- `Close` dismisses the modal.

---

## Repo layout

```
adv_brand_dash/
├── src/                                  # SPA (existing)
│   └── Dashboard.jsx                     # adds IndustryEditCell, PendingBar, ReviewModal, ResultsModal, EnvBadge
├── server/                               # NEW — BFF
│   ├── index.js                          # express app, port 8787
│   ├── fw.js                             # MCP client: login, invoke_tool, session refresh
│   ├── routes.js                         # /api/health, /api/industries, /api/changes/apply
│   ├── industries.js                     # taxonomy moved out of Dashboard.jsx
│   ├── mutate-brand-xml.js               # implements mutate_industry — to be filled in after discovery task
│   └── audit.log                         # gitignored
├── .env.example                          # FW_USERNAME=, FW_PASSWORD=, FW_ENVIRONMENT=staging, FW_MCP_URL=
├── .env                                  # gitignored
├── vite.config.js                        # adds /api proxy → :8787
├── package.json                          # adds express, concurrently, xml2js (or fast-xml-parser); new "dev" runs both
├── DATA_SCHEMA.md                        # updated with v3_advertiser_id, v3_brand_id columns
└── docs/superpowers/specs/
    └── 2026-04-29-am-industry-edit-design.md   # this file
```

---

## Error handling

| Failure mode | Behavior |
|---|---|
| BFF unreachable | Header badge `BFF OFFLINE`; AM Industry cells read-only; pending changes preserved in browser memory until BFF returns |
| FW login fails on BFF startup | `/api/health` returns `loggedIn: false`; badge `LOGIN FAILED`; cells read-only |
| FW session expired mid-apply | BFF transparently re-runs `streaming_hub_login` once and retries the failed call. If retry also fails, that row reports the auth error |
| FW returns 422 / 4xx on a single brand | That row's result is `status: "error"`, `error: "FW: <code> — <message>"`. Other rows continue. |
| Network drop mid-apply | Browser sees a `fetch` reject; results modal shows `N succeeded, M failed (network interrupted)`. Audit log is the source of truth for what actually wrote. |
| User loaded fresh CSV with pending changes | Confirm: `Discard 3 pending changes?` |

---

## Open questions resolved during implementation (not blockers)

1. **Exact XML field for industry on V3 brand.** First task in the implementation plan: GET a known brand from staging, document the field, implement `mutate_industry`.
2. **Partial vs full body on V3 update.** Default to full round-trip; revise only if FW docs explicitly support partial.
3. **FW session TTL.** Not documented in the MCP reference. BFF treats 401 as the signal to re-login. No proactive refresh.

---

## Acceptance criteria

The feature is "shipped and validated" — gating the next column's work — when all of the following are true on **staging**:

1. BigQuery export produces a CSV with `v3_advertiser_id` and `v3_brand_id` columns; CSV-paste loads it into the dashboard.
2. Header badge reads `STAGING` (green) when BFF is up and FW login succeeded.
3. Picking a new industry on three different rows results in three pending entries and a `Review & Apply` bar.
4. Applying writes all three to FW staging; `server/audit.log` has three corresponding `status: "ok"` lines.
5. The dashboard's local row state updates: previously-mismatched rows now read `aligned` (verified against `rowStatus()`).
6. A re-pull from BigQuery (re-paste of the CSV) confirms the FW staging state matches the dashboard's view — i.e., the writes round-tripped.
7. A deliberately bad change (e.g., assigning a group ID, which the picker should prevent — but force one via devtools) returns a `status: "error"` and is reflected in the results modal without breaking the other rows.
