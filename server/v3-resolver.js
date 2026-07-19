import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_CACHE_PATH = resolve(__dirname, 'v3-mapping-cache.json');

// Cap for the per-resolver memo maps so a long-lived server process cannot
// grow them unboundedly. When full, evict the oldest insertion.
const MEMO_CAP = 500;

function memoSet(map, key, value) {
  if (map.size >= MEMO_CAP) {
    map.delete(map.keys().next().value);
  }
  map.set(key, value);
}

// Strip corporate suffixes so "Carvana LLC" becomes "Carvana" before searching
// FW V3 list-advertisers (which uses case-sensitive prefix match on word boundaries).
const CORP_SUFFIX_RE = /\s+(LLC|L\.L\.C\.|Inc\.?|Incorporated|Corp\.?|Corporation|Co\.?|Company|Cos\.?|Ltd\.?|Limited|Group|Holdings?|plc|PLC|S\.A\.?|S\.A\.B\.\s+de\s+C\.V\.?|S\.p\.A\.?|S\.r\.l\.?|S\.A\.S\.?|GmbH|AG|N\.V\.|B\.V\.|Pty\s+Ltd|A\.S\.?|A\/S|N\.A\.?|LP|L\.P\.|LLP|L\.L\.P\.)\.?$/i;

export function stripCorpSuffix(name) {
  if (!name) return '';
  let s = String(name).trim().replace(/^"|"$/g, '').trim();
  for (let i = 0; i < 4; i++) {
    const before = s;
    s = s.replace(CORP_SUFFIX_RE, '').trim();
    s = s.replace(/[,.]+$/, '').trim();
    if (s === before) break;
  }
  return s;
}

async function loadCache(cachePath) {
  let txt;
  try {
    txt = await fs.readFile(cachePath, 'utf8');
  } catch {
    // Missing file is normal on first run.
    return {};
  }
  try {
    return JSON.parse(txt);
  } catch (err) {
    // The file exists but is unreadable — do NOT silently discard it. Move it
    // aside so it can be inspected/recovered, complain loudly, start fresh.
    const corruptPath = `${cachePath}.corrupt-${process.pid}`;
    try {
      await fs.rename(cachePath, corruptPath);
    } catch { /* best effort — the next save will overwrite it anyway */ }
    console.error(
      `[v3-resolver] cache file ${cachePath} is corrupt (${err.message}). ` +
      `Moved it to ${corruptPath} and starting with an empty cache.`,
    );
    return {};
  }
}

let tmpCounter = 0;

async function saveCache(cachePath, cache) {
  // Write to a temp file in the same directory, then rename over the target so
  // a crash mid-write can never leave a truncated/corrupt cache file.
  const tmpPath = `${cachePath}.tmp-${process.pid}-${++tmpCounter}`;
  await fs.writeFile(tmpPath, JSON.stringify(cache, null, 2), 'utf8');
  try {
    await fs.rename(tmpPath, cachePath);
  } catch (err) {
    // fs.promises.rename overwrites existing files on Windows, but be
    // defensive: if the target is locked/exists, remove it and retry once.
    if (err.code === 'EEXIST' || err.code === 'EPERM') {
      await fs.rm(cachePath, { force: true });
      await fs.rename(tmpPath, cachePath);
    } else {
      await fs.rm(tmpPath, { force: true }).catch(() => {});
      throw err;
    }
  }
}

export function createResolver({ fw, cachePath = process.env.V3_CACHE_PATH || DEFAULT_CACHE_PATH }) {
  let cache = null;
  const advCandidatesByName = new Map();
  const brandsByAdvertiser = new Map();

  // Serialize cache writes: chain every save onto the previous one so
  // concurrent saves can never interleave their temp-file/rename steps.
  let writeQueue = Promise.resolve();

  function persistCache() {
    const run = writeQueue.then(() => saveCache(cachePath, cache));
    writeQueue = run.catch(() => {});
    return run;
  }

  // Share one in-flight load so concurrent callers can't each reload the file
  // and clobber the shared cache object (losing each other's entries).
  let cacheLoad = null;

  async function ensureCache() {
    if (cache !== null) return;
    if (!cacheLoad) cacheLoad = loadCache(cachePath);
    const loaded = await cacheLoad;
    if (cache === null) cache = loaded;
  }

  async function searchAdvertisers(searchName) {
    if (advCandidatesByName.has(searchName)) return advCandidatesByName.get(searchName);
    const result = await fw.invoke('sh_1_1_list-advertisers', { name: searchName, per_page: 50 });
    const list = result?.advertisers?.advertiser;
    const arr = Array.isArray(list) ? list : list ? [list] : [];
    const cleaned = arr.map((a) => ({ id: Number(a.id), name: a.name }));
    memoSet(advCandidatesByName, searchName, cleaned);
    return cleaned;
  }

  async function listBrands(advertiserId) {
    if (brandsByAdvertiser.has(advertiserId)) return brandsByAdvertiser.get(advertiserId);
    const result = await fw.invoke('sh_1_1_list-the-brands-of-an-advertiser', { advertiser_id: advertiserId });
    const list = result?.brands?.brand;
    const arr = Array.isArray(list) ? list : list ? [list] : [];
    const cleaned = arr.map((b) => ({ id: Number(b.id), name: b.name }));
    memoSet(brandsByAdvertiser, advertiserId, cleaned);
    return cleaned;
  }

  async function showBrand(advertiserId, brandId) {
    return fw.invoke('sh_1_1_show-a-brand', { advertiser_id: advertiserId, brand_id: brandId });
  }

  async function resolveOne(item) {
    await ensureCache();
    const key = String(item.global_brand_id);
    if (cache[key]) return { ...cache[key], status: 'cached' };

    const baseName = item.global_advertiser_nm || item.global_brand_nm;
    const searchName = stripCorpSuffix(baseName) || baseName;
    if (!searchName) {
      return { global_brand_id: item.global_brand_id, status: 'error', error: 'no advertiser/brand name' };
    }

    let candidates;
    try {
      candidates = await searchAdvertisers(searchName);
    } catch (err) {
      return { global_brand_id: item.global_brand_id, status: 'error', error: `list-advertisers: ${err.message}` };
    }
    if (candidates.length === 0) {
      return { global_brand_id: item.global_brand_id, status: 'error', error: `no V3 advertiser for "${searchName}"` };
    }

    // Cap candidates to keep cost bounded; FW prefix match returning the entire
    // network is the worst case.
    const capped = candidates.slice(0, 25);

    for (const adv of capped) {
      let brands;
      try {
        brands = await listBrands(adv.id);
      } catch {
        continue;
      }
      for (const brand of brands) {
        let detail;
        try {
          detail = await showBrand(adv.id, brand.id);
        } catch {
          continue;
        }
        const mapped = detail?.brand?.global_mapping?.entity_id;
        if (mapped != null && Number(mapped) === Number(item.global_brand_id)) {
          const result = {
            global_brand_id: item.global_brand_id,
            v3_advertiser_id: adv.id,
            v3_brand_id: brand.id,
            v3_advertiser_nm: adv.name,
            v3_brand_nm: brand.name,
          };
          cache[key] = result;
          return { ...result, status: 'resolved' };
        }
      }
    }

    return {
      global_brand_id: item.global_brand_id,
      status: 'error',
      error: `no V3 brand with global_mapping.entity_id=${item.global_brand_id} found in ${capped.length} candidate advertiser(s)`,
    };
  }

  async function resolveAll(items) {
    await ensureCache();
    const results = [];
    for (const item of items) {
      results.push(await resolveOne(item));
    }
    await persistCache();
    return results;
  }

  async function setManual({ global_brand_id, v3_advertiser_id, v3_brand_id, global_brand_nm, global_advertiser_nm }) {
    await ensureCache();
    const key = String(global_brand_id);
    cache[key] = {
      global_brand_id,
      v3_advertiser_id,
      v3_brand_id,
      v3_advertiser_nm: global_advertiser_nm ?? null,
      v3_brand_nm: global_brand_nm ?? null,
      manual: true,
    };
    await persistCache();
    return cache[key];
  }

  return { resolveOne, resolveAll, setManual };
}
