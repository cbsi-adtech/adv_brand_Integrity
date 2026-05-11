import { describe, it, expect } from 'vitest';
import { createTaxonomy } from '../taxonomy.js';
import { pivotToCanonical } from '../canonical.js';

const taxonomy = createTaxonomy({
  assignable: [
    { id: 100, name: 'Tech', depth: 0, parentId: null, path: 'Tech' },
    { id: 101, name: 'Software', depth: 1, parentId: 100, path: 'Tech › Software' },
    { id: 200, name: 'Auto', depth: 0, parentId: null, path: 'Auto' },
  ],
  groupIds: [],
});

describe('pivotToCanonical', () => {
  it('emits one row per global_brand_id', () => {
    const records = [
      { source: 'bq-sql', global_brand_id: 1, global_brand_nm: 'A',
        global_advertiser_id: 10, global_advertiser_nm: 'AdvA',
        v3_advertiser_id: 1000, v3_brand_id: 2000,
        am: { applied_industry_ids_raw: '101', industry_names: null, impressions: 100, revenue: 5 },
        pg: { applied_industry_ids_raw: '200', industry_names: null, impressions: 50, revenue: 2 },
        gb: { industry_id: 101 } },
    ];
    const rows = pivotToCanonical(records, taxonomy);
    expect(rows).toHaveLength(1);
    expect(rows[0].global_brand_id).toBe(1);
  });

  it('resolves am.resolved_industry_id from pipe-string', () => {
    const records = [
      { source: 'bq-sql', global_brand_id: 1, global_brand_nm: 'A',
        global_advertiser_id: 10, global_advertiser_nm: 'AdvA',
        v3_advertiser_id: null, v3_brand_id: null,
        am: { applied_industry_ids_raw: '100|101', industry_names: null, impressions: 100, revenue: 5 },
        pg: null, gb: null },
    ];
    const [row] = pivotToCanonical(records, taxonomy);
    expect(row.am.resolved_industry_id).toBe(100);
    expect(row.am.resolved_industry_name).toBe('Tech');
    expect(row.am.resolved_industry_path).toBe('Tech');
    expect(row.am.resolved_industry_depth).toBe(0);
  });

  it('resolves pg from industry_names via taxonomy.byName', () => {
    const records = [
      { source: 'fw-report', global_brand_id: 1, global_brand_nm: 'A',
        global_advertiser_id: null, global_advertiser_nm: null,
        v3_advertiser_id: null, v3_brand_id: null,
        am: null,
        pg: { applied_industry_ids_raw: null, industry_names: ['Software'], impressions: 1, revenue: 1 },
        gb: null },
    ];
    const [row] = pivotToCanonical(records, taxonomy);
    expect(row.pg.resolved_industry_id).toBe(101);
    expect(row.pg.resolved_industry_path).toBe('Tech › Software');
  });

  it('FW report wins for pg slot when both BQ and FW provide it', () => {
    const records = [
      { source: 'bq-sql', global_brand_id: 1, global_brand_nm: 'A',
        global_advertiser_id: 10, global_advertiser_nm: 'AdvA',
        v3_advertiser_id: null, v3_brand_id: null,
        am: null,
        pg: { applied_industry_ids_raw: '200', industry_names: null, impressions: 999, revenue: 999 },
        gb: null },
      { source: 'fw-report', global_brand_id: 1, global_brand_nm: 'A',
        global_advertiser_id: null, global_advertiser_nm: null,
        v3_advertiser_id: null, v3_brand_id: null,
        am: null,
        pg: { applied_industry_ids_raw: null, industry_names: ['Tech'], impressions: 1, revenue: 1 },
        gb: null },
    ];
    const [row] = pivotToCanonical(records, taxonomy);
    expect(row.pg.resolved_industry_id).toBe(100);
    expect(row.pg.impressions).toBe(1);
    expect(row.pg.bq_fallback.impressions).toBe(999);
  });

  it('advertiser identity from BQ side when present', () => {
    const records = [
      { source: 'fw-report', global_brand_id: 1, global_brand_nm: 'A (FW name)',
        global_advertiser_id: null, global_advertiser_nm: null,
        v3_advertiser_id: null, v3_brand_id: null,
        am: null,
        pg: { applied_industry_ids_raw: null, industry_names: ['Tech'], impressions: 1, revenue: 1 },
        gb: null },
      { source: 'bq-sql', global_brand_id: 1, global_brand_nm: 'A (BQ name)',
        global_advertiser_id: 10, global_advertiser_nm: 'AdvA',
        v3_advertiser_id: 1000, v3_brand_id: 2000,
        am: { applied_industry_ids_raw: '100', industry_names: null, impressions: 5, revenue: 1 },
        pg: null, gb: null },
    ];
    const [row] = pivotToCanonical(records, taxonomy);
    expect(row.global_brand_nm).toBe('A (BQ name)');
    expect(row.global_advertiser_id).toBe(10);
    expect(row.v3_brand_id).toBe(2000);
  });
});
