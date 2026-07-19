import { parseCsv } from './csv-parser.js';
import { KNOWN_INDUSTRY_NAMES } from '../taxonomy.js';

const FW_HEADER_SIGNATURE = /^Global Brand Name,Global Brand ID,/;

// Known taxonomy names sorted longest-first so greedy matching prefers
// e.g. "Cosmetics, Beauty Supply, and Perfume Stores - All else" over
// "Cosmetics, Beauty Supply, and Perfume Stores".
const NAMES_BY_LENGTH = [...KNOWN_INDUSTRY_NAMES].sort((a, b) => b.length - a.length);

// FW joins multiple industry names with commas, but 32 real taxonomy names
// contain commas themselves. Greedy longest-match against the known-name
// list; unknown segments fall back to consuming up to the next comma
// (the previous behavior).
export function splitFwIndustryNames(joined, knownNames = NAMES_BY_LENGTH) {
  const out = [];
  let i = 0;
  const n = joined.length;
  while (i < n) {
    // Skip separators (comma + optional whitespace) between names.
    while (i < n && (joined[i] === ',' || joined[i] === ' ')) i++;
    if (i >= n) break;

    let matched = null;
    for (const name of knownNames) {
      if (joined.startsWith(name, i)) {
        const end = i + name.length;
        if (end === n || joined[end] === ',') { matched = name; break; }
      }
    }

    if (matched) {
      out.push(matched);
      i += matched.length;
    } else {
      const next = joined.indexOf(',', i);
      const end = next === -1 ? n : next;
      const piece = joined.slice(i, end).trim();
      if (piece) out.push(piece);
      i = end;
    }
  }
  return out;
}

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
        ? splitFwIndustryNames(r['Programmatic Industry Name'])
        : [],
      impressions: parseFwNumber(r['Gross Counted Ads']),
      revenue: parseFwNumber(r['Run Revenue']),
    },
    gb: null,
  }));
}
