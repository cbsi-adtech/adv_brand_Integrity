import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createRouter } from '../routes.js';

// Real FW V3 brand response shape returned by `invoke_tool` for sh_1_1_show-a-brand
const FAKE_BRAND_PAYLOAD = {
  brand: {
    id: '67890',
    name: 'Geico (Brand)',
    status: 'ACTIVE',
    industry: { industry_id: '5249' },
    global_mapping: { entity_id: '999', entity_type: 'GLOBAL_BRAND' },
  },
};

function makeFakeFw({ updateImpl } = {}) {
  return {
    sessionId: 'sess-1',
    sessionEstablishedAt: '2026-04-29T00:00:00Z',
    invoke: vi.fn().mockImplementation(async (toolName, params) => {
      if (toolName === 'sh_1_1_show-a-brand') {
        return JSON.parse(JSON.stringify(FAKE_BRAND_PAYLOAD));
      }
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
    expect(updateCall[1].body).toMatch(/<industry>\s*<industry_id>5251<\/industry_id>\s*<\/industry>/);
    expect(updateCall[1].body).not.toMatch(/5249/);
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

describe('GET /api/audit/recent', () => {
  it('returns { entries: [] } when audit file is empty/missing', async () => {
    const res = await request(buildApp(makeFakeFw())).get('/api/audit/recent?limit=10');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.entries)).toBe(true);
  });

  it('caps limit at 500', async () => {
    const res = await request(buildApp(makeFakeFw())).get('/api/audit/recent?limit=9999');
    expect(res.status).toBe(200);
  });
});

describe('POST /api/creatives/apply (stub)', () => {
  it('returns 501 Not Implemented', async () => {
    const res = await request(buildApp(makeFakeFw())).post('/api/creatives/apply').send({});
    expect(res.status).toBe(501);
  });
});
