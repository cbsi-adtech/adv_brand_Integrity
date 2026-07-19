import { INDUSTRIES } from '../../server/industries.js';

// Static list of every FW taxonomy industry name. Built from the same
// source-of-truth data the BFF serves via /api/industries — used by parsers
// that run before the async taxonomy fetch completes (e.g. splitting the
// FW report's comma-joined "Programmatic Industry Name" cell, where 32
// real names themselves contain commas).
export const KNOWN_INDUSTRY_NAMES = INDUSTRIES.map((i) => i.name);

export function createTaxonomy({ assignable, groupIds }) {
  const groupSet = new Set(groupIds);
  const byIdMap = new Map(
    assignable.filter((e) => !groupSet.has(e.id)).map((e) => [e.id, e])
  );
  const byNameMap = new Map(
    [...byIdMap.values()].map((e) => [e.name, e])
  );

  const childrenByParent = new Map();
  for (const e of byIdMap.values()) {
    if (e.parentId == null) continue;
    if (!childrenByParent.has(e.parentId)) childrenByParent.set(e.parentId, []);
    childrenByParent.get(e.parentId).push(e);
  }

  return {
    byId(id) {
      return byIdMap.get(id) ?? null;
    },
    byName(name) {
      return byNameMap.get(name) ?? null;
    },
    isGroupId(id) {
      return groupSet.has(id);
    },
    all() {
      return [...byIdMap.values()];
    },
    walkToDepth0(id) {
      let cur = byIdMap.get(id);
      if (!cur) return null;
      while (cur.parentId != null) {
        const parent = byIdMap.get(cur.parentId);
        if (!parent) break;
        cur = parent;
      }
      return cur;
    },
    pathOf(id) {
      let cur = byIdMap.get(id);
      if (!cur) return null;
      const parts = [cur.name];
      while (cur.parentId != null) {
        const parent = byIdMap.get(cur.parentId);
        if (!parent) break;
        parts.unshift(parent.name);
        cur = parent;
      }
      return parts.join(' › ');
    },
    longestCommonPathPrefix(ids) {
      const ancestries = ids
        .map((id) => {
          const chain = [];
          let cur = byIdMap.get(id);
          while (cur) {
            chain.unshift(cur);
            cur = cur.parentId != null ? byIdMap.get(cur.parentId) : null;
          }
          return chain;
        })
        .filter((c) => c.length > 0);

      if (ancestries.length === 0) return null;

      let prefix = ancestries[0];
      for (let i = 1; i < ancestries.length; i++) {
        const other = ancestries[i];
        let j = 0;
        while (j < prefix.length && j < other.length && prefix[j].id === other[j].id) j++;
        prefix = prefix.slice(0, j);
        if (prefix.length === 0) return null;
      }
      return prefix[prefix.length - 1];
    },
    hasAssignableDescendants(id) {
      return (childrenByParent.get(id)?.length ?? 0) > 0;
    },
    descendantsOf(id) {
      const out = [];
      const stack = [...(childrenByParent.get(id) ?? [])];
      while (stack.length) {
        const cur = stack.pop();
        out.push(cur);
        const kids = childrenByParent.get(cur.id) ?? [];
        for (const k of kids) stack.push(k);
      }
      return out;
    },
    isAncestor(ancestorId, descendantId) {
      if (ancestorId === descendantId) return false;
      let cur = byIdMap.get(descendantId);
      while (cur && cur.parentId != null) {
        if (cur.parentId === ancestorId) return true;
        cur = byIdMap.get(cur.parentId);
      }
      return false;
    },
  };
}

export async function loadTaxonomy() {
  const res = await fetch('/api/industries');
  if (!res.ok) throw new Error(`Failed to load /api/industries (${res.status})`);
  const payload = await res.json();
  return createTaxonomy(payload);
}
