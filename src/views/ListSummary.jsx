import { useMemo } from 'react';
import { FLAG_STYLES, FLAG_FILTER_ORDER, flagKey } from './flagStyles.js';
import { impactSummary, fmtCurrencyCompact, fmtNumberCompact } from './impact.js';

export function ListSummary({ rows, filteredCount, filters, onFiltersChange,
                             unresolvedV3Count = 0, resolving = null, onResolveV3, onCancelResolve }) {
  const counts = useMemo(() => {
    const c = {};
    for (const r of rows) {
      for (const f of r.flags ?? []) {
        const k = flagKey(f);
        c[k] = (c[k] ?? 0) + 1;
      }
    }
    return c;
  }, [rows]);

  const impact = useMemo(() => impactSummary(rows), [rows]);

  const activeTypes = new Set(filters.flagTypes ?? []);

  function toggle(key) {
    // F1_high is a distinct filter from F1: F1_high matches only impressions-weighted
    // high-impact F1 rows; F1 matches plain (non-high-impact) F1 rows.
    const next = new Set(filters.flagTypes ?? []);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onFiltersChange?.({ ...filters, flagTypes: [...next] });
  }

  function clearAll() {
    onFiltersChange?.({ ...filters, flagTypes: [] });
  }

  return (
    <div className="bg-brand-navy/95 backdrop-blur border-b border-white/10 px-4 py-3 sticky top-0 z-10">
      <div className="flex items-baseline gap-4 mb-3 flex-wrap">
        <h1 className="font-display text-2xl font-bold tracking-wide uppercase">
          Brand Industry Issues
        </h1>
        <div className="text-sm text-brand-grey">
          Showing <strong className="text-white">{filteredCount.toLocaleString()}</strong> of {rows.length.toLocaleString()} brands
        </div>
        {(filters.flagTypes?.length ?? 0) > 0 && (
          <button onClick={clearAll}
                  className="text-xs text-brand-sky hover:underline">
            Clear flag filter
          </button>
        )}
        {unresolvedV3Count > 0 && !resolving && (
          <button
            onClick={onResolveV3}
            className="ml-auto text-xs px-3 py-1 rounded bg-brand-peak hover:bg-brand-peakhover text-white font-semibold"
            title="Resolve V3 advertiser/brand IDs for brands missing them, ordered by priority (F2/F1 first, then impressions). Required before applying Advertiser Module industry edits."
          >
            Resolve V3 ids ({unresolvedV3Count.toLocaleString()} missing)
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <KpiCard label="Revenue at risk" value={fmtCurrencyCompact(impact.revenueAtRisk)}
          tone="text-brand-horizon"
          hint="Total revenue on brands carrying at least one integrity flag" />
        <KpiCard label="Impressions at risk" value={fmtNumberCompact(impact.impressionsAtRisk)}
          tone="text-brand-sunrise"
          hint="Total impressions on flagged brands — more impressions, bigger impact" />
        <KpiCard label="Flagged brands" value={impact.flaggedCount.toLocaleString()}
          tone="text-white"
          hint="Brands with at least one integrity flag" />
        <KpiCard label="High-impact generic" value={impact.highImpactCount.toLocaleString()}
          tone="text-brand-sunrise"
          hint="🔥 Too-generic Programmatic industry above the impressions threshold" />
      </div>

      {resolving && (
        <div className="text-xs bg-brand-card border border-brand-peak/40 rounded px-3 py-2 mb-2 flex items-center gap-3">
          <span className="font-medium text-white">
            Resolving V3 ids… {resolving.done.toLocaleString()} / {resolving.total.toLocaleString()}
          </span>
          <span className="text-brand-grey">✓ {resolving.hits} resolved · ✗ {resolving.misses} not found</span>
          <span className="text-brand-grey/70 italic flex-1 truncate" title={(resolving.batch ?? []).join(', ')}>
            current batch: {(resolving.batch ?? []).slice(0, 3).join(', ')}{(resolving.batch ?? []).length > 3 ? '…' : ''}
          </span>
          <button onClick={onCancelResolve}
            className="text-xs px-2 py-0.5 rounded border border-white/30 text-white hover:bg-white/10">
            Cancel
          </button>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {FLAG_FILTER_ORDER.map((key) => {
          const count = counts[key] ?? 0;
          if (count === 0) return null;
          const style = FLAG_STYLES[key];
          const active = activeTypes.has(key);
          return (
            <button key={key} onClick={() => toggle(key)}
              className={`text-xs px-2 py-1 rounded border ${style.color} ${active ? 'ring-2 ring-offset-1 ring-offset-brand-navy ring-brand-peak' : 'opacity-90 hover:opacity-100'}`}>
              {style.label} · {count.toLocaleString()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function KpiCard({ label, value, tone, hint }) {
  return (
    <div className="bg-brand-card border border-white/10 rounded-lg px-4 py-3" title={hint}>
      <div className={`font-display font-bold text-3xl leading-none ${tone}`}>{value}</div>
      <div className="text-[11px] text-brand-grey uppercase tracking-widest mt-1.5">{label}</div>
    </div>
  );
}
