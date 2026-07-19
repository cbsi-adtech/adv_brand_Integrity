// Impact rollup for the KPI header: revenue and impressions are the signals
// that size an integrity issue — the more delivery behind a flagged brand,
// the bigger the impact of its misclassification.

export function impactSummary(rows) {
  let revenueAtRisk = 0;
  let impressionsAtRisk = 0;
  let flaggedCount = 0;
  let highImpactCount = 0;

  for (const r of rows ?? []) {
    const flags = r.flags ?? [];
    if (flags.length === 0) continue;
    flaggedCount++;
    revenueAtRisk += r.total_revenue ?? 0;
    impressionsAtRisk += r.total_impressions ?? 0;
    if (flags.some((f) => f.type === 'F1' && f.highImpact)) highImpactCount++;
  }

  return { revenueAtRisk, impressionsAtRisk, flaggedCount, highImpactCount };
}

const compactNumber = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
const compactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1,
});

export function fmtCurrencyCompact(v) {
  return compactCurrency.format(v ?? 0);
}

export function fmtNumberCompact(v) {
  return compactNumber.format(v ?? 0);
}
