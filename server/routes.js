import { Router } from 'express';
import { getIndustryPayload, GROUP_IDS } from './industries.js';
import { mutateBrandIndustry } from './mutate-brand-xml.js';
import { appendAudit, AUDIT_PATH } from './audit.js';
import { readRecent } from './audit-read.js';
import { createResolver } from './v3-resolver.js';
import { suggestIndustry } from './suggest-industry.js';

const MAX_APPLY_BATCH = 200;

function isValidChange(c) {
  return c
    && Number.isInteger(c.v3_advertiser_id)
    && Number.isInteger(c.v3_brand_id)
    && Number.isInteger(c.new_industry_id)
    && !GROUP_IDS.has(c.new_industry_id);
}

export function createRouter({ fw, environment }) {
  const router = Router();
  const resolver = createResolver({ fw });

  router.get('/health', (req, res) => {
    res.json({
      environment,
      loggedIn: Boolean(fw.sessionId),
      sessionEstablishedAt: fw.sessionEstablishedAt,
    });
  });

  router.get('/industries', (req, res) => {
    res.json(getIndustryPayload());
  });

  router.post('/changes/apply', async (req, res) => {
    const { changes } = req.body || {};
    if (!Array.isArray(changes) || changes.length === 0) {
      return res.status(400).json({ error: 'body.changes must be a non-empty array' });
    }
    if (changes.length > MAX_APPLY_BATCH) {
      return res.status(400).json({ error: `body.changes must contain at most ${MAX_APPLY_BATCH} changes (got ${changes.length}); split the batch and retry` });
    }
    if (!changes.every(isValidChange)) {
      return res.status(400).json({ error: 'each change requires integer v3_advertiser_id, v3_brand_id, new_industry_id (non-group)' });
    }

    // Audit writes must never change the outcome of a row: a change that hit
    // FW successfully stays 'ok' even if the audit log is unwritable.
    async function safeAudit(entry) {
      try {
        await appendAudit(entry);
      } catch (auditErr) {
        console.error('[apply] audit write failed (change outcome unaffected):', auditErr?.message || auditErr);
      }
    }

    const results = [];
    for (const change of changes) {
      const base = {
        v3_advertiser_id: change.v3_advertiser_id,
        v3_brand_id: change.v3_brand_id,
        brand_name: change.brand_name,
        current_industry_id: change.current_industry_id,
        new_industry_id: change.new_industry_id,
      };
      try {
        const brandPayload = await fw.invoke('sh_1_1_show-a-brand', {
          advertiser_id: change.v3_advertiser_id,
          brand_id: change.v3_brand_id,
        });
        if (brandPayload == null || typeof brandPayload !== 'object') {
          // JSON.stringify(undefined) returns undefined — guard so the
          // diagnostic itself can never throw.
          const preview = typeof brandPayload === 'string'
            ? brandPayload.slice(0, 500)
            : String(JSON.stringify(brandPayload) ?? brandPayload).slice(0, 500);
          console.error(
            `[apply] sh_1_1_show-a-brand returned non-object for adv=${change.v3_advertiser_id} brand=${change.v3_brand_id}. type=${typeof brandPayload}. preview:`,
            preview,
          );
        }
        const mutatedXml = mutateBrandIndustry(brandPayload, change.new_industry_id);
        await fw.invoke('sh_1_1_update-a-brand', {
          advertiser_id: change.v3_advertiser_id,
          brand_id: change.v3_brand_id,
          body: mutatedXml,
        });
        // The FW update succeeded: record the ok result FIRST, then attempt
        // the audit write. safeAudit never throws, so an audit failure can
        // neither convert this row to an error nor push a duplicate row.
        results.push({ ...base, status: 'ok' });
        await safeAudit({
          environment,
          brand_id: change.v3_brand_id,
          advertiser_id: change.v3_advertiser_id,
          brand_name: change.brand_name,
          before: change.current_industry_id,
          after: change.new_industry_id,
          status: 'ok',
        });
      } catch (err) {
        const message = err?.message || String(err);
        results.push({ ...base, status: 'error', error: message });
        await safeAudit({
          environment,
          brand_id: change.v3_brand_id,
          advertiser_id: change.v3_advertiser_id,
          brand_name: change.brand_name,
          before: change.current_industry_id,
          after: change.new_industry_id,
          status: 'error',
          error: message,
        });
      }
    }

    res.json({ environment, results });
  });

  router.post('/resolve-v3/manual', async (req, res) => {
    const { global_brand_id, v3_advertiser_id, v3_brand_id, global_brand_nm, global_advertiser_nm } = req.body || {};
    if (!Number.isInteger(global_brand_id)
        || !Number.isInteger(v3_advertiser_id) || v3_advertiser_id <= 0
        || !Number.isInteger(v3_brand_id) || v3_brand_id <= 0) {
      return res.status(400).json({ error: 'global_brand_id must be an integer; v3_advertiser_id and v3_brand_id must be positive integers' });
    }
    try {
      const entry = await resolver.setManual({ global_brand_id, v3_advertiser_id, v3_brand_id, global_brand_nm, global_advertiser_nm });
      res.json({ entry });
    } catch (err) {
      res.status(500).json({ error: err?.message || String(err) });
    }
  });

  router.post('/resolve-v3', async (req, res) => {
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'body.items must be a non-empty array' });
    }
    const cap = Math.min(items.length, 200);
    const requested = items.slice(0, cap);
    try {
      const results = await resolver.resolveAll(requested);
      const counts = results.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {});
      res.json({ counts, results });
    } catch (err) {
      res.status(500).json({ error: err?.message || String(err) });
    }
  });

  router.get('/audit/recent', async (req, res) => {
    const requested = Number.parseInt(req.query.limit ?? '50', 10);
    const limit = Math.min(Math.max(Number.isFinite(requested) ? requested : 50, 1), 500);
    try {
      const entries = await readRecent(AUDIT_PATH, limit);
      res.json({ entries });
    } catch (err) {
      res.status(500).json({ error: err?.message || String(err) });
    }
  });

  router.post('/creatives/apply', (_req, res) => {
    res.status(501).json({ error: 'Programmatic Module creative apply path not implemented yet' });
  });

  router.post('/suggest-industry', async (req, res) => {
    const { brand_name, advertiser_name, parent_industry, candidates } = req.body || {};
    if (!brand_name || !parent_industry || !Array.isArray(candidates) || candidates.length === 0) {
      return res.status(400).json({ error: 'brand_name, parent_industry, candidates[] required' });
    }
    try {
      const result = await suggestIndustry({ brand_name, advertiser_name, parent_industry, candidates });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err?.message || String(err) });
    }
  });

  return router;
}
