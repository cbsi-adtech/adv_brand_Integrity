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

    if (r.am && r.source === 'bq-sql') {
      row.am = resolveSide(r.am, taxonomy);
    }

    if (r.pg) {
      if (r.source === 'fw-report') {
        row.pg = resolveSide(r.pg, taxonomy);
      } else if (r.source === 'bq-sql' && row.pg == null) {
        row._bqPgRaw = r.pg;
      }
    }

    if (r.source === 'bq-sql') {
      row.global_brand_nm = r.global_brand_nm ?? row.global_brand_nm;
      row.global_advertiser_id = r.global_advertiser_id ?? row.global_advertiser_id;
      row.global_advertiser_nm = r.global_advertiser_nm ?? row.global_advertiser_nm;
      row.v3_advertiser_id = r.v3_advertiser_id ?? row.v3_advertiser_id;
      row.v3_brand_id = r.v3_brand_id ?? row.v3_brand_id;
      if (r.gb) row.gb = r.gb;
    }
  }

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
