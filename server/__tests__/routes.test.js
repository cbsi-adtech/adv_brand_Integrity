import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createRouter } from '../routes.js';

const SCALAR_BRAND_XML = `<?xml version="1.0"?>
<brand><id>67890</id><name>Geico</name><industry_id>5249</industry_id></brand>`;

function makeFakeFw({ updateImpl } = {}) {
  return {
    sessionId: 'sess-1',
    sessionEstablishedAt: '2026-04-29T00:00:00Z',
    invoke: vi.fn().mockImplementation(async (toolName, params) => {
      if (toolName === 'sh_1_1_show-a-brand') return SCALAR_BRAND_XML;
      if (toolName === 'sh_1_1_update-a-brand') {
        if (updateImpl) return updateImpl(params);
        return { ok: true };
      }
      throw new Error(`unexpected tool: ${toolName}`);
    }),
    login: vi.fn(),
  };
}

function buildApp(fw) {
  const app = express();
  app.use(express.json());
  app.use('/api', createRouter({ fw, environment: 'staging' }));
  return app;
}

describe('POST /api/changes/apply', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('applies a single change and returns ok', async () => {
    const fw = makeFakeFw();
    const res = await request(buildApp(fw))
      .post('/api/changes/apply')
      .send({
        changes: [{
          v3_advertiser_id: 12345,
          v3_brand_id: 67890,
          brand_name: 'Geico',
          current_industry_id: 5249,
          new_industry_id: 5251,
        }],
      });

    expect(res.status).toBe(200);
    expect(res.body.environment).toBe('staging');
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0].status).toBe('ok');
    expect(fw.invoke).toHaveBeenCalledWith('sh_1_1_show-a-brand', expect.objectContaining({ advertiser_id: 12345, brand_id: 67890 }));
    const updateCall = fw.invoke.mock.calls.find(([name]) => name === 'sh_1_1_update-a-brand');
    expect(updateCall[1].body).toMatch(/<industry_id>5251<\/industry_id>/);
  });

  it('reports per-row failure but continues with later rows', async () => {
    let count = 0;
    const fw = makeFakeFw({
      updateImpl: (params) => {
        count++;
        if (count === 1) throw new Error('FW: 422 — industry not assignable');
        return { ok: true };
      },
    });

    const res = await request(buildApp(fw))
      .post('/api/changes/apply')
      .send({
        changes: [
          { v3_advertiser_id: 1, v3_brand_id: 1, brand_name: 'A', current_industry_id: 1, new_industry_id: 5251 },
          { v3_advertiser_id: 2, v3_brand_id: 2, brand_name: 'B', current_industry_id: 1, new_industry_id: 5252 },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(2);
    expect(res.body.results[0].status).toBe('error');
    expect(res.body.results[0].error).toMatch(/422/);
    expect(res.body.results[1].status).toBe('ok');
  });

  it('rejects malformed bodies', async () => {
    const res = await request(buildApp(makeFakeFw()))
      .post('/api/changes/apply')
      .send({ changes: 'not-an-array' });
    expect(res.status).toBe(400);
  });
});
