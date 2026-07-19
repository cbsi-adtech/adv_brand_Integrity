import { HIGH_LEVEL_PARENTS_TO_WATCH } from './config.js';

export function detectFlags(rows, taxonomy, config) {
  return rows.map((row) => {
    const flags = [];
    detectF1(row, taxonomy, config, flags);
    detectF2(row, taxonomy, config, flags);
    detectF3(row, taxonomy, config, flags);
    detectF4(row, taxonomy, config, flags);
    return { ...row, flags };
  });
}

function detectF1(row, _taxonomy, config, flags) {
  // F1 fires when Programmatic Module's resolved industry is one of the
  // hand-curated "too-generic parents" in HIGH_LEVEL_PARENTS_TO_WATCH.
  // The user maintains this list; depth-based detection produced too much noise.
  const s = row.pg;
  if (s && s.resolved_industry_id != null && HIGH_LEVEL_PARENTS_TO_WATCH.has(s.resolved_industry_id)) {
    const flag = {
      type: 'F1',
      side: 'pg',
      severity: 'high',
      note: `Programmatic Module mapped to '${s.resolved_industry_name}' — flagged as too-generic parent. Ask FreeWheel to drill down or override Advertiser Module.`,
    };
    if (s.impressions > config.highImpressionThreshold) {
      flag.highImpact = true;
    }
    flags.push(flag);
  }

  // F1_AM: same watch-list applied to the Advertiser Module side — an
  // AM-applied too-generic parent also needs reclassification. Distinct
  // type so filters/badges keep the sides separate.
  const am = row.am;
  if (am && am.resolved_industry_id != null && HIGH_LEVEL_PARENTS_TO_WATCH.has(am.resolved_industry_id)) {
    flags.push({
      type: 'F1_AM',
      side: 'am',
      severity: 'high',
      note: `Advertiser Module mapped to '${am.resolved_industry_name}' — flagged as too-generic parent. Drill down to a more specific child industry.`,
    });
  }
}

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

function detectF3(row, taxonomy, _config, flags) {
  if (!row.am || !row.pg) return;
  const amId = row.am.resolved_industry_id;
  const pgId = row.pg.resolved_industry_id;
  if (amId == null || pgId == null || amId === pgId) return;

  const amRoot = taxonomy.walkToDepth0(amId);
  const pgRoot = taxonomy.walkToDepth0(pgId);
  if (!amRoot || !pgRoot || amRoot.id !== pgRoot.id) return;

  const amIsAncestor = taxonomy.isAncestor(amId, pgId);
  const pgIsAncestor = taxonomy.isAncestor(pgId, amId);

  if (amIsAncestor) {
    flags.push({
      type: 'F3b',
      side: 'both',
      severity: 'medium',
      note: 'Programmatic Module may be too narrow — consider asking FreeWheel to broaden, or Advertiser Module may need to drill down to match.',
    });
  } else if (!pgIsAncestor) {
    flags.push({
      type: 'F3a',
      side: 'both',
      severity: 'medium',
      note: `Advertiser Module ('${row.am.resolved_industry_name}') and Programmatic Module ('${row.pg.resolved_industry_name}') picked different branches under root '${amRoot.name}'.`,
    });
  }
}

function detectF4(row, taxonomy, _config, flags) {
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

  if (row.pg?.industry_names && row.pg.industry_names.length > 0 && row.pg.resolved_industry_id == null) {
    flags.push({ type: 'F4c', side: 'pg', severity: 'low',
      note: 'Programmatic Module industry name did not resolve to a taxonomy entry.' });
  }
}
