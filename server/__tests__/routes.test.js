// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import _sodium from 'libsodium-wrappers';
import { createRouter } from '../routes.js';
import { createFwClient } from '../fw.js';
import { appendAudit } from '../audit.js';

// Keep tests from appending to the real server/audit.log and let them observe
// (and fail) audit writes.
vi.mock('../audit.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, appendAudit: vi.fn().mockResolvedValue(undefined) };
});

// Keep the resolver from touching the real server/v3-mapping-cache.json.
process.env.V3_CACHE_PATH = join(mkdtempSync(join(tmpdir(), 'routes-v3cache-')), 'cache.json');

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
      updateImpl: (_params) => {
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

  it('rejects batches larger than 200 changes with a 400', async () => {
    const changes = Array.from({ length: 201 }, (_, i) => ({
      v3_advertiser_id: i + 1,
      v3_brand_id: i + 1,
      new_industry_id: 5251,
    }));
    const fw = makeFakeFw();
    const res = await request(buildApp(fw)).post('/api/changes/apply').send({ changes });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/200/);
    expect(fw.invoke).not.toHaveBeenCalled();
  });

  it('reports an error row and audits the error when the FW update returns isError', async () => {
    appendAudit.mockClear();
    appendAudit.mockResolvedValue(undefined);
    const brandXml = '<brand><id>67890</id><name>Geico (Brand)</name><industry><industry_id>5249</industry_id></industry></brand>';
    const fetchMock = vi.fn(async (url, opts) => {
      // Pre-v3.3 server generation: no /register, so the client falls back to
      // the legacy sealed-box login exercised below.
      if (String(url).endsWith('/register') || String(url).endsWith('/token/machine')) {
        return { ok: false, status: 404, headers: new Headers(), text: async () => '', json: async () => null };
      }
      const body = JSON.parse(opts.body);
      if (!body.params?.name) return { ok: true, headers: new Headers(), json: async () => ({ jsonrpc: '2.0', result: {} }) };
      const tool = body.params.name === 'invoke_tool' ? body.params.arguments.tool_name : body.params.name;
      const reply = (result) => ({ ok: true, json: async () => ({ jsonrpc: '2.0', id: body.id, result }) });
      if (tool === 'streaming_hub_get_login_public_key') {
        await _sodium.ready;
        const pub = _sodium.to_base64(_sodium.crypto_box_keypair().publicKey, _sodium.base64_variants.ORIGINAL);
        return reply({ content: [{ type: 'text', text: JSON.stringify({ public_key_b64: pub, kid: 'kid-1', alg: 'sealed-box-x25519' }) }], isError: false });
      }
      if (tool === 'streaming_hub_login_encrypted') {
        return reply({ content: [{ type: 'text', text: JSON.stringify({ ok: true, session_id: 'abc123' }) }], isError: false });
      }
      if (tool === 'sh_1_1_show-a-brand') {
        return reply({ content: [{ type: 'text', text: brandXml }], isError: false });
      }
      if (tool === 'sh_1_1_update-a-brand') {
        return reply({ content: [{ type: 'text', text: 'Tool execution failed: brand could not be updated' }], isError: true });
      }
      throw new Error(`unexpected tool: ${tool}`);
    });
    const fw = createFwClient({
      url: 'https://fw.example/',
      username: 'u', password: 'p', environment: 'staging',
      fetchImpl: fetchMock,
    });

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
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0].status).toBe('error');
    expect(res.body.results[0].error).toMatch(/could not be updated/);
    const auditEntries = appendAudit.mock.calls.map(([entry]) => entry);
    expect(auditEntries).toHaveLength(1);
    expect(auditEntries[0].status).toBe('error');
  });

  it('still reports ok (exactly once) when the audit write fails after a successful update', async () => {
    appendAudit.mockClear();
    appendAudit.mockRejectedValue(new Error('disk full'));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
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
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0].status).toBe('ok');
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
    appendAudit.mockReset();
    appendAudit.mockResolvedValue(undefined);
  });

  it('reports a clean error row when the brand payload is undefined (diagnostic must not crash)', async () => {
    appendAudit.mockReset();
    appendAudit.mockResolvedValue(undefined);
    const fw = makeFakeFw();
    fw.invoke.mockImplementation(async (toolName) => {
      if (toolName === 'sh_1_1_show-a-brand') return undefined;
      return { ok: true };
    });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await request(buildApp(fw))
      .post('/api/changes/apply')
      .send({
        changes: [{
          v3_advertiser_id: 1,
          v3_brand_id: 2,
          brand_name: 'X',
          current_industry_id: 1,
          new_industry_id: 5251,
        }],
      });

    expect(res.status).toBe(200);
    expect(res.body.results[0].status).toBe('error');
    // The real failure (payload not an object), not a crash inside the
    // diagnostic preview ("Cannot read properties of undefined ...").
    expect(res.body.results[0].error).toMatch(/payload must be an object/i);
    // The diagnostic itself ran.
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});

describe('POST /api/resolve-v3/manual', () => {
  it('rejects non-positive v3 ids with a 400', async () => {
    const app = buildApp(makeFakeFw());
    const base = { global_brand_id: 1, global_brand_nm: 'B', global_advertiser_nm: 'A' };

    let res = await request(app).post('/api/resolve-v3/manual')
      .send({ ...base, v3_advertiser_id: -5, v3_brand_id: 2 });
    expect(res.status).toBe(400);

    res = await request(app).post('/api/resolve-v3/manual')
      .send({ ...base, v3_advertiser_id: 5, v3_brand_id: 0 });
    expect(res.status).toBe(400);
  });

  it('accepts positive integer v3 ids', async () => {
    const res = await request(buildApp(makeFakeFw())).post('/api/resolve-v3/manual')
      .send({ global_brand_id: 12321, v3_advertiser_id: 5, v3_brand_id: 6 });
    expect(res.status).toBe(200);
    expect(res.body.entry).toMatchObject({ v3_advertiser_id: 5, v3_brand_id: 6, manual: true });
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
