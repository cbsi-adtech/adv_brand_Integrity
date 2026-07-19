// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createResolver } from '../v3-resolver.js';

let dir;
let cachePath;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'v3cache-'));
  cachePath = join(dir, 'cache.json');
});

afterEach(() => {
  vi.restoreAllMocks();
  if (dir) rmSync(dir, { recursive: true, force: true });
});

function noopFw() {
  return { invoke: vi.fn().mockRejectedValue(new Error('fw should not be called')) };
}

describe('v3-resolver cache persistence', () => {
  it('round-trips manual entries through save and load', async () => {
    const r1 = createResolver({ fw: noopFw(), cachePath });
    await r1.setManual({
      global_brand_id: 999,
      v3_advertiser_id: 1,
      v3_brand_id: 2,
      global_brand_nm: 'Brand B',
      global_advertiser_nm: 'Adv A',
    });

    const saved = JSON.parse(readFileSync(cachePath, 'utf8'));
    expect(saved['999']).toMatchObject({ v3_advertiser_id: 1, v3_brand_id: 2, manual: true });

    // A fresh resolver must load the persisted entry from disk.
    const r2 = createResolver({ fw: noopFw(), cachePath });
    const res = await r2.resolveOne({ global_brand_id: 999 });
    expect(res.status).toBe('cached');
    expect(res.v3_advertiser_id).toBe(1);
    expect(res.v3_brand_id).toBe(2);
  });

  it('recovers loudly from a corrupt cache file instead of silently using it', async () => {
    writeFileSync(cachePath, '{ this is not json !!!', 'utf8');
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const r = createResolver({ fw: noopFw(), cachePath });
    await r.setManual({ global_brand_id: 5, v3_advertiser_id: 1, v3_brand_id: 1 });

    // Cache started from {} plus only the new entry.
    const saved = JSON.parse(readFileSync(cachePath, 'utf8'));
    expect(Object.keys(saved)).toEqual(['5']);

    // Corrupt file was renamed aside, not destroyed.
    const corrupt = readdirSync(dir).filter((f) => f.startsWith('cache.json.corrupt-'));
    expect(corrupt).toHaveLength(1);
    expect(readFileSync(join(dir, corrupt[0]), 'utf8')).toContain('this is not json');
    expect(errSpy).toHaveBeenCalled();
  });

  it('manual entries survive a later save of resolved entries', async () => {
    // Seed the cache file with a pre-existing manual entry.
    writeFileSync(cachePath, JSON.stringify({
      111: { global_brand_id: 111, v3_advertiser_id: 7, v3_brand_id: 8, manual: true },
    }, null, 2), 'utf8');

    const fw = {
      invoke: vi.fn(async (tool) => {
        if (tool === 'sh_1_1_list-advertisers') {
          return { advertisers: { advertiser: [{ id: '10', name: 'Acme' }] } };
        }
        if (tool === 'sh_1_1_list-the-brands-of-an-advertiser') {
          return { brands: { brand: [{ id: '20', name: 'Acme Brand' }] } };
        }
        if (tool === 'sh_1_1_show-a-brand') {
          return { brand: { id: '20', global_mapping: { entity_id: '222' } } };
        }
        throw new Error(`unexpected tool: ${tool}`);
      }),
    };

    const r = createResolver({ fw, cachePath });
    const results = await r.resolveAll([{ global_brand_id: 222, global_advertiser_nm: 'Acme' }]);
    expect(results[0].status).toBe('resolved');

    const saved = JSON.parse(readFileSync(cachePath, 'utf8'));
    expect(saved['111']).toMatchObject({ manual: true });
    expect(saved['222']).toMatchObject({ v3_advertiser_id: 10, v3_brand_id: 20 });
  });

  it('persists all entries when saves happen concurrently', async () => {
    const r = createResolver({ fw: noopFw(), cachePath });
    await Promise.all([
      r.setManual({ global_brand_id: 1, v3_advertiser_id: 1, v3_brand_id: 1 }),
      r.setManual({ global_brand_id: 2, v3_advertiser_id: 2, v3_brand_id: 2 }),
      r.setManual({ global_brand_id: 3, v3_advertiser_id: 3, v3_brand_id: 3 }),
    ]);
    const saved = JSON.parse(readFileSync(cachePath, 'utf8'));
    expect(Object.keys(saved).sort()).toEqual(['1', '2', '3']);
  });
});
