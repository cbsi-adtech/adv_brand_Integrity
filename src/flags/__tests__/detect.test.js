import { describe, it, expect } from 'vitest';
import { createTaxonomy } from '../../data/taxonomy.js';
import { detectFlags } from '../detect.js';
import { flagConfig } from '../config.js';

const taxonomy = createTaxonomy({
  assignable: [
    { id: 100, name: 'Tech', depth: 0, parentId: null, path: 'Tech' },
    { id: 101, name: 'Software', depth: 1, parentId: 100, path: 'Tech › Software' },
    { id: 102, name: 'Mobile Apps', depth: 2, parentId: 101, path: 'Tech › Software › Mobile Apps' },
    { id: 200, name: 'Auto', depth: 0, parentId: null, path: 'Auto' },
    { id: 201, name: 'Dealers', depth: 1, parentId: 200, path: 'Auto › Dealers' },
  ],
  groupIds: [999],
});

function row(overrides = {}) {
  return {
    global_brand_id: 1,
    am: null, pg: null, gb: null,
    total_impressions: 0, total_revenue: 0,
    other_modules: [], flags: [], pg_creatives: null,
    ...overrides,
  };
}

function side(id, impressions = 0) {
  const e = taxonomy.byId(id);
  return {
    applied_industry_ids_raw: String(id),
    industry_names: null,
    resolved_industry_id: id,
    resolved_industry_name: e.name,
    resolved_industry_depth: e.depth,
    resolved_industry_path: taxonomy.pathOf(id),
    impressions, revenue: 0,
  };
}

describe('F1 (Programmatic Module — watch-list)', () => {
  // Real watch-listed id from HIGH_LEVEL_PARENTS_TO_WATCH: 202 = Clothing Stores
  const watchedTaxonomy = createTaxonomy({
    assignable: [
      { id: 202, name: 'Clothing Stores', depth: 0, parentId: null, path: 'Clothing Stores' },
      { id: 2020, name: "Men's", depth: 1, parentId: 202, path: "Clothing Stores › Men's" },
      { id: 500, name: 'Safe Root', depth: 0, parentId: null, path: 'Safe Root' },
    ],
    groupIds: [],
  });

  function watchedSide(id, impressions = 0) {
    const e = watchedTaxonomy.byId(id);
    return {
      applied_industry_ids_raw: String(id),
      industry_names: null,
      resolved_industry_id: id,
      resolved_industry_name: e.name,
      resolved_industry_depth: e.depth,
      resolved_industry_path: watchedTaxonomy.pathOf(id),
      impressions, revenue: 0,
    };
  }

  it('fires when pg.resolved_industry_id is in HIGH_LEVEL_PARENTS_TO_WATCH', () => {
    const rows = detectFlags([row({ pg: watchedSide(202) })], watchedTaxonomy, flagConfig);
    expect(rows[0].flags.some((f) => f.type === 'F1' && f.side === 'pg')).toBe(true);
  });

  it('does not fire when pg.resolved_industry_id is depth-0 but not watch-listed', () => {
    const rows = detectFlags([row({ pg: watchedSide(500) })], watchedTaxonomy, flagConfig);
    expect(rows[0].flags.some((f) => f.type === 'F1' && f.side === 'pg')).toBe(false);
  });

  it('does not fire when pg.resolved_industry_id is a non-watched descendant of a watched parent', () => {
    const rows = detectFlags([row({ pg: watchedSide(2020) })], watchedTaxonomy, flagConfig);
    expect(rows[0].flags.some((f) => f.type === 'F1' && f.side === 'pg')).toBe(false);
  });

  it('does not fire on the AM side (AM-side F1 was removed)', () => {
    const rows = detectFlags([row({ am: watchedSide(202), pg: null })], watchedTaxonomy, flagConfig);
    expect(rows[0].flags.some((f) => f.type === 'F1')).toBe(false);
  });

  it('adds F5 high-impact sub-marker when pg impressions exceed threshold', () => {
    const rows = detectFlags([row({ pg: watchedSide(202, 200_000) })], watchedTaxonomy, flagConfig);
    expect(rows[0].flags.find((f) => f.type === 'F1' && f.side === 'pg')?.highImpact).toBe(true);
  });
});

describe('F2 root mismatch', () => {
  it('fires when AM and Programmatic Module have different roots', () => {
    const rows = detectFlags([row({ am: side(101), pg: side(200) })], taxonomy, flagConfig);
    expect(rows[0].flags.some((f) => f.type === 'F2')).toBe(true);
  });

  it('does not fire when roots match', () => {
    const rows = detectFlags([row({ am: side(101), pg: side(102) })], taxonomy, flagConfig);
    expect(rows[0].flags.some((f) => f.type === 'F2')).toBe(false);
  });

  it('does not fire when one side is null', () => {
    const rows = detectFlags([row({ am: side(101), pg: null })], taxonomy, flagConfig);
    expect(rows[0].flags.some((f) => f.type === 'F2')).toBe(false);
  });
});

describe('F3a lateral mismatch', () => {
  it('fires when same root but neither side is ancestor of the other', () => {
    const t = createTaxonomy({
      assignable: [
        { id: 100, name: 'Tech', depth: 0, parentId: null, path: 'Tech' },
        { id: 101, name: 'Software', depth: 1, parentId: 100, path: 'Tech › Software' },
        { id: 103, name: 'Hardware', depth: 1, parentId: 100, path: 'Tech › Hardware' },
      ],
      groupIds: [],
    });
    const r = row({
      am: { applied_industry_ids_raw: '101', industry_names: null, resolved_industry_id: 101,
            resolved_industry_name: 'Software', resolved_industry_depth: 1, resolved_industry_path: 'Tech › Software',
            impressions: 0, revenue: 0 },
      pg: { applied_industry_ids_raw: '103', industry_names: null, resolved_industry_id: 103,
            resolved_industry_name: 'Hardware', resolved_industry_depth: 1, resolved_industry_path: 'Tech › Hardware',
            impressions: 0, revenue: 0 },
    });
    const rows = detectFlags([r], t, flagConfig);
    expect(rows[0].flags.some((f) => f.type === 'F3a')).toBe(true);
  });
});

describe('F3b ancestor mismatch (AM parent, Programmatic descendant only)', () => {
  it('fires when AM = parent and Programmatic Module = descendant', () => {
    const rows = detectFlags([row({ am: side(101), pg: side(102) })], taxonomy, flagConfig);
    expect(rows[0].flags.some((f) => f.type === 'F3b')).toBe(true);
  });

  it('does not fire in reverse (AM = descendant, Programmatic = parent)', () => {
    const rows = detectFlags([row({ am: side(102), pg: side(101) })], taxonomy, flagConfig);
    expect(rows[0].flags.some((f) => f.type === 'F3b')).toBe(false);
  });
});

describe('F4 unmapped / group-id misuse', () => {
  it('F4a fires when AM applied id is a group id', () => {
    const r = row({
      am: { applied_industry_ids_raw: '999', industry_names: null,
            resolved_industry_id: null, resolved_industry_name: null,
            resolved_industry_depth: null, resolved_industry_path: null,
            impressions: 0, revenue: 0 },
    });
    const rows = detectFlags([r], taxonomy, flagConfig);
    expect(rows[0].flags.some((f) => f.type === 'F4a')).toBe(true);
  });

  it('F4b fires when AM applied id is sentinel -1', () => {
    const r = row({
      am: { applied_industry_ids_raw: '-1', industry_names: null,
            resolved_industry_id: null, resolved_industry_name: null,
            resolved_industry_depth: null, resolved_industry_path: null,
            impressions: 0, revenue: 0 },
    });
    const rows = detectFlags([r], taxonomy, flagConfig);
    expect(rows[0].flags.some((f) => f.type === 'F4b')).toBe(true);
  });

  it('F4c fires when Programmatic industry name did not resolve', () => {
    const r = row({
      pg: { applied_industry_ids_raw: null, industry_names: ['Nonexistent'],
            resolved_industry_id: null, resolved_industry_name: null,
            resolved_industry_depth: null, resolved_industry_path: null,
            impressions: 0, revenue: 0 },
    });
    const rows = detectFlags([r], taxonomy, flagConfig);
    expect(rows[0].flags.some((f) => f.type === 'F4c')).toBe(true);
  });
});
