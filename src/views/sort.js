const WEIGHTS = {
  F2: 1000,
  F1_high: 800,
  F4a: 600,
  F1_pg: 400,
  F3b: 200,
  F3a: 150,
  F1_am: 100,
  F4b: 80,
  F4c: 20,
};

export function priorityScore(row) {
  let score = 0;
  for (const f of row.flags ?? []) {
    if (f.type === 'F2') score += WEIGHTS.F2;
    else if (f.type === 'F1' && f.side === 'pg' && f.highImpact) score += WEIGHTS.F1_high;
    else if (f.type === 'F1' && f.side === 'pg') score += WEIGHTS.F1_pg;
    else if (f.type === 'F1' && f.side === 'am') score += WEIGHTS.F1_am;
    else if (f.type === 'F3a') score += WEIGHTS.F3a;
    else if (f.type === 'F3b') score += WEIGHTS.F3b;
    else if (f.type === 'F4a') score += WEIGHTS.F4a;
    else if (f.type === 'F4b') score += WEIGHTS.F4b;
    else if (f.type === 'F4c') score += WEIGHTS.F4c;
  }
  score += Math.log10(1 + (row.pg?.impressions ?? 0));
  return score;
}
