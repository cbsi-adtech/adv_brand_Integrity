import { useState } from 'react';
import { usePendingStore } from '../state/pendingStore.js';

export function ReviewApplyModal({ open, onClose, rows = [], onResolveOne, onSetManualV3 }) {
  const items = usePendingStore((s) => s.items);
  const setStatus = usePendingStore((s) => s.setStatus);
  const [applying, setApplying] = useState(false);
  const [resolvingId, setResolvingId] = useState(null);
  const [resolveError, setResolveError] = useState(null);
  const [manualForBrand, setManualForBrand] = useState(null);  // global_brand_id currently editing manual entry
  const [manualAdvId, setManualAdvId] = useState('');
  const [manualBrandId, setManualBrandId] = useState('');

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
  const zendeskItems = Object.values(items).filter((i) => i.type === 'zendesk-draft');

  const zendeskBody = zendeskItems.length === 0
    ? ''
    : [
        'Please update the following global brand industries',
        ...zendeskItems.map(
          (i) => `${i.brand.global_brand_nm} should be this industry ${i.payload.to_industry} from this existing one ${i.payload.from_industry}`,
        ),
      ].join('\n');

  const removeItem = usePendingStore.getState().remove;

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
              {amItems.map((i) => {
                const v3 = v3For(i);
                const missingV3 = v3.v3_advertiser_id == null || v3.v3_brand_id == null;
                const isResolvingThis = resolvingId === i.brand.global_brand_id;
                return (
                  <li key={i.id} className="border rounded p-2 mb-1">
                    <div className="font-medium">{i.brand.global_brand_nm} ({i.brand.global_brand_id})</div>
                    <div className="text-sm text-slate-600">
                      {i.payload.before?.path ?? '—'} → {i.payload.after.path}
                    </div>
                    <div className="text-xs">{statusLabel(i.status)}</div>
                    {i.status === 'failed' && i.error?.message && (
                      <div className="text-xs text-red-700 mt-1">{i.error.message}</div>
                    )}
                    {missingV3 && (onResolveOne || onSetManualV3) && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {onResolveOne && (
                            <button
                              disabled={isResolvingThis}
                              onClick={async () => {
                                setResolveError(null);
                                setResolvingId(i.brand.global_brand_id);
                                try {
                                  const result = await onResolveOne(i.brand.global_brand_id);
                                  if (!result) {
                                    setResolveError(`Couldn't find a V3 brand for ${i.brand.global_brand_nm}. Use "Enter V3 ids manually" if you know them.`);
                                  } else if (i.status === 'failed') {
                                    setStatus(i.id, 'staged');
                                  }
                                } catch (e) {
                                  setResolveError(e.message);
                                } finally {
                                  setResolvingId(null);
                                }
                              }}
                              className="text-xs px-2 py-0.5 rounded bg-emerald-600 text-white disabled:opacity-50">
                              {isResolvingThis ? 'Resolving V3…' : 'Resolve V3 for this brand'}
                            </button>
                          )}
                          {onSetManualV3 && manualForBrand !== i.brand.global_brand_id && (
                            <button
                              onClick={() => {
                                setManualForBrand(i.brand.global_brand_id);
                                setManualAdvId('');
                                setManualBrandId('');
                                setResolveError(null);
                              }}
                              className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                              Enter V3 ids manually
                            </button>
                          )}
                        </div>

                        {manualForBrand === i.brand.global_brand_id && (
                          <div className="mt-2 flex items-center gap-2 bg-slate-50 border rounded p-2">
                            <label className="text-xs">V3 advertiser id
                              <input type="number" value={manualAdvId}
                                onChange={(e) => setManualAdvId(e.target.value)}
                                className="ml-1 border rounded px-1 py-0.5 w-28 text-xs" />
                            </label>
                            <label className="text-xs">V3 brand id
                              <input type="number" value={manualBrandId}
                                onChange={(e) => setManualBrandId(e.target.value)}
                                className="ml-1 border rounded px-1 py-0.5 w-28 text-xs" />
                            </label>
                            <button
                              onClick={() => {
                                const adv = Number.parseInt(manualAdvId, 10);
                                const brand = Number.parseInt(manualBrandId, 10);
                                if (!Number.isInteger(adv) || !Number.isInteger(brand)) {
                                  setResolveError('Both ids must be integers.');
                                  return;
                                }
                                onSetManualV3(i.brand.global_brand_id, adv, brand);
                                if (i.status === 'failed') setStatus(i.id, 'staged');
                                setManualForBrand(null);
                                setResolveError(null);
                              }}
                              className="text-xs px-2 py-0.5 rounded bg-emerald-600 text-white">
                              Save
                            </button>
                            <button
                              onClick={() => { setManualForBrand(null); setResolveError(null); }}
                              className="text-xs px-2 py-0.5 rounded bg-slate-200">
                              Cancel
                            </button>
                          </div>
                        )}

                        {resolveError && resolvingId == null && (
                          <div className="text-xs text-red-700 mt-1">{resolveError}</div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {zendeskItems.length > 0 && (
          <section className="mb-4">
            <h3 className="font-medium mb-2">
              Zendesk draft email ({zendeskItems.length} {zendeskItems.length === 1 ? 'brand' : 'brands'})
            </h3>
            <textarea readOnly
              className="w-full h-48 border rounded p-2 font-mono text-xs"
              value={zendeskBody} />
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(zendeskBody)}
                className="px-3 py-1 bg-emerald-600 text-white rounded text-sm">
                Copy to clipboard
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Clear all ${zendeskItems.length} Zendesk draft entries?`)) {
                    zendeskItems.forEach((i) => removeItem(i.id));
                  }
                }}
                className="px-3 py-1 bg-slate-200 rounded text-sm">
                Clear all drafts
              </button>
            </div>
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
