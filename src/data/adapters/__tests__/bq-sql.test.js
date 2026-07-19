import { describe, it, expect } from 'vitest';
import { detectBqSqlFormat, parseBqSql } from '../bq-sql.js';

const SAMPLE_CSV = [
  'global_brand_id,global_brand_nm,global_advertiser_id,global_advertiser_nm,v3_advertiser_id,v3_brand_id,am_applied_industry_ids_raw,am_impressions,am_revenue,ind_applied_industry_ids_raw,ind_impressions,ind_revenue,gb_industry_id',
  '1378215,Life360,5001,Life360 Inc,4291,8821,123|456,1000000,15000,789|456,500000,7500,456',
  '1047050,Midas,5002,Midas Corp,,,12,2000000,30000,,0,0,12',
].join('\n');

describe('detectBqSqlFormat', () => {
  it('matches when header has am_applied_industry_ids_raw and global_brand_id', () => {
    expect(detectBqSqlFormat(SAMPLE_CSV)).toBe(true);
  });

  it('does not match the FW report header', () => {
    const fw = 'Global Brand Name,Global Brand ID,Programmatic Industry Name,Run Revenue,Gross Counted Ads';
    expect(detectBqSqlFormat(fw)).toBe(false);
  });
});

describe('parseBqSql', () => {
  it('returns one RawRecord per row', () => {
    const records = parseBqSql(SAMPLE_CSV);
    expect(records).toHaveLength(2);
    expect(records[0].source).toBe('bq-sql');
    expect(records[0].global_brand_id).toBe(1378215);
  });

  it('populates am slot from am_* columns', () => {
    const [r] = parseBqSql(SAMPLE_CSV);
    expect(r.am).toEqual({
      applied_industry_ids_raw: '123|456',
      industry_names: null,
      impressions: 1000000,
      revenue: 15000,
    });
  });

  it('populates pg slot from ind_* columns', () => {
    const [r] = parseBqSql(SAMPLE_CSV);
    expect(r.pg).toEqual({
      applied_industry_ids_raw: '789|456',
      industry_names: null,
      impressions: 500000,
      revenue: 7500,
    });
  });

  it('emits null am/pg when the side has no data', () => {
    const [, midas] = parseBqSql(SAMPLE_CSV);
    expect(midas.am).not.toBeNull();
    expect(midas.pg).toBeNull();
  });

  it('populates gb slot from gb_industry_id', () => {
    const [r] = parseBqSql(SAMPLE_CSV);
    expect(r.gb).toEqual({ industry_id: 456 });
  });

  it('prefers configured_industry_ids_raw pipe string for the gb slot when present', () => {
    const csv = [
      'global_brand_id,global_brand_nm,am_applied_industry_ids_raw,am_impressions,am_revenue,gb_industry_id,configured_industry_ids_raw',
      '1,BrandA,12,100,5,456,123|456',
    ].join('\n');
    const [r] = parseBqSql(csv);
    expect(r.gb).toEqual({
      applied_industry_ids_raw: '123|456',
      industry_names: null,
    });
  });

  it('gb slot handles a single-id configured_industry_ids_raw (no pipe)', () => {
    const csv = [
      'global_brand_id,global_brand_nm,am_applied_industry_ids_raw,am_impressions,am_revenue,configured_industry_ids_raw',
      '1,BrandA,12,100,5,123',
    ].join('\n');
    const [r] = parseBqSql(csv);
    expect(r.gb).toEqual({
      applied_industry_ids_raw: '123',
      industry_names: null,
    });
  });

  it('falls back to plain gb_industry_id when configured_industry_ids_raw is absent', () => {
    const [r] = parseBqSql(SAMPLE_CSV);
    expect(r.gb).toEqual({ industry_id: 456 });
  });

  it('coerces v3 ids to int or null', () => {
    const records = parseBqSql(SAMPLE_CSV);
    expect(records[0].v3_advertiser_id).toBe(4291);
    expect(records[1].v3_advertiser_id).toBeNull();
  });
});
