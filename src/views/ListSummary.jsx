import { useMemo } from 'react';
import { FLAG_STYLES, FLAG_FILTER_ORDER, flagKey } from './flagStyles.js';

export function ListSummary({ rows, filteredCount, filters, onFiltersChange }) {
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
    // Note: filters.flagTypes operates on `type` codes; F1_high is treated as F1
    // because the data row carries type:'F1' with highImpact:true. So clicking
    // the F1_high chip filters by F1 (which includes both variants).
    const filterValue = key === 'F1_high' ? 'F1' : key;
    const next = new Set(filters.flagTypes ?? []);
    if (next.has(filterValue)) next.delete(filterValue);
    else next.add(filterValue);
    onFiltersChange?.({ ...filters, flagTypes: [...next] });
  }

  function clearAll() {
    onFiltersChange?.({ ...filters, flagTypes: [] });
  }

  return (
    <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
      <div className="flex items-baseline gap-4 mb-2">
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
      </div>
      <div className="flex flex-wrap gap-2">
        {FLAG_FILTER_ORDER.map((key) => {
          const count = counts[key] ?? 0;
          if (count === 0) return null;
          const style = FLAG_STYLES[key];
          const filterValue = key === 'F1_high' ? 'F1' : key;
          const active = activeTypes.has(filterValue);
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
