export function splitCsvLine(line, delim) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { cur += c; }
    } else {
      if (c === '"') { inQuotes = true; }
      else if (c === delim) { out.push(cur); cur = ''; }
      else { cur += c; }
    }
  }
  out.push(cur);
  return out;
}

// Character-walk CSV tokenizer: honors quotes across row boundaries so a
// quoted field containing \n or \r\n stays in one row. "" inside quotes is
// an escaped quote. Rows are split on \n or \r\n outside quotes.
function tokenizeCsv(text, delim) {
  const rows = [];
  let row = [];
  let cur = '';
  let inQuotes = false;

  const endField = () => { row.push(cur); cur = ''; };
  const endRow = () => {
    endField();
    // Skip fully-empty rows (blank lines), matching the previous
    // line-filtering behavior.
    if (!(row.length === 1 && row[0] === '')) rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { cur += c; }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delim) {
      endField();
    } else if (c === '\r' || c === '\n') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      endRow();
    } else {
      cur += c;
    }
  }
  endRow();
  return rows;
}

export function parseCsv(text, { firstDataLine = 0 } = {}) {
  if (!text || !text.trim()) return [];

  // Detect the delimiter from the header line. Metadata/header lines don't
  // contain quoted newlines, so a plain line split is safe here.
  const rawLines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (rawLines.length <= firstDataLine) return [];
  const delim = rawLines[firstDataLine].includes('\t') ? '\t' : ',';

  const allRows = tokenizeCsv(text, delim);
  if (allRows.length <= firstDataLine) return [];

  const headers = allRows[firstDataLine].map((h) => h.trim());

  return allRows.slice(firstDataLine + 1).map((vals) => {
    const row = {};
    headers.forEach((h, i) => {
      const raw = (vals[i] ?? '').trim();
      if (raw === '') {
        row[h] = null;
      } else if (/^-?\d+(\.\d+)?$/.test(raw)) {
        row[h] = Number(raw);
      } else {
        row[h] = raw;
      }
    });
    return row;
  });
}
