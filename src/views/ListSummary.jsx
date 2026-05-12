import { useMemo } from 'react';
import { FLAG_STYLES, FLAG_FILTER_ORDER, flagKey } from './flagStyles.js';

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
    <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
      <div className="flex items-baseline gap-4 mb-2 flex-wrap">
        <h1 className="text-xl font-semibold">Brand Industry Issues</h1>
        <div className="text-sm text-slate-600">
          Showing <strong>{filteredCount.toLocaleString()}</strong> of {rows.length.toLocaleString()} brands
        </div>
        {(filters.flagTypes?.length ?? 0) > 0 && (
          <button onClick={clearAll}
                  className="text-xs text-blue-600 hover:underline">
            Clear flag filter
          </button>
        )}
        {unresolvedV3Count > 0 && !resolving && (
          <button
            onClick={onResolveV3}
            className="ml-auto text-xs px-3 py-1 rounded bg-emerald-600 text-white"
            title="Resolve V3 advertiser/brand IDs for brands missing them, ordered by priority (F2/F1 first, then impressions). Required before applying Advertiser Module industry edits."
          >
            Resolve V3 ids ({unresolvedV3Count.toLocaleString()} missing)
          </button>
        )}
      </div>

      {resolving && (
        <div className="text-xs bg-blue-50 border border-blue-200 rounded px-3 py-2 mb-2 flex items-center gap-3">
          <span className="font-medium">
            Resolving V3 ids… {resolving.done.toLocaleString()} / {resolving.total.toLocaleString()}
          </span>
          <span className="text-slate-600">✓ {resolving.hits} resolved · ✗ {resolving.misses} not found</span>
          <span className="text-slate-500 italic flex-1 truncate" title={(resolving.batch ?? []).join(', ')}>
            current batch: {(resolving.batch ?? []).slice(0, 3).join(', ')}{(resolving.batch ?? []).length > 3 ? '…' : ''}
          </span>
          <button onClick={onCancelResolve}
            className="text-xs px-2 py-0.5 rounded bg-slate-700 text-white">
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
              className={`text-xs px-2 py-1 rounded border ${style.color} ${active ? 'ring-2 ring-offset-1 ring-slate-800' : 'opacity-90 hover:opacity-100'}`}>
              {style.label} · {count.toLocaleString()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
