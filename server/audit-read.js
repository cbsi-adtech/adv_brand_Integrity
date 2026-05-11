import { readFile } from 'node:fs/promises';

export async function readRecent(path, limit) {
  let text;
  try {
    text = await readFile(path, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  if (!text.trim()) return [];

  const lines = text.split('\n').filter((l) => l.length > 0);
  const tail = lines.slice(-limit).reverse();
  const out = [];
  for (const line of tail) {
    try { out.push(JSON.parse(line)); }
    catch { /* skip malformed */ }
  }
  return out;
}
