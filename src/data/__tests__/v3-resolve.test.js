import { describe, it, expect } from 'vitest';
import { countResolved, patchV3 } from '../v3-resolve.js';

describe('countResolved', () => {
  it('counts results with both v3 ids as hits, the rest as misses', () => {
    const results = [
      { global_brand_id: 1, v3_advertiser_id: 100, v3_brand_id: 200 },
      { global_brand_id: 2, v3_advertiser_id: null, v3_brand_id: 300 },
      { global_brand_id: 3, v3_advertiser_id: 400, v3_brand_id: null },
      { global_brand_id: 4 },
      { global_brand_id: 5, v3_advertiser_id: 500, v3_brand_id: 600 },
    ];
    expect(countResolved(results)).toEqual({ hits: 2, misses: 3 });
  });

  it('treats 0 as a valid id (only null/undefined are misses)', () => {
    expect(countResolved([{ v3_advertiser_id: 0, v3_brand_id: 0 }])).toEqual({ hits: 1, misses: 0 });
  });

  it('returns zeros for an empty or missing list', () => {
    expect(countResolved([])).toEqual({ hits: 0, misses: 0 });
    expect(countResolved(undefined)).toEqual({ hits: 0, misses: 0 });
  });

  it('is pure — calling twice on the same input gives the same answer (no accumulation)', () => {
    const results = [{ v3_advertiser_id: 1, v3_brand_id: 2 }];
    expect(countResolved(results)).toEqual(countResolved(results));
  });
});

describe('patchV3', () => {
  const rows = [
    { global_brand_id: 1, global_brand_nm: 'A', v3_advertiser_id: null, v3_brand_id: null, flags: [] },
    { global_brand_id: 2, global_brand_nm: 'B', v3_advertiser_id: 77, v3_brand_id: 88, flags: [] },
    { global_brand_id: 3, global_brand_nm: 'C', v3_advertiser_id: null, v3_brand_id: null, flags: [] },
  ];

  it('fills missing v3 ids from the map', () => {
    const out = patchV3(rows, { 1: { v3_advertiser_id: 10, v3_brand_id: 20 } });
    expect(out[0]).toMatchObject({ v3_advertiser_id: 10, v3_brand_id: 20 });
  });

  it('never overwrites v3 ids that are already present', () => {
    const out = patchV3(rows, { 2: { v3_advertiser_id: 999, v3_brand_id: 999 } });
    expect(out[1]).toMatchObject({ v3_advertiser_id: 77, v3_brand_id: 88 });
  });

  it('keeps row object identity for unpatched rows (cheap re-render check)', () => {
    const out = patchV3(rows, { 1: { v3_advertiser_id: 10, v3_brand_id: 20 } });
    expect(out[1]).toBe(rows[1]);
    expect(out[2]).toBe(rows[2]);
  });

  it('returns the same array contents with an empty map', () => {
    const out = patchV3(rows, {});
    expect(out).toHaveLength(3);
    expect(out[0]).toBe(rows[0]);
  });
});
