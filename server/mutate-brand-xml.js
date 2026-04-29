import { XMLParser, XMLBuilder } from 'fast-xml-parser';

const PARSER_OPTS = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  preserveOrder: false,
  trimValues: false,
};

const BUILDER_OPTS = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  format: false,
  suppressEmptyNode: false,
};

function findAndMutate(node, newId, ctx) {
  if (node == null || typeof node !== 'object') return false;

  if ('industry_id' in node) {
    node.industry_id = String(newId);
    ctx.found = true;
    return true;
  }

  if ('industries' in node && node.industries && typeof node.industries === 'object') {
    const inner = node.industries.industry;
    if (Array.isArray(inner) && inner.length > 0) {
      inner[0]['@_id'] = String(newId);
      ctx.found = true;
      return true;
    }
    if (inner && typeof inner === 'object') {
      inner['@_id'] = String(newId);
      ctx.found = true;
      return true;
    }
  }

  for (const key of Object.keys(node)) {
    const v = node[key];
    if (Array.isArray(v)) {
      for (const item of v) findAndMutate(item, newId, ctx);
    } else if (v && typeof v === 'object') {
      findAndMutate(v, newId, ctx);
    }
    if (ctx.found) return true;
  }
  return false;
}

export function mutateBrandIndustry(xmlString, newIndustryId) {
  if (typeof newIndustryId !== 'number' && !/^\d+$/.test(String(newIndustryId))) {
    throw new Error('new industry id must be numeric');
  }
  const parser = new XMLParser(PARSER_OPTS);
  const tree = parser.parse(xmlString);

  const ctx = { found: false };
  findAndMutate(tree, newIndustryId, ctx);

  if (!ctx.found) {
    throw new Error('no industry field found in brand XML');
  }

  const builder = new XMLBuilder(BUILDER_OPTS);
  const body = builder.build(tree);
  return body.startsWith('<?xml') ? body : `<?xml version="1.0"?>\n${body}`;
}
