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
    const idStaged = usePendingStore.getState().stage({ type: 'am-industry', brand, payload: {} });
    const idApplied = usePendingStore.getState().stage({ type: 'am-industry', brand, payload: {} });
    usePendingStore.getState().setStatus(idApplied, 'applied');

    usePendingStore.getState().rehydrate();

    expect(usePendingStore.getState().items[idStaged].status).toBe('staged');
    expect(usePendingStore.getState().items[idApplied].status).toBe('applied');
  });
});
