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

export function parseCsv(text, { firstDataLine = 0 } = {}) {
  if (!text || !text.trim()) return [];
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length <= firstDataLine) return [];

  const headerLine = lines[firstDataLine];
  const delim = headerLine.includes('\t') ? '\t' : ',';
  const headers = splitCsvLine(headerLine, delim).map((h) => h.trim());

  return lines.slice(firstDataLine + 1).map((line) => {
    const vals = splitCsvLine(line, delim);
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
