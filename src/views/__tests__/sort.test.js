import { describe, it, expect } from 'vitest';
import { priorityScore } from '../sort.js';

function rowWithFlags(types, pgImpressions = 0) {
  return {
    flags: types.map((t) => ({
      type: t === 'F1_high' ? 'F1' : t,
      side: 'pg',
      highImpact: t === 'F1_high',
    })),
    pg: { impressions: pgImpressions },
  };
}

describe('priorityScore', () => {
  it('F2 outranks F1 (Programmatic) high-impact', () => {
    expect(priorityScore(rowWithFlags(['F2']))).toBeGreaterThan(
      priorityScore(rowWithFlags(['F1_high']))
    );
  });

  it('F1 high-impact outranks F1 plain', () => {
    expect(priorityScore({
      flags: [{ type: 'F1', side: 'pg', highImpact: true }],
      pg: { impressions: 0 }
    })).toBeGreaterThan(
      priorityScore({
        flags: [{ type: 'F1', side: 'pg', highImpact: false }],
        pg: { impressions: 0 }
      })
    );
  });

  it('higher pg impressions wins as tiebreaker among equal-flag rows', () => {
    const a = { flags: [{ type: 'F2' }], pg: { impressions: 1_000_000 } };
    const b = { flags: [{ type: 'F2' }], pg: { impressions: 1_000 } };
    expect(priorityScore(a)).toBeGreaterThan(priorityScore(b));
  });
});
