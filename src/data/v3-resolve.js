// Pure helper for V3 resolution bookkeeping. Extracted from AppNew so the
// hit/miss counting is not mutated inside a React state updater (updaters
// re-run under StrictMode, which double-counted).
export function countResolved(results) {
  let hits = 0;
  let misses = 0;
  for (const r of results ?? []) {
    if (r.v3_advertiser_id != null && r.v3_brand_id != null) hits++;
    else misses++;
  }
  return { hits, misses };
}

// Fill missing v3 ids from a {global_brand_id -> {v3_advertiser_id, v3_brand_id}}
// map. Rows that need no patch keep their object identity, so memoized
// consumers can skip re-rendering them. Applied AFTER pivot + flag detection
// (flags never read v3 ids), which keeps the expensive pipeline off the
// resolve-progress hot path.
export function patchV3(rows, v3Map) {
  return rows.map((row) => {
    const m = v3Map[row.global_brand_id];
    if (!m) return row;
    if (row.v3_advertiser_id != null && row.v3_brand_id != null) return row;
    return {
      ...row,
      v3_advertiser_id: row.v3_advertiser_id ?? m.v3_advertiser_id,
      v3_brand_id:      row.v3_brand_id      ?? m.v3_brand_id,
    };
  });
}
