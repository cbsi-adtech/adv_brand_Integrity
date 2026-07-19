import { XMLBuilder } from 'fast-xml-parser';

const BUILDER_OPTS = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  format: false,
  suppressEmptyNode: false,
};

// FW V3 brand response shape (parsed JSON from invoke_tool):
//   { brand: { id, name, status, ..., industry: null | { industry_id: "5063" | ["a","b"] } } }
//
// FW V3 update endpoint expects an XML body. This function takes the parsed
// brand object, sets a single industry_id, and serializes back to XML.
//
// Per the project's industry-inheritance rule: brand-level industry overrides
// the advertiser-level inherited value. Setting `industry: { industry_id: NEW }`
// at the brand level establishes a single effective industry for that brand.
export function mutateBrandIndustry(brandPayload, newIndustryId) {
  const idOk = typeof newIndustryId === 'number'
    ? Number.isInteger(newIndustryId) && newIndustryId > 0
    : /^\d+$/.test(String(newIndustryId)) && Number(newIndustryId) > 0;
  if (!idOk) {
    throw new Error('new industry id must be numeric (a positive integer)');
  }
  if (brandPayload == null || typeof brandPayload !== 'object') {
    throw new Error('brand payload must be an object');
  }

  const brand = brandPayload.brand ?? brandPayload;
  if (!brand || typeof brand !== 'object') {
    throw new Error('no brand object in payload');
  }

  const next = { ...brand, industry: { industry_id: String(newIndustryId) } };

  const builder = new XMLBuilder(BUILDER_OPTS);
  const body = builder.build({ brand: next });
  return body.startsWith('<?xml') ? body : `<?xml version="1.0"?>\n${body}`;
}
