import { describe, it, expect, beforeEach } from 'vitest';
import { usePendingStore } from '../pendingStore.js';

beforeEach(() => {
  localStorage.clear();
  usePendingStore.setState({ items: {} });
});

const brand = { global_brand_id: 1, global_brand_nm: 'A', global_advertiser_id: 10, global_advertiser_nm: 'AdvA' };

describe('pendingStore.stage', () => {
  it('adds an item with status=staged and a generated uuid', () => {
    const id = usePendingStore.getState().stage({
      type: 'am-industry',
      brand,
      payload: { before: { industry_id: 1, industry_name: 'X', depth: 0, path: 'X' },
                 after:  { industry_id: 2, industry_name: 'Y', depth: 0, path: 'Y' } },
    });
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    const item = usePendingStore.getState().items[id];
    expect(item.status).toBe('staged');
    expect(item.type).toBe('am-industry');
    expect(item.brand.global_brand_id).toBe(1);
  });
});

describe('pendingStore.stage — am-industry dedupe per brand', () => {
  it('replaces an existing staged am-industry item for the same brand instead of appending', () => {
    const id1 = usePendingStore.getState().stage({
      type: 'am-industry', brand,
      payload: { after: { industry_id: 2, industry_name: 'Y', depth: 0, path: 'Y' } },
    });
    const id2 = usePendingStore.getState().stage({
      type: 'am-industry', brand,
      payload: { after: { industry_id: 3, industry_name: 'Z', depth: 0, path: 'Z' } },
    });

    const items = Object.values(usePendingStore.getState().items);
    const amForBrand = items.filter((i) => i.type === 'am-industry' && i.brand.global_brand_id === 1);
    expect(amForBrand).toHaveLength(1);
    expect(amForBrand[0].id).toBe(id2);
    expect(amForBrand[0].payload.after.industry_id).toBe(3);
    expect(usePendingStore.getState().items[id1]).toBeUndefined();
  });

  it('also replaces a failed am-industry item for the same brand', () => {
    const id1 = usePendingStore.getState().stage({ type: 'am-industry', brand, payload: {} });
    usePendingStore.getState().setStatus(id1, 'failed', { message: 'boom' });
    const id2 = usePendingStore.getState().stage({ type: 'am-industry', brand, payload: {} });

    expect(usePendingStore.getState().items[id1]).toBeUndefined();
    expect(usePendingStore.getState().items[id2].status).toBe('staged');
  });

  it('does NOT replace an already-applied am-industry item (audit trail preserved)', () => {
    const id1 = usePendingStore.getState().stage({ type: 'am-industry', brand, payload: {} });
    usePendingStore.getState().setStatus(id1, 'applied');
    const id2 = usePendingStore.getState().stage({ type: 'am-industry', brand, payload: {} });

    expect(usePendingStore.getState().items[id1].status).toBe('applied');
    expect(usePendingStore.getState().items[id2].status).toBe('staged');
    expect(Object.keys(usePendingStore.getState().items)).toHaveLength(2);
  });

  it('does not dedupe across different brands or non-am-industry types', () => {
    const otherBrand = { ...brand, global_brand_id: 2 };
    usePendingStore.getState().stage({ type: 'am-industry', brand, payload: {} });
    usePendingStore.getState().stage({ type: 'am-industry', brand: otherBrand, payload: {} });
    usePendingStore.getState().stage({ type: 'zendesk-draft', brand, payload: {} });

    expect(Object.keys(usePendingStore.getState().items)).toHaveLength(3);
  });
});

describe('pendingStore.remove', () => {
  it('deletes an item by id', () => {
    const id = usePendingStore.getState().stage({ type: 'am-industry', brand, payload: {} });
    usePendingStore.getState().remove(id);
    expect(usePendingStore.getState().items[id]).toBeUndefined();
  });
});

describe('pendingStore.clear', () => {
  it('empties items', () => {
    usePendingStore.getState().stage({ type: 'am-industry', brand, payload: {} });
    usePendingStore.getState().stage({ type: 'am-industry', brand, payload: {} });
    usePendingStore.getState().clear();
    expect(Object.keys(usePendingStore.getState().items)).toHaveLength(0);
  });
});

describe('pendingStore.rehydrate', () => {
  it('demotes any "applying" items to "failed"', () => {
    const id = usePendingStore.getState().stage({ type: 'am-industry', brand, payload: {} });
    usePendingStore.getState().setStatus(id, 'applying');

    usePendingStore.getState().rehydrate();

    const item = usePendingStore.getState().items[id];
    expect(item.status).toBe('failed');
    expect(item.error?.message).toMatch(/interrupted/i);
  });

  it('leaves staged/applied/failed items unchanged', () => {
    // Distinct brands: staging the same brand twice would (intentionally)
    // replace the first item now that am-industry items dedupe per brand.
    const brand2 = { ...brand, global_brand_id: 2 };
    const idStaged = usePendingStore.getState().stage({ type: 'am-industry', brand, payload: {} });
    const idApplied = usePendingStore.getState().stage({ type: 'am-industry', brand: brand2, payload: {} });
    usePendingStore.getState().setStatus(idApplied, 'applied');

    usePendingStore.getState().rehydrate();

    expect(usePendingStore.getState().items[idStaged].status).toBe('staged');
    expect(usePendingStore.getState().items[idApplied].status).toBe('applied');
  });
});
