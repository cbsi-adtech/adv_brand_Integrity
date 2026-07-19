import { describe, it, expect } from 'vitest';
import { impactSummary, fmtCurrencyCompact, fmtNumberCompact } from '../impact.js';

const rows = [
  { flags: [{ type: 'F2' }], total_revenue: 1200, total_impressions: 50_000 },
  { flags: [{ type: 'F1', highImpact: true, side: 'pg' }], total_revenue: 300.5, total_impressions: 2_000_000 },
  { flags: [], total_revenue: 99_999, total_impressions: 9_999_999 },   // clean row — excluded
  { flags: [{ type: 'F4c' }], total_revenue: 0, total_impressions: 100 },
];

describe('impactSummary', () => {
  it('sums revenue and impressions over flagged rows only', () => {
    const s = impactSummary(rows);
    expect(s.revenueAtRisk).toBeCloseTo(1500.5);
    expect(s.impressionsAtRisk).toBe(2_050_100);
  });

  it('counts flagged brands and high-impact brands', () => {
    const s = impactSummary(rows);
    expect(s.flaggedCount).toBe(3);
    expect(s.highImpactCount).toBe(1);
  });

  it('returns zeros for empty input', () => {
    expect(impactSummary([])).toEqual({
      revenueAtRisk: 0, impressionsAtRisk: 0, flaggedCount: 0, highImpactCount: 0,
    });
  });
});

describe('compact formatters', () => {
  it('formats currency compactly', () => {
    expect(fmtCurrencyCompact(1500.5)).toBe('$1.5K');
    expect(fmtCurrencyCompact(2_340_000)).toBe('$2.3M');
    expect(fmtCurrencyCompact(0)).toBe('$0');
  });

  it('formats numbers compactly', () => {
    expect(fmtNumberCompact(2_050_100)).toBe('2.1M');
    expect(fmtNumberCompact(950)).toBe('950');
  });
});
