import { describe, it, expect } from 'vitest';
import { detectFwReportFormat, parseFwReport } from '../fw-report.js';

const SAMPLE = [
  'Report Name: Analytics 2026-05-11 09_42_53',
  'Start Date: 05/08/2026 EDT End Date: 05/10/2026 EDT Generated Date: 05/11/2026 09:44:50 EDT',
  'Pre-Run Filters:',
  "Notes: This report reflects data from the 'Programmatic' sales channel",
  'Global Brand Name,Global Brand ID,Programmatic Industry Name,Run Revenue,Gross Counted Ads',
  'Life360,1378215,Technology Sector,63.90226,"2,779"',
  'Midas,1047050,Automotive Repair Shops,"2,628.91473","315,440"',
  'Xdemvy,1660968,"Pharma A,Pharma A - All else,Sub1,Sub2","2,112.69301","126,950"',
].join('\n');

describe('detectFwReportFormat', () => {
  it('matches when "Global Brand Name,Global Brand ID,..." header is present', () => {
    expect(detectFwReportFormat(SAMPLE)).toBe(true);
  });

  it('does not match a BQ header', () => {
    expect(detectFwReportFormat('global_brand_id,am_applied_industry_ids_raw,...')).toBe(false);
  });

  it('skips up to 10 metadata lines looking for header', () => {
    expect(detectFwReportFormat(SAMPLE)).toBe(true);
  });
});

describe('parseFwReport — header detection skips metadata rows', () => {
  it('emits one RawRecord per data row', () => {
    const records = parseFwReport(SAMPLE);
    expect(records).toHaveLength(3);
  });

  it('parses global_brand_id as integer', () => {
    const [life360] = parseFwReport(SAMPLE);
    expect(life360.global_brand_id).toBe(1378215);
  });
});

describe('parseFwReport — industry name list + numbers', () => {
  it('splits Programmatic Industry Name on commas', () => {
    const [, , xdemvy] = parseFwReport(SAMPLE);
    expect(xdemvy.pg.industry_names).toEqual([
      'Pharma A',
      'Pharma A - All else',
      'Sub1',
      'Sub2',
    ]);
  });

  it('handles single-industry rows', () => {
    const [life360] = parseFwReport(SAMPLE);
    expect(life360.pg.industry_names).toEqual(['Technology Sector']);
  });

  it('parses thousands-separated impressions/revenue correctly', () => {
    const [, midas] = parseFwReport(SAMPLE);
    expect(midas.pg.impressions).toBe(315440);
    expect(midas.pg.revenue).toBeCloseTo(2628.91473, 5);
  });

  it('keeps a known comma-containing taxonomy name as a single industry', () => {
    const csv = [
      'Global Brand Name,Global Brand ID,Programmatic Industry Name,Run Revenue,Gross Counted Ads',
      'Sephora,11,"Cosmetics, Beauty Supply, and Perfume Stores",1.5,10',
    ].join('\n');
    const [r] = parseFwReport(csv);
    expect(r.pg.industry_names).toEqual(['Cosmetics, Beauty Supply, and Perfume Stores']);
  });

  it('splits two industries where one contains commas', () => {
    const csv = [
      'Global Brand Name,Global Brand ID,Programmatic Industry Name,Run Revenue,Gross Counted Ads',
      'X,12,"Restaurants, Cosmetics, Beauty Supply, and Perfume Stores",1.5,10',
    ].join('\n');
    const [r] = parseFwReport(csv);
    expect(r.pg.industry_names).toEqual([
      'Restaurants',
      'Cosmetics, Beauty Supply, and Perfume Stores',
    ]);
  });

  it('splits known comma-containing names joined without a space after the comma', () => {
    const csv = [
      'Global Brand Name,Global Brand ID,Programmatic Industry Name,Run Revenue,Gross Counted Ads',
      'Y,13,"Cosmetics, Beauty Supply, and Perfume Stores,Restaurants",1.5,10',
    ].join('\n');
    const [r] = parseFwReport(csv);
    expect(r.pg.industry_names).toEqual([
      'Cosmetics, Beauty Supply, and Perfume Stores',
      'Restaurants',
    ]);
  });

  it('coerces empty/missing revenue to 0', () => {
    const noRev = [
      'Global Brand Name,Global Brand ID,Programmatic Industry Name,Run Revenue,Gross Counted Ads',
      'X,1,Tech,,5',
    ].join('\n');
    const [r] = parseFwReport(noRev);
    expect(r.pg.revenue).toBe(0);
  });
});
