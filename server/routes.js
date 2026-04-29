import { Router } from 'express';
import { getIndustryPayload, GROUP_IDS } from './industries.js';
import { mutateBrandIndustry } from './mutate-brand-xml.js';
import { appendAudit } from './audit.js';

function isValidChange(c) {
  return c
    && Number.isInteger(c.v3_advertiser_id)
    && Number.isInteger(c.v3_brand_id)
    && Number.isInteger(c.new_industry_id)
    && !GROUP_IDS.has(c.new_industry_id);
}

export function createRouter({ fw, environment }) {
  const router = Router();

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
    if (!changes.every(isValidChange)) {
      return res.status(400).json({ error: 'each change requires integer v3_advertiser_id, v3_brand_id, new_industry_id (non-group)' });
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
        const mutatedXml = mutateBrandIndustry(brandPayload, change.new_industry_id);
        await fw.invoke('sh_1_1_update-a-brand', {
          advertiser_id: change.v3_advertiser_id,
          brand_id: change.v3_brand_id,
          body: mutatedXml,
        });
        results.push({ ...base, status: 'ok' });
        await appendAudit({
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
        await appendAudit({
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

  return router;
}
