import { parseCsv } from './csv-parser.js';

const REQUIRED_HEADERS = ['global_brand_id', 'am_applied_industry_ids_raw'];

export function detectBqSqlFormat(text) {
  if (!text) return false;
  const firstLine = text.split(/\r?\n/, 1)[0] || '';
  return REQUIRED_HEADERS.every((h) => firstLine.includes(h));
}

function emptyToNull(v) {
  return v === '' || v === null || v === undefined ? null : v;
}

function sideOrNull(rawIds, impressions, revenue) {
  if (rawIds == null || rawIds === '') return null;
  return {
    applied_industry_ids_raw: String(rawIds),
    industry_names: null,
    impressions: impressions ?? 0,
    revenue: revenue ?? 0,
  };
}

export function parseBqSql(text) {
  const rows = parseCsv(text);
  return rows.map((r) => ({
    source: 'bq-sql',
    global_brand_id: Number(r.global_brand_id),
    global_brand_nm: r.global_brand_nm ?? null,
    global_advertiser_id: emptyToNull(r.global_advertiser_id),
    global_advertiser_nm: r.global_advertiser_nm ?? null,
    v3_advertiser_id: emptyToNull(r.v3_advertiser_id),
    v3_brand_id: emptyToNull(r.v3_brand_id),
    am: sideOrNull(r.am_applied_industry_ids_raw, r.am_impressions, r.am_revenue),
    pg: sideOrNull(r.ind_applied_industry_ids_raw, r.ind_impressions, r.ind_revenue),
    gb: r.gb_industry_id != null ? { industry_id: Number(r.gb_industry_id) } : null,
  }));
}
