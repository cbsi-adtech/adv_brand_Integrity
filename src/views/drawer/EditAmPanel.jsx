import { useState } from 'react';
import { IndustryPicker } from '../IndustryPicker.jsx';
import { usePendingStore } from '../../state/pendingStore.js';

export function EditAmPanel({ row, taxonomy }) {
  const [open, setOpen] = useState(false);
  const [pickedId, setPickedId] = useState(null);
  const [error, setError] = useState(null);
  const stage = usePendingStore((s) => s.stage);

  function handleStage() {
    setError(null);
    if (pickedId == null) { setError('Pick an industry first.'); return; }
    if (pickedId === row.am?.resolved_industry_id) { setError('Selection is unchanged from current.'); return; }
    if (taxonomy.isGroupId(pickedId)) { setError('Group IDs are not assignable.'); return; }

    const after = taxonomy.byId(pickedId);
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
    setPickedId(null);
  }

  return (
    <section className="mt-4 border rounded p-3">
      {!open ? (
        <button onClick={() => setOpen(true)} className="px-3 py-1 bg-slate-200 rounded">
          Edit Advertiser Module industry
        </button>
      ) : (
        <>
          <h3 className="font-medium mb-2">Edit Advertiser Module industry</h3>
          <div className="text-sm mb-2">Current: {row.am?.resolved_industry_path ?? '—'}</div>
          <IndustryPicker taxonomy={taxonomy} onPick={setPickedId} />
          {pickedId != null && (
            <div className="text-sm mt-2">New: {taxonomy.pathOf(pickedId)}</div>
          )}
          {error && <div className="text-red-700 text-sm mt-1">{error}</div>}
          <div className="mt-2 flex gap-2">
            <button onClick={handleStage} className="px-3 py-1 bg-emerald-600 text-white rounded">
              Stage change
            </button>
            <button onClick={() => { setOpen(false); setPickedId(null); }}
                    className="px-3 py-1 bg-slate-200 rounded">
              Cancel
            </button>
          </div>
        </>
      )}
    </section>
  );
}
