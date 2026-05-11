import { describe, it, expect, vi } from 'vitest';
import { createTaxonomy, loadTaxonomy } from '../taxonomy.js';

const fixture = {
  assignable: [
    { id: 1,  name: 'Root A',    depth: 0, parentId: null, path: 'Root A' },
    { id: 2,  name: 'Child A1',  depth: 1, parentId: 1,    path: 'Root A › Child A1' },
    { id: 3,  name: 'Child A2',  depth: 1, parentId: 1,    path: 'Root A › Child A2' },
    { id: 10, name: 'Root B',    depth: 0, parentId: null, path: 'Root B' },
  ],
  groupIds: [99, 100],
};

describe('taxonomy.byId', () => {
  const t = createTaxonomy(fixture);

  it('returns the entry for a known id', () => {
    expect(t.byId(2)).toEqual(expect.objectContaining({ id: 2, name: 'Child A1' }));
  });

  it('returns null for unknown id', () => {
    expect(t.byId(9999)).toBeNull();
  });

  it('returns null for group ids', () => {
    expect(t.byId(99)).toBeNull();
  });
});

describe('taxonomy.byName', () => {
  const t = createTaxonomy(fixture);

  it('returns the entry for an exact name', () => {
    expect(t.byName('Child A1')).toEqual(expect.objectContaining({ id: 2 }));
  });

  it('returns null for unknown name', () => {
    expect(t.byName('Nope')).toBeNull();
  });

  it('treats name lookup case-sensitively (matches FW canonical strings)', () => {
    expect(t.byName('child a1')).toBeNull();
  });
});

describe('taxonomy.walkToDepth0', () => {
  const t = createTaxonomy(fixture);

  it('returns self for a depth-0 entry', () => {
    expect(t.walkToDepth0(1)?.id).toBe(1);
  });

  it('walks up for a depth-1 entry', () => {
    expect(t.walkToDepth0(2)?.id).toBe(1);
  });

  it('returns null for unknown id', () => {
    expect(t.walkToDepth0(9999)).toBeNull();
  });
});

describe('taxonomy.pathOf', () => {
  const t = createTaxonomy(fixture);

  it('returns the full ancestry path joined by " › "', () => {
    expect(t.pathOf(2)).toBe('Root A › Child A1');
  });

  it('returns the leaf name for a root entry', () => {
    expect(t.pathOf(1)).toBe('Root A');
  });

  it('returns null for unknown id', () => {
    expect(t.pathOf(9999)).toBeNull();
  });
});

describe('taxonomy.longestCommonPathPrefix', () => {
  const t = createTaxonomy(fixture);

  it('returns the deepest common ancestor when ids span a subtree', () => {
    const result = t.longestCommonPathPrefix([2, 3]);
    expect(result?.id).toBe(1);
  });

  it('returns the entry itself when all ids are identical', () => {
    expect(t.longestCommonPathPrefix([2, 2, 2])?.id).toBe(2);
  });

  it('returns null when ids are in disjoint roots', () => {
    expect(t.longestCommonPathPrefix([2, 10])).toBeNull();
  });

  it('ignores unknown ids', () => {
    expect(t.longestCommonPathPrefix([2, 9999, 3])?.id).toBe(1);
  });

  it('returns null for empty input', () => {
    expect(t.longestCommonPathPrefix([])).toBeNull();
  });
});

describe('taxonomy.hasAssignableDescendants', () => {
  const t = createTaxonomy(fixture);

  it('true when entry has children', () => {
    expect(t.hasAssignableDescendants(1)).toBe(true);
  });

  it('false when leaf', () => {
    expect(t.hasAssignableDescendants(2)).toBe(false);
  });
});

describe('taxonomy.isAncestor', () => {
  const t = createTaxonomy(fixture);

  it('true when ancestorId is parent of descendantId', () => {
    expect(t.isAncestor(1, 2)).toBe(true);
  });

  it('false in reverse', () => {
    expect(t.isAncestor(2, 1)).toBe(false);
  });

  it('false for siblings', () => {
    expect(t.isAncestor(2, 3)).toBe(false);
  });

  it('false when equal', () => {
    expect(t.isAncestor(1, 1)).toBe(false);
  });
});

describe('loadTaxonomy', () => {
  it('fetches /api/industries and returns a taxonomy', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => fixture,
    });

    const t = await loadTaxonomy();
    expect(t.byId(2)?.name).toBe('Child A1');
    expect(global.fetch).toHaveBeenCalledWith('/api/industries');
  });

  it('throws if fetch fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    await expect(loadTaxonomy()).rejects.toThrow(/500/);
  });
});
