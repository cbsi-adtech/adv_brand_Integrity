// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { mutateBrandIndustry } from '../mutate-brand-xml.js';

describe('mutateBrandIndustry', () => {
  it('writes a single industry_id when brand currently has scalar industry', () => {
    // Real FW shape: J&J / Aveeno
    const before = {
      brand: {
        id: '179073',
        name: 'Aveeno Lotion (Brand)',
        status: 'ACTIVE',
        industry: { industry_id: '5063' },
        global_mapping: { entity_id: '1017972', entity_type: 'GLOBAL_BRAND' },
      },
    };
    const xml = mutateBrandIndustry(before, 5251);
    expect(xml).toMatch(/<industry>\s*<industry_id>5251<\/industry_id>\s*<\/industry>/);
    expect(xml).not.toMatch(/5063/);
    expect(xml).toMatch(/<name>Aveeno Lotion \(Brand\)<\/name>/);
    expect(xml).toMatch(/<global_mapping>/);
  });

  it('replaces an array industry with a single new id', () => {
    // Real FW shape: Papelera Del Plata (multi-industry brand)
    const before = {
      brand: {
        id: '270681',
        name: 'Papelera Del Plata',
        industry: { industry_id: ['9356', '389'] },
      },
    };
    const xml = mutateBrandIndustry(before, 5251);
    expect(xml).toMatch(/<industry>\s*<industry_id>5251<\/industry_id>\s*<\/industry>/);
    expect(xml).not.toMatch(/9356/);
    expect(xml).not.toMatch(/389/);
  });

  it('writes industry when brand currently has industry: null (overrides advertiser inheritance)', () => {
    // Real FW shape: Carvana — brand inherits advertiser industry until brand-level is set
    const before = {
      brand: {
        id: '178687',
        name: 'Carvana (Brand)',
        status: 'ACTIVE',
        industry: null,
        global_mapping: { entity_id: '1066463', entity_type: 'GLOBAL_BRAND' },
      },
    };
    const xml = mutateBrandIndustry(before, 5251);
    expect(xml).toMatch(/<industry>\s*<industry_id>5251<\/industry_id>\s*<\/industry>/);
    expect(xml).toMatch(/<name>Carvana \(Brand\)<\/name>/);
  });

  it('accepts a bare brand object (no { brand } wrapper)', () => {
    const before = { id: '1', name: 'X', industry: null };
    const xml = mutateBrandIndustry(before, 42);
    expect(xml).toMatch(/<industry>\s*<industry_id>42<\/industry_id>\s*<\/industry>/);
  });

  it('throws when given a non-numeric new id', () => {
    expect(() => mutateBrandIndustry({ brand: { id: '1', industry: null } }, 'abc'))
      .toThrow(/numeric/i);
  });

  it('throws for NaN, negative, zero, and non-integer numeric ids', () => {
    const payload = () => ({ brand: { id: '1', industry: null } });
    expect(() => mutateBrandIndustry(payload(), NaN)).toThrow(/numeric/i);
    expect(() => mutateBrandIndustry(payload(), -5)).toThrow(/numeric/i);
    expect(() => mutateBrandIndustry(payload(), 0)).toThrow(/numeric/i);
    expect(() => mutateBrandIndustry(payload(), 5.5)).toThrow(/numeric/i);
  });

  it('throws when payload is not an object', () => {
    expect(() => mutateBrandIndustry(null, 5251)).toThrow(/object/i);
    expect(() => mutateBrandIndustry('xml', 5251)).toThrow(/object/i);
  });
});
