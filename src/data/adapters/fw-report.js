import { parseCsv } from './csv-parser.js';

const FW_HEADER_SIGNATURE = /^Global Brand Name,Global Brand ID,/;

function findHeaderIndex(text) {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    if (FW_HEADER_SIGNATURE.test(lines[i])) return i;
  }
  return -1;
}

export function detectFwReportFormat(text) {
  return findHeaderIndex(text) >= 0;
}

function parseFwNumber(v) {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return v;
  const cleaned = String(v).replace(/,/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function parseFwReport(text) {
  const headerIdx = findHeaderIndex(text);
  if (headerIdx < 0) return [];

  const rows = parseCsv(text, { firstDataLine: headerIdx });
  return rows.map((r) => ({
    source: 'fw-report',
    global_brand_id: Number(r['Global Brand ID']),
    global_brand_nm: r['Global Brand Name'] ?? null,
    global_advertiser_id: null,
    global_advertiser_nm: null,
    v3_advertiser_id: null,
    v3_brand_id: null,
    am: null,
    pg: {
      applied_industry_ids_raw: null,
      industry_names: typeof r['Programmatic Industry Name'] === 'string'
        ? r['Programmatic Industry Name'].split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      impressions: parseFwNumber(r['Gross Counted Ads']),
      revenue: parseFwNumber(r['Run Revenue']),
    },
    gb: null,
  }));
}
