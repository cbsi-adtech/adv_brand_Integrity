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

  it('side="pg-only" requires pg side present and no am', () => {
    expect(applyFilters(rows, { side: 'pg-only' })).toEqual([rows[1]]);
  });

  it('severity filter (multi)', () => {
    expect(applyFilters(rows, { severities: ['low'] })).toEqual([rows[1]]);
  });

  it('minPgImpressions filter', () => {
    expect(applyFilters(rows, { minPgImpressions: 100 })).toEqual([rows[0]]);
  });
});
