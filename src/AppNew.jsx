import { useEffect, useMemo, useRef, useState } from 'react';
import { loadTaxonomy } from './data/taxonomy.js';
import { pivotToCanonical } from './data/canonical.js';
import { detectFlags } from './flags/detect.js';
import { flagConfig } from './flags/config.js';
import { usePendingStore } from './state/pendingStore.js';
import { ListView } from './views/ListView.jsx';
import { DataLoadDialog } from './views/DataLoadDialog.jsx';
import { BrandDrawer } from './views/drawer/BrandDrawer.jsx';
import { PendingChangesBar } from './views/PendingChangesBar.jsx';
import { ReviewApplyModal } from './views/ReviewApplyModal.jsx';
import { priorityScore } from './views/sort.js';

export default function AppNew() {
  const [taxonomy, setTaxonomy] = useState(null);
  const [records, setRecords] = useState(null);
  const [v3Map, setV3Map] = useState({});            // global_brand_id -> {v3_advertiser_id, v3_brand_id}
  const [resolving, setResolving] = useState(null);  // null | {done, total, batch: [brand names], hits, misses}
  const cancelRef = useRef(false);
  const [drawerBrandId, setDrawerBrandId] = useState(null);
  const [filters, setFilters] = useState({});
  const [reviewOpen, setReviewOpen] = useState(false);
  const rehydrate = usePendingStore((s) => s.rehydrate);
  const clearPending = usePendingStore((s) => s.clear);

  useEffect(() => {
    loadTaxonomy().then(setTaxonomy).catch((err) => {
      console.error('Taxonomy load failed:', err);
    });
    rehydrate();
  }, [rehydrate]);

  const rows = useMemo(() => {
    if (!records || !taxonomy) return [];
    const pivoted = pivotToCanonical(records, taxonomy);
    // Patch in any V3 ids we've resolved.
    const patched = pivoted.map((row) => {
      const m = v3Map[row.global_brand_id];
      if (!m) return row;
      return {
        ...row,
        v3_advertiser_id: row.v3_advertiser_id ?? m.v3_advertiser_id,
        v3_brand_id:      row.v3_brand_id      ?? m.v3_brand_id,
      };
    });
    return detectFlags(patched, taxonomy, flagConfig);
  }, [records, taxonomy, v3Map]);

  const unresolvedCount = useMemo(
    () => rows.filter((r) => r.v3_advertiser_id == null || r.v3_brand_id == null).length,
    [rows],
  );

  async function resolveV3() {
    const candidates = rows
      .filter((r) => r.v3_advertiser_id == null || r.v3_brand_id == null)
      .map((r) => ({
        global_brand_id: r.global_brand_id,
        global_brand_nm: r.global_brand_nm,
        global_advertiser_nm: r.global_advertiser_nm,
        _priority: priorityScore(r),
      }))
      .sort((a, b) => b._priority - a._priority);

    if (candidates.length === 0) return;

    const BATCH = 5;
    cancelRef.current = false;
    let hits = 0;
    let misses = 0;

    setResolving({ done: 0, total: candidates.length, batch: candidates.slice(0, BATCH).map((c) => c.global_brand_nm), hits, misses });

    try {
      for (let i = 0; i < candidates.length; i += BATCH) {
        if (cancelRef.current) break;
        const slice = candidates.slice(i, i + BATCH);
        setResolving({ done: i, total: candidates.length, batch: slice.map((c) => c.global_brand_nm), hits, misses });

        const res = await fetch('/api/resolve-v3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: slice.map(({ global_brand_id, global_brand_nm, global_advertiser_nm }) =>
              ({ global_brand_id, global_brand_nm, global_advertiser_nm })),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

        setV3Map((prev) => {
          const next = { ...prev };
          for (const r of data.results ?? []) {
            if (r.v3_advertiser_id != null && r.v3_brand_id != null) {
              next[r.global_brand_id] = { v3_advertiser_id: r.v3_advertiser_id, v3_brand_id: r.v3_brand_id };
              hits++;
            } else {
              misses++;
            }
          }
          return next;
        });

        setResolving({ done: Math.min(i + slice.length, candidates.length), total: candidates.length, batch: slice.map((c) => c.global_brand_nm), hits, misses });
      }
    } catch (e) {
      console.error('V3 resolution failed:', e);
      window.alert(`V3 resolution failed: ${e.message}`);
    } finally {
      setResolving(null);
      cancelRef.current = false;
    }
  }

  function cancelResolve() {
    cancelRef.current = true;
  }

  // Manual override — caller already knows the V3 ids. No FW lookup.
  function setManualV3(globalBrandId, v3AdvertiserId, v3BrandId) {
    setV3Map((prev) => ({
      ...prev,
      [globalBrandId]: { v3_advertiser_id: v3AdvertiserId, v3_brand_id: v3BrandId },
    }));
  }

  // Resolve V3 ids for a single brand on-demand. Returns the resolved entry
  // (or null on miss); also patches v3Map so the row updates.
  async function resolveOne(globalBrandId) {
    const row = rows.find((r) => r.global_brand_id === globalBrandId);
    if (!row) throw new Error(`Brand ${globalBrandId} not in current dataset`);

    const res = await fetch('/api/resolve-v3', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{
          global_brand_id: row.global_brand_id,
          global_brand_nm: row.global_brand_nm,
          global_advertiser_nm: row.global_advertiser_nm,
        }],
      }),
    });

    // Tolerate empty / non-JSON bodies so the user gets a useful message
    // instead of "Unexpected end of JSON input".
    const raw = await res.text();
    let data = null;
    if (raw) {
      try { data = JSON.parse(raw); }
      catch { /* leave data null */ }
    }

    if (!res.ok) {
      throw new Error(data?.error || `HTTP ${res.status} ${res.statusText || ''} — ${raw || 'empty body'}`.trim());
    }
    if (!data) {
      throw new Error(`Server returned empty body (HTTP ${res.status}). Check BFF console for a stack trace.`);
    }

    const result = data.results?.[0];
    if (result?.v3_advertiser_id != null && result?.v3_brand_id != null) {
      setV3Map((prev) => ({
        ...prev,
        [result.global_brand_id]: {
          v3_advertiser_id: result.v3_advertiser_id,
          v3_brand_id: result.v3_brand_id,
        },
      }));
      return result;
    }
    if (result?.error) {
      throw new Error(`Server: ${result.error}`);
    }
    return null;
  }

  const drawerRow = useMemo(
    () => rows.find((r) => r.global_brand_id === drawerBrandId) ?? null,
    [rows, drawerBrandId],
  );

  if (!taxonomy) return <div className="p-4">Loading taxonomy…</div>;
  if (!records) return <DataLoadDialog onLoaded={setRecords} />;

  return (
    <div className="pb-16">
      <ListView
        rows={rows}
        taxonomy={taxonomy}
        filters={filters}
        onFiltersChange={setFilters}
        onRowClick={(r) => setDrawerBrandId(r.global_brand_id)}
        unresolvedV3Count={unresolvedCount}
        resolving={resolving}
        onResolveV3={resolveV3}
        onCancelResolve={cancelResolve}
      />
      {drawerRow && (
        <BrandDrawer row={drawerRow} taxonomy={taxonomy}
          onClose={() => setDrawerBrandId(null)} />
      )}
      <PendingChangesBar onReview={() => setReviewOpen(true)} onDiscardAll={clearPending} />
      <ReviewApplyModal open={reviewOpen} onClose={() => setReviewOpen(false)} rows={rows}
        onResolveOne={resolveOne} onSetManualV3={setManualV3} />
    </div>
  );
}
