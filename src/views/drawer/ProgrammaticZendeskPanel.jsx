import { useState } from 'react';
import { IndustryPicker } from '../IndustryPicker.jsx';
import { usePendingStore } from '../../state/pendingStore.js';

export function ProgrammaticZendeskPanel({ row, taxonomy }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(null);
  const stage = usePendingStore((s) => s.stage);
  const remove = usePendingStore((s) => s.remove);
  const existingDraft = usePendingStore((s) =>
    Object.values(s.items).find(
      (it) => it.type === 'zendesk-draft' && it.brand.global_brand_id === row.global_brand_id,
    ),
  );

  function handleAdd() {
    if (picked == null) return;
    const after = taxonomy.byId(picked);
    if (!after) return;
    stage({
      type: 'zendesk-draft',
      brand: {
        global_brand_id: row.global_brand_id,
        global_brand_nm: row.global_brand_nm,
        global_advertiser_id: row.global_advertiser_id,
        global_advertiser_nm: row.global_advertiser_nm,
      },
      payload: {
        from_industry: row.pg?.resolved_industry_name ?? '(unknown)',
        to_industry: after.name,
        to_industry_path: taxonomy.pathOf(after.id),
      },
    });
    setOpen(false);
    setPicked(null);
  }

  if (existingDraft) {
    return (
      <section className="mt-4 border rounded p-3 bg-emerald-50">
        <div className="text-sm">
          ✓ Added to Zendesk draft: <strong>{existingDraft.payload.to_industry}</strong> (from {existingDraft.payload.from_industry})
        </div>
        <div className="text-xs text-slate-600 mt-1">
          Open <strong>Review &amp; Apply</strong> to see the combined email body for all staged drafts.
        </div>
        <button
          onClick={() => remove(existingDraft.id)}
          className="mt-2 px-2 py-0.5 bg-slate-200 rounded text-xs">
          Remove from draft
        </button>
      </section>
    );
  }

  if (!taxonomy) return null;

  return (
    <section className="mt-4 border rounded p-3">
      {!open ? (
        <button onClick={() => setOpen(true)} className="px-3 py-1 bg-slate-200 rounded text-sm">
          Add to Zendesk draft (ask FreeWheel to remap Programmatic Module)
        </button>
      ) : (
        <>
          <h3 className="font-medium mb-1">Pick suggested industry</h3>
          <div className="text-sm mb-2">
            Current Programmatic Module: <strong>{row.pg?.resolved_industry_name ?? '—'}</strong>
          </div>
          <IndustryPicker taxonomy={taxonomy} onPick={setPicked} />
          {picked != null && (
            <div className="text-sm mt-2">
              Will request: <strong>{taxonomy.pathOf(picked)}</strong>
            </div>
          )}
          <div className="mt-2 flex gap-2">
            <button onClick={handleAdd} disabled={picked == null}
              className="px-3 py-1 bg-emerald-600 text-white rounded disabled:opacity-50">
              Add to draft
            </button>
            <button onClick={() => { setOpen(false); setPicked(null); }}
              className="px-3 py-1 bg-slate-200 rounded">
              Cancel
            </button>
          </div>
        </>
      )}
    </section>
  );
}
