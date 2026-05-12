import { useState } from 'react';
import { usePendingStore } from '../state/pendingStore.js';

export function ReviewApplyModal({ open, onClose, rows = [] }) {
  const items = usePendingStore((s) => s.items);
  const setStatus = usePendingStore((s) => s.setStatus);
  const [applying, setApplying] = useState(false);

  if (!open) return null;

  // Lookup for fresh v3 ids — payload was a snapshot at stage time and may be
  // stale (e.g., V3 resolution happened after staging).
  const rowById = new Map(rows.map((r) => [r.global_brand_id, r]));
  const v3For = (item) => {
    const r = rowById.get(item.brand.global_brand_id);
    return {
      v3_advertiser_id: item.payload.v3_advertiser_id ?? r?.v3_advertiser_id ?? null,
      v3_brand_id:      item.payload.v3_brand_id      ?? r?.v3_brand_id      ?? null,
    };
  };

  const amItems = Object.values(items).filter((i) => i.type === 'am-industry');

  async function applyAll() {
    setApplying(true);
    try {
      // Items missing v3 ids cannot apply — server requires integers.
      const ready   = [];
      const blocked = [];
      for (const i of amItems) {
        const v3 = v3For(i);
        if (Number.isInteger(v3.v3_advertiser_id) && Number.isInteger(v3.v3_brand_id)) {
          ready.push({ item: i, ...v3 });
        } else {
          blocked.push(i);
        }
      }
      blocked.forEach((i) => setStatus(i.id, 'failed', { message: 'Missing V3 advertiser/brand id — run "Resolve V3 ids" first.' }));

      if (ready.length === 0) return;

      const changes = ready.map(({ item, v3_advertiser_id, v3_brand_id }) => ({
        v3_advertiser_id,
        v3_brand_id,
        brand_name: item.brand.global_brand_nm,
        current_industry_id: item.payload.before?.industry_id,
        new_industry_id: item.payload.after.industry_id,
      }));
      ready.forEach(({ item }) => setStatus(item.id, 'applying'));

      let res, data;
      try {
        res = await fetch('/api/changes/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ changes }),
        });
        data = await res.json().catch(() => ({}));
      } catch (netErr) {
        ready.forEach(({ item }) => setStatus(item.id, 'failed', { message: `Network error: ${netErr.message}` }));
        return;
      }

      if (!res.ok || !Array.isArray(data.results)) {
        const msg = data?.error || `HTTP ${res.status}: ${res.statusText || 'apply failed'}`;
        ready.forEach(({ item }) => setStatus(item.id, 'failed', { message: msg }));
        return;
      }

      data.results.forEach((r, idx) => {
        const entry = ready[idx];
        if (!entry) return;
        if (r.status === 'ok') setStatus(entry.item.id, 'applied');
        else setStatus(entry.item.id, 'failed', { message: r.error || 'Unknown server error' });
      });
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
                  {i.status === 'failed' && i.error?.message && (
                    <div className="text-xs text-red-700 mt-1">{i.error.message}</div>
                  )}
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
