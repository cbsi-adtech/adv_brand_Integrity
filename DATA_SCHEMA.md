# FreeWheel Industry Integrity Dashboard — Data Schema

## Overview

This dashboard monitors industry assignment integrity across FreeWheel's Advertiser Module, Programmatic, and Marketplace channels for Paramount Global Digital Ad Operations. All data originates from BigQuery project `i-digital-adsales-prod`.

---

## Primary Fact Table

### `fw_datafeed_fact_vw.demand_portfolio_hourly_fct`

The **only** fact table in the FW datafeed that contains `global_industry_ids[]`. All industry integrity analysis must use this table. Do not attempt to use `direct_sold_ni_hourly_fct`, `mpp_mkpl_hourly_fct`, or `programmatic_ni_hourly_fct` for industry data — they do not have this field.

**Key fields used:**

| Field | Type | Notes |
|---|---|---|
| `event_dt` | DATE | Partition field — always filter on this |
| `sales_channel_type_id` | INT64 | Module identifier — see channel map below |
| `delivered_country_id` | INT64 | 165 = US |
| `global_brand_ids` | ARRAY\<INT64\> | UNNEST to get brand. Sentinel = -1 (unmapped) |
| `global_advertiser_ids` | ARRAY\<INT64\> | UNNEST to get advertiser. Sentinel = -1 (unmapped) |
| `global_industry_ids` | ARRAY\<INT64\> | **Expanded hierarchy array** — see critical note below |
| `net_counted_ads_nbr` | FLOAT64 | Impressions |
| `run_revenue_amt` | FLOAT64 | Revenue |
| `campaign_id` | INT64 | Available on this table |
| `insertion_order_id` | INT64 | Available on this table |
| `purchased_order_id` | INT64 | Available on this table |

**Channel type map:**

| `sales_channel_type_id` | Module |
|---|---|
| 2 | Advertiser Module (Direct Sold) |
| 3 | Reseller |
| 4 | Programmatic |
| 5 | Marketplace Private |
| 6 | Marketplace Exchange |

---

## Critical: global_industry_ids[] Is an Expanded Hierarchy

FreeWheel stores the **full ancestor/descendant chain** in `global_industry_ids[]`, not just the assigned industry. A brand assigned to `Insurance Carriers (66)` will have an array containing 66 plus all of its children (5249, 5250, 5251, etc.).

**Never UNNEST this array for industry comparison.** Doing so produces massive false positives.

**Correct approach — two options:**

**Option A (SQL):** Use `ARRAY_TO_STRING(global_industry_ids, '|')` to pass the full array as a pipe-delimited string, then resolve minimum-depth entry client-side using the taxonomy.

**Option B (SQL):** Use `global_industry_ids[SAFE_OFFSET(0)]` as a starting point, then walk up to depth-0 root using the taxonomy hierarchy. This is what the dashboard does in JavaScript via `walkToRoot()`.

**Unmapped sentinel:** `-1` (not null, not empty array). Filter with `global_industry_ids[SAFE_OFFSET(0)] = -1`.

---

## Dim Tables Used

All dims in `fw_datafeed_dim_vw`.

### `global_brand_dim`

| Field | Type | Notes |
|---|---|---|
| `global_brand_id` | INT64 | Join key |
| `global_brand_nm` | STRING | FW canonical brand name (consumer-facing) |
| `global_industry_ids` | ARRAY\<INT64\> | Brand's canonical industry — same expansion issue applies, use `[SAFE_OFFSET(0)]` then walk to root |

### `global_advertiser_dim`

| Field | Type | Notes |
|---|---|---|
| `global_advertiser_id` | INT64 | Join key |
| `global_advertiser_nm` | STRING | Legal entity rollup (e.g., "Procter & Gamble", "Stellantis N.V.") |

### `advertiser_dim`

FW sub-granular advertiser entity — different from `global_advertiser_dim`. Reflects how Paramount's AM team mapped the entity in Streaming Hub. Not on `demand_portfolio_hourly_fct`; only on `direct_sold_ni_hourly_fct` via scalar `advertiser_id`.

### `brand_dim`

FW sub-granular brand entity. Same caveat as `advertiser_dim` — not on DP fact.

---

## ID Availability by Table

> **Note:** The original source of this section used ✓/✗ glyphs that arrived as mojibake; the table below preserves the source markers verbatim. Cross-reference the **Known Gotchas** section for authoritative availability rules.

| Field | demand_portfolio | direct_sold_ni | mpp_mkpl_hourly | mpp_mkpl_daily |
|---|---|---|---|---|
| `global_industry_ids[]` | â | â | â | â |
| `global_brand_ids[]` | â | â | â | â |
| `global_advertiser_ids[]` | â | â | â | â |
| `advertiser_id` (scalar) | â | â | â | â |
| `placement_id` | â | â | â | â |
| `insertion_order_id` | â | â | â | â |
| `campaign_id` | â | â | â | â |
| `creative_id` | â (always -1 on MPP) | â | â | â |
| `deal_id` (scalar) | â | â | â | â |
| `sold_order_id` | â | â | â | â |
| `private_listing_ids[]` | â (STRING) | â | â | â |
| `sales_channel_type_id` | â | â (always 2) | â (always 5) | â |

---

## The Working Query (Dashboard Power Query)

This is the single query that populates all three dashboard tabs. Run for any date range and paste CSV output.

```sql
WITH base AS (
  SELECT
    CASE fw.sales_channel_type_id
      WHEN 2 THEN 'Advertiser Module'
      WHEN 3 THEN 'Reseller'
      WHEN 4 THEN 'Programmatic'
      WHEN 5 THEN 'Marketplace Private'
      WHEN 6 THEN 'Marketplace Exchange'
    END                                                    AS module,
    brand_id,
    advertiser_id,
    ARRAY_TO_STRING(fw.global_industry_ids, '|')           AS applied_industry_ids_raw,
    SUM(fw.net_counted_ads_nbr)                            AS impressions,
    SUM(fw.run_revenue_amt)                                AS revenue
  FROM `i-digital-adsales-prod.fw_datafeed_fact_vw.demand_portfolio_hourly_fct` AS fw
  CROSS JOIN UNNEST(fw.global_brand_ids)      AS brand_id
  CROSS JOIN UNNEST(fw.global_advertiser_ids) AS advertiser_id
  WHERE fw.event_dt BETWEEN DATE '2026-04-21' AND DATE '2026-04-25'  -- adjust date range
    AND fw.delivered_country_id = 165
    AND fw.sales_channel_type_id IN (2, 3, 4, 5, 6)
    AND brand_id      != -1
    AND advertiser_id != -1
  GROUP BY 1, 2, 3, 4
)
SELECT
  b.module,
  b.brand_id              AS global_brand_id,
  gb.global_brand_nm,
  b.advertiser_id         AS global_advertiser_id,
  ga.global_advertiser_nm,
  b.applied_industry_ids_raw,
  gb.global_industry_ids[SAFE_OFFSET(0)] AS gb_industry_id,
  av.advertiser_id     AS v3_advertiser_id,
  bv.brand_id          AS v3_brand_id,
  SUM(b.impressions)      AS impressions,
  SUM(b.revenue)          AS revenue
FROM base AS b
LEFT JOIN `i-digital-adsales-prod.fw_datafeed_dim_vw.global_brand_dim`      AS gb
  ON gb.global_brand_id      = b.brand_id
LEFT JOIN `i-digital-adsales-prod.fw_datafeed_dim_vw.global_advertiser_dim` AS ga
  ON ga.global_advertiser_id = b.advertiser_id
LEFT JOIN `i-digital-adsales-prod.fw_datafeed_dim_vw.advertiser_dim` AS av
  ON av.global_advertiser_id = b.advertiser_id
LEFT JOIN `i-digital-adsales-prod.fw_datafeed_dim_vw.brand_dim`      AS bv
  ON bv.global_brand_id = b.brand_id
GROUP BY 1, 2, 3, 4, 5, 6, 7, 8, 9
ORDER BY revenue DESC
LIMIT 5000
```

**Output columns:**

| Column | Description |
|---|---|
| `module` | Channel: Advertiser Module / Programmatic / Marketplace Private / Marketplace Exchange / Reseller |
| `global_brand_id` | FW canonical brand ID |
| `global_brand_nm` | FW canonical brand name |
| `global_advertiser_id` | FW canonical advertiser ID |
| `global_advertiser_nm` | FW canonical advertiser name (legal entity) |
| `applied_industry_ids_raw` | Pipe-delimited full industry hierarchy array |
| `gb_industry_id` | First element of global brand dim's industry array (walk to root before comparing) |
| `v3_advertiser_id` | V3 brand-API path parameter — the sub-granular advertiser entity. From `advertiser_dim` |
| `v3_brand_id` | V3 brand-API path parameter — the sub-granular brand entity. From `brand_dim` |
| `impressions` | Delivered impressions |
| `revenue` | Revenue |

If a row's `v3_advertiser_id` or `v3_brand_id` is NULL in the export, the dashboard renders that row's AM Industry cell as read-only (no V3 brand mapping). Re-check the dim joins.

---

## Industry Resolution Logic

Both `applied_industry_ids_raw` and `gb_industry_id` must be resolved to depth-0 before comparing.

**From pipe string (`applied_industry_ids_raw`):**
1. Split on `|`
2. For each ID, look up depth in taxonomy
3. Return the minimum-depth entry — that's the actual assignment

**From scalar (`gb_industry_id`):**
1. Look up in taxonomy
2. If depth > 0, walk PARENT_OF map until depth = 0
3. Return the root

**Failure to do both walks = ~75% false positive mismatch rate.**

---

## FW Industry Taxonomy

Embedded in dashboard from FreeWheel Streaming Hub User Guide (Apr 2026).

- **1,094 actual industries** — three levels: parent (depth 0), child (depth 1), grandchild (depth 2)
- **50 industry groups** — rollup groupings, NOT valid for assignment
- Group IDs: `{428, 396, 397, 435, 415, 421, 432, 399, 400, 401, 393, 430, 431, 409, 411, 433, 405, 392, 422, 419, 391, 394, 414, 413, 398, 406, 434, 412, 436, 418, 437, 390, 420, 429, 439, 438, 408, 423, 402, 424, 410, 425, 404, 416, 407, 403, 417, 426, 427, 395}`
- Any `applied_industry_id` matching a group ID = **Group misuse** (flagged as high-severity issue)
- Any `applied_industry_id` not in taxonomy and not a group = **Unknown/Partner ID** (e.g., 9818 = Kalshi, likely a custom Paramount-specific industry)

---

## Known Gotchas

1. **`global_industry_ids` ≠ single assigned industry.** Always walk to root. See critical note above.
2. **Unmapped sentinel is `-1`, not NULL or empty array.** `ARRAY_LENGTH() = 0` checks will return zero rows.
3. **`advertiser_id` scalar does not exist on `demand_portfolio_hourly_fct`.** Use `global_advertiser_ids[SAFE_OFFSET(0)]` instead.
4. **`placement_id` does not exist on `demand_portfolio_hourly_fct`.** Use `insertion_order_id` or `campaign_id`.
5. **`deal_id` is only on `mpp_mkpl_daily_fct`**, not hourly. Use `sold_order_id` on the hourly MPP table.
6. **`global_industry_ids` does not exist on `direct_sold_ni_hourly_fct`, `mpp_mkpl_hourly_fct`, or `programmatic_ni_hourly_fct`.** Only on `demand_portfolio_hourly_fct`.
7. **`creative_id` = -1 on all Marketplace Private rows** in `demand_portfolio_hourly_fct`. Not a useful identifier for MPP.
8. **`global_brand_dim.global_industry_ids[SAFE_OFFSET(0)]` can lag Streaming Hub.** If a brand shows a mismatch but the Streaming Hub UI shows the correct industry, the dim record may be stale. The AM assignment in Streaming Hub is the operational truth.

---

## Editing the AM Brand Entity Industry

The Brand Industry Issues tab supports in-place editing of the AM (V3) brand
industry assignment. Click the AM Industry chip on a row to open a searchable
industry picker; pick a new industry and the row enters a "pending" state.
Stage as many changes as you want; click "Review & Apply" to see the diff and
target environment, then commit. The dashboard pushes each change via the
FreeWheel Streaming Hub MCP (`sh_1_1_show-a-brand` → mutate XML →
`sh_1_1_update-a-brand`) and writes a JSON Lines audit entry to
`server/audit.log` for every attempt. Successful changes update the row's
AM industry locally; failures stay in pending so you can retry. The 50 group
IDs are excluded from the picker (per the FW Industry Taxonomy section
above) — they are not assignable.
