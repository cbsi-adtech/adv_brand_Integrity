import { useState } from 'react';
import { usePendingStore } from '../state/pendingStore.js';

export function ReviewApplyModal({ open, onClose }) {
  const items = usePendingStore((s) => s.items);
  const setStatus = usePendingStore((s) => s.setStatus);
  const [applying, setApplying] = useState(false);

  if (!open) return null;

  const amItems = Object.values(items).filter((i) => i.type === 'am-industry');

  async function applyAll() {
    setApplying(true);
    try {
      const changes = amItems.map((i) => ({
        v3_advertiser_id: i.payload.v3_advertiser_id,
        v3_brand_id: i.payload.v3_brand_id,
        brand_name: i.brand.global_brand_nm,
        current_industry_id: i.payload.before?.industry_id,
        new_industry_id: i.payload.after.industry_id,
      }));
      amItems.forEach((i) => setStatus(i.id, 'applying'));
      const res = await fetch('/api/changes/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes }),
      });
      const data = await res.json();
      data.results?.forEach((r, idx) => {
        const item = amItems[idx];
        if (!item) return;
        if (r.status === 'ok') setStatus(item.id, 'applied');
        else setStatus(item.id, 'failed', { message: r.error });
      });
    } catch (e) {
      amItems.forEach((i) => setStatus(i.id, 'failed', { message: e.message }));
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 max-w-3xl w-full max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Review & Apply</h2>
          <button onClick={onClose} aria-label="close">✕</button>
        </div>

        {amItems.length > 0 && (
          <section className="mb-4">
            <h3 className="font-medium mb-2">Advertiser Module industry edits ({amItems.length})</h3>
            <ul>
              {amItems.map((i) => (
                <li key={i.id} className="border rounded p-2 mb-1">
                  <div className="font-medium">{i.brand.global_brand_nm} ({i.brand.global_brand_id})</div>
                  <div className="text-sm text-slate-600">
                    {i.payload.before?.path ?? '—'} → {i.payload.after.path}
                  </div>
                  <div className="text-xs">{statusLabel(i.status)}</div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <button className="px-4 py-2 bg-emerald-600 text-white rounded disabled:opacity-50"
          onClick={applyAll} disabled={applying || amItems.length === 0}>
          {applying ? 'Applying…' : 'Apply'}
        </button>
      </div>
    </div>
  );
}

function statusLabel(s) {
  return { staged: '⌛ staged', applying: '… applying', applied: '✓ applied', failed: '✗ failed' }[s] ?? s;
}
