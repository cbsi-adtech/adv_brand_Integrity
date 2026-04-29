import { describe, it, expect } from 'vitest';
import { mutateBrandIndustry } from '../mutate-brand-xml.js';

describe('mutateBrandIndustry', () => {
  it('replaces a scalar <industry_id> element', () => {
    const before = `<?xml version="1.0"?>
<brand>
  <id>67890</id>
  <name>Geico</name>
  <industry_id>5249</industry_id>
</brand>`;

    const after = mutateBrandIndustry(before, 5251);
    expect(after).toMatch(/<industry_id>\s*5251\s*<\/industry_id>/);
    expect(after).not.toMatch(/5249/);
    expect(after).toMatch(/<name>Geico<\/name>/);
  });

  it('replaces the entry inside an <industries> list', () => {
    const before = `<?xml version="1.0"?>
<brand>
  <id>67890</id>
  <industries>
    <industry id="5249"/>
  </industries>
</brand>`;

    const after = mutateBrandIndustry(before, 5251);
    expect(after).toMatch(/id="5251"/);
    expect(after).not.toMatch(/5249/);
  });

  it('throws when no industry field is present', () => {
    const before = `<?xml version="1.0"?><brand><id>1</id></brand>`;
    expect(() => mutateBrandIndustry(before, 5251)).toThrow(/no industry field/i);
  });

  it('throws when given a non-numeric new id', () => {
    const before = `<?xml version="1.0"?><brand><industry_id>1</industry_id></brand>`;
    expect(() => mutateBrandIndustry(before, 'abc')).toThrow(/numeric/i);
  });
});
