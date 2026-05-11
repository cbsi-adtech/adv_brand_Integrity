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
