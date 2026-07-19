import { useMemo, useState } from 'react';
import { usePendingStore } from '../../state/pendingStore.js';

const CONFIDENCE_THRESHOLD = 0.9;

export function SuggestionsPanel({ row, taxonomy }) {
  const stage = usePendingStore((s) => s.stage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiResult, setApiResult] = useState(null);   // {suggestion_id, confidence, reason, usage}

  const hasF1 = (row.flags ?? []).some((f) => f.type === 'F1' && f.side === 'pg');
  const pgIndustryId = row.pg?.resolved_industry_id;

  // Build candidate list — descendants of the F1 parent (children + grandchildren)
  const candidates = useMemo(() => {
    if (!hasF1 || !taxonomy || !pgIndustryId) return [];
    return taxonomy.descendantsOf(pgIndustryId).map((e) => ({
      id: e.id, name: e.name, path: taxonomy.pathOf(e.id), depth: e.depth,
    }));
  }, [hasF1, taxonomy, pgIndustryId]);

  // AM-side hint: if AM is a descendant of the F1 parent, use it as the suggestion (no API call).
  const amHint = useMemo(() => {
    if (!hasF1 || !taxonomy || !pgIndustryId) return null;
    const amId = row.am?.resolved_industry_id;
    if (amId == null) return null;
    if (!taxonomy.isAncestor(pgIndustryId, amId)) return null;
    return {
      suggestion_id: amId,
      confidence: 1.0,
      reason: 'Advertiser Module is already at a more specific industry under this parent.',
      source: 'am-hint',
    };
  }, [hasF1, taxonomy, pgIndustryId, row.am]);

  if (!hasF1 || !taxonomy) return null;

  async function fetchSuggestion() {
    setError(null);
    setApiResult(null);
    setLoading(true);
    try {
      const res = await fetch('/api/suggest-industry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_name: row.global_brand_nm,
          advertiser_name: row.global_advertiser_nm,
          parent_industry: row.pg?.resolved_industry_name,
          candidates,
        }),
      });
      const raw = await res.text();
      let data = null;
      if (raw) {
        try { data = JSON.parse(raw); } catch { /* leave null */ }
      }
      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}: ${raw || 'empty body'}`);
      }
      if (!data) throw new Error('Empty response from server');
      setApiResult({ ...data, source: 'web-research' });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function stageSuggestion(suggestion) {
    const after = taxonomy.byId(suggestion.suggestion_id);
    if (!after) {
      setError('Suggested industry not found in taxonomy.');
      return;
    }
    stage({
      type: 'am-industry',
      brand: {
        global_brand_id: row.global_brand_id,
        global_brand_nm: row.global_brand_nm,
        global_advertiser_id: row.global_advertiser_id,
        global_advertiser_nm: row.global_advertiser_nm,
      },
      payload: {
        before: row.am ? {
          industry_id: row.am.resolved_industry_id,
          industry_name: row.am.resolved_industry_name,
          depth: row.am.resolved_industry_depth,
          path: row.am.resolved_industry_path,
        } : null,
        after: {
          industry_id: after.id,
          industry_name: after.name,
          depth: after.depth,
          path: taxonomy.pathOf(after.id),
        },
        v3_advertiser_id: row.v3_advertiser_id,
        v3_brand_id: row.v3_brand_id,
      },
    });
  }

  // Prefer AM hint when available; otherwise show API path.
  const displaySuggestion = amHint ?? apiResult;
  const meetsThreshold = displaySuggestion?.confidence >= CONFIDENCE_THRESHOLD;

  return (
    <section className="mt-4 border border-brand-sunrise/40 rounded p-3 bg-brand-sunrise/5">
      <h3 className="font-medium mb-2 text-brand-sunrise">Suggested industry (F1 flagged)</h3>

      {amHint ? (
        <SuggestionCard
          suggestion={amHint}
          taxonomy={taxonomy}
          meetsThreshold={true}
          onStage={() => stageSuggestion(amHint)}
        />
      ) : (
        <>
          <p className="text-sm text-brand-grey mb-2">
            Advertiser Module doesn't sit under the same parent. Click below to research the brand on the open web and pick a more specific industry from the {candidates.length} candidates under <strong>{row.pg?.resolved_industry_name}</strong>.
          </p>

          {!apiResult && !loading && (
            <button onClick={fetchSuggestion}
              className="px-3 py-1 bg-brand-peak hover:bg-brand-peakhover text-white rounded text-sm">
              Research brand & suggest industry
            </button>
          )}

          {loading && (
            <div className="text-sm text-brand-grey">Researching {row.global_brand_nm}…</div>
          )}

          {error && (
            <div className="text-sm text-brand-horizon mt-1">{error}</div>
          )}

          {apiResult && (
            <SuggestionCard
              suggestion={apiResult}
              taxonomy={taxonomy}
              meetsThreshold={meetsThreshold}
              onStage={() => stageSuggestion(apiResult)}
              onRetry={fetchSuggestion}
            />
          )}
        </>
      )}
    </section>
  );
}

function SuggestionCard({ suggestion, taxonomy, meetsThreshold, onStage, onRetry }) {
  const entry = taxonomy.byId(suggestion.suggestion_id);
  if (!entry) {
    return <div className="text-sm text-brand-horizon">Suggested industry id {suggestion.suggestion_id} not in taxonomy.</div>;
  }
  const path = taxonomy.pathOf(entry.id);
  const confidencePct = Math.round((suggestion.confidence ?? 0) * 100);
  const isAmHint = suggestion.source === 'am-hint';

  return (
    <div className="border border-white/15 rounded p-2 bg-brand-card">
      <div className="font-medium text-sm text-white">{path}</div>
      <div className="text-xs text-brand-grey mt-1">
        Confidence: <strong className={meetsThreshold ? 'text-brand-success' : 'text-brand-sunrise'}>{confidencePct}%</strong>
        {' · '}
        Source: {isAmHint ? 'Advertiser Module' : 'web research'}
      </div>
      <div className="text-xs text-brand-grey/80 mt-1 italic">{suggestion.reason}</div>

      {meetsThreshold ? (
        <button onClick={onStage}
          className="mt-2 px-3 py-1 bg-brand-peak hover:bg-brand-peakhover text-white rounded text-sm">
          Use as Advertiser Module industry
        </button>
      ) : (
        <div className="mt-2 text-xs text-brand-sunrise">
          Confidence below {Math.round(CONFIDENCE_THRESHOLD * 100)}% threshold — not suggested for automatic use.
          {onRetry && (
            <button onClick={onRetry}
              className="ml-2 px-2 py-0.5 border border-white/30 text-white hover:bg-white/10 rounded">
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
