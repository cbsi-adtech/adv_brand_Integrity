import Anthropic from '@anthropic-ai/sdk';

// Lazy-init so importing this module doesn't construct the SDK client
// (vitest's jsdom env trips the SDK's browser-safety check at module load).
let _client = null;
function getClient() {
  if (_client) return _client;
  _client = new Anthropic();   // reads ANTHROPIC_API_KEY from process.env
  return _client;
}

const SYSTEM_PROMPT = `You are an industry-classification analyst. Given a brand and a list of candidate FreeWheel taxonomy industries (children/grandchildren of a parent industry), you:

1. Use the web_search tool to research the brand's actual business — what they sell, who they sell to, their revenue model.
2. Pick exactly ONE industry from the supplied candidates. Prefer the most specific (deepest) industry the brand clearly fits.
3. Give a confidence score from 0.0 to 1.0 based on how clearly the brand matches.
4. Return a one-sentence reason citing the evidence from your research.

Respond with JSON only, no preamble: {"suggestion_id": <integer id from candidates>, "confidence": <number 0.0-1.0>, "reason": "<one sentence>"}.`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    suggestion_id: { type: 'integer' },
    confidence: { type: 'number' },
    reason: { type: 'string' },
  },
  required: ['suggestion_id', 'confidence', 'reason'],
  additionalProperties: false,
};

export async function suggestIndustry({ brand_name, advertiser_name, parent_industry, candidates }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not set in .env');
  }
  if (!brand_name) {
    throw new Error('brand_name is required');
  }
  if (!parent_industry) {
    throw new Error('parent_industry is required');
  }
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error('candidates must be a non-empty array');
  }

  // Stable textual representation of the candidate list — same parent → same
  // bytes → cache hit on subsequent requests for other brands under this parent.
  const candidateText = candidates
    .map((c) => `  - id=${c.id}: ${c.path}`)
    .join('\n');

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    tools: [
      { type: 'web_search_20250305', name: 'web_search' },
    ],
    system: SYSTEM_PROMPT,
    output_config: {
      format: { type: 'json_schema', schema: RESPONSE_SCHEMA },
    },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Parent industry: ${parent_industry}\n\nCandidate child/grandchild industries (pick exactly one):\n${candidateText}`,
            // Cache prefix ends here — parent + candidate list is stable across
            // every brand under the same parent industry.
            cache_control: { type: 'ephemeral' },
          },
          {
            type: 'text',
            text: `Brand to classify:\n  Name: ${brand_name}\n  Advertiser: ${advertiser_name || '(unknown)'}\n\nResearch this brand on the web, then pick the best industry from the candidates above and respond with JSON only.`,
          },
        ],
      },
    ],
  });

  // Server tools (web_search) produce interim blocks before the final answer.
  // Take the LAST text block — that's where the JSON answer lands.
  const textBlocks = response.content.filter((b) => b.type === 'text');
  if (textBlocks.length === 0) {
    throw new Error('No text response from model');
  }
  const lastText = textBlocks[textBlocks.length - 1].text;

  let parsed;
  try {
    parsed = JSON.parse(lastText);
  } catch {
    throw new Error(`Model response was not valid JSON: ${lastText.slice(0, 200)}`);
  }

  // Defense-in-depth: validate the chosen id is actually in the supplied list.
  // The json_schema doesn't constrain the enum (taxonomy is too large for that),
  // so the model could theoretically hallucinate an id.
  const validIds = new Set(candidates.map((c) => c.id));
  if (!validIds.has(parsed.suggestion_id)) {
    throw new Error(`Model picked suggestion_id ${parsed.suggestion_id} not in candidate list`);
  }

  return {
    suggestion_id: parsed.suggestion_id,
    confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
    reason: String(parsed.reason || ''),
    stop_reason: response.stop_reason,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      cache_creation_input_tokens: response.usage.cache_creation_input_tokens ?? 0,
      cache_read_input_tokens: response.usage.cache_read_input_tokens ?? 0,
    },
  };
}
