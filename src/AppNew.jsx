import { useEffect, useMemo, useState } from 'react';
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

export default function AppNew() {
  const [taxonomy, setTaxonomy] = useState(null);
  const [records, setRecords] = useState(null);
  const [v3Map, setV3Map] = useState({});            // global_brand_id -> {v3_advertiser_id, v3_brand_id}
  const [resolving, setResolving] = useState(null);  // null | {done, total}
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
      }));
    if (candidates.length === 0) return;

    const BATCH = 200;
    setResolving({ done: 0, total: candidates.length });
    try {
      for (let i = 0; i < candidates.length; i += BATCH) {
        const slice = candidates.slice(i, i + BATCH);
        const res = await fetch('/api/resolve-v3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: slice }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
        setV3Map((prev) => {
          const next = { ...prev };
          for (const r of data.results ?? []) {
            if (r.v3_advertiser_id != null && r.v3_brand_id != null) {
              next[r.global_brand_id] = {
                v3_advertiser_id: r.v3_advertiser_id,
                v3_brand_id: r.v3_brand_id,
              };
            }
          }
          return next;
        });
        setResolving({ done: Math.min(i + slice.length, candidates.length), total: candidates.length });
      }
    } catch (e) {
      console.error('V3 resolution failed:', e);
      window.alert(`V3 resolution failed: ${e.message}`);
    } finally {
      setResolving(null);
    }
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
      />
      {drawerRow && (
        <BrandDrawer row={drawerRow} taxonomy={taxonomy}
          onClose={() => setDrawerBrandId(null)} />
      )}
      <PendingChangesBar onReview={() => setReviewOpen(true)} onDiscardAll={clearPending} />
      <ReviewApplyModal open={reviewOpen} onClose={() => setReviewOpen(false)} rows={rows} />
    </div>
  );
}
