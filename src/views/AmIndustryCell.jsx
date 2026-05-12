import { useEffect, useRef, useState } from 'react';
import { IndustryPicker } from './IndustryPicker.jsx';
import { usePendingStore } from '../state/pendingStore.js';

export function AmIndustryCell({ row, taxonomy }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const ref = useRef(null);
  const stage = usePendingStore((s) => s.stage);
  const pendingForRow = usePendingStore((s) =>
    Object.values(s.items).find(
      (it) => it.type === 'am-industry' && it.brand.global_brand_id === row.global_brand_id && it.status !== 'applied',
    ),
  );

  useEffect(() => {
    if (!open) return;
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  function handlePick(id) {
    setError(null);
    if (id === row.am?.resolved_industry_id) { setError('Same as current.'); return; }
    if (taxonomy.isGroupId(id)) { setError('Group IDs are not assignable.'); return; }
    const after = taxonomy.byId(id);
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
    setOpen(false);
  }

  const label = pendingForRow
    ? pendingForRow.payload.after.path
    : (row.am?.resolved_industry_name ?? '—');

  return (
    <span className="relative inline-block" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`text-left px-2 py-0.5 rounded border text-sm hover:bg-slate-100 ${
          pendingForRow
            ? 'border-amber-400 bg-amber-50 text-amber-900'
            : 'border-slate-300 bg-white text-slate-800'
        }`}
        title={pendingForRow ? `Pending: → ${pendingForRow.payload.after.path}` : 'Click to change Advertiser Module industry'}
      >
        {label} {pendingForRow ? '✎' : ''}
      </button>
      {open && (
        <div className="absolute z-30 mt-1 left-0 bg-white shadow-lg w-[24rem]">
          <IndustryPicker taxonomy={taxonomy} onPick={handlePick} />
          {error && <div className="text-red-700 text-xs px-2 py-1">{error}</div>}
        </div>
      )}
    </span>
  );
}
