import { describe, it, expect } from 'vitest';
import { detectFormat, loadCsv } from '../index.js';

const BQ_CSV = 'global_brand_id,am_applied_industry_ids_raw\n1,123|456';
const FW_CSV = [
  "Notes: This report reflects data from the 'Programmatic' sales channel",
  'Global Brand Name,Global Brand ID,Programmatic Industry Name,Run Revenue,Gross Counted Ads',
  'Life360,1378215,Tech,1.0,1',
].join('\n');

describe('detectFormat', () => {
  it('returns "bq-sql" for BQ CSV', () => {
    expect(detectFormat(BQ_CSV)).toBe('bq-sql');
  });
  it('returns "fw-report" for FW CSV', () => {
    expect(detectFormat(FW_CSV)).toBe('fw-report');
  });
  it('returns null for unknown content', () => {
    expect(detectFormat('foo,bar\n1,2')).toBeNull();
  });
});

describe('loadCsv', () => {
  it('dispatches to bq-sql and returns RawRecord[]', () => {
    const records = loadCsv(BQ_CSV);
    expect(records[0].source).toBe('bq-sql');
  });
  it('dispatches to fw-report and returns RawRecord[]', () => {
    const records = loadCsv(FW_CSV);
    expect(records[0].source).toBe('fw-report');
  });
  it('throws on unknown format', () => {
    expect(() => loadCsv('foo,bar\n1,2')).toThrow(/unrecognized/i);
  });
});
