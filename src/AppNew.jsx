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
    return detectFlags(pivotToCanonical(records, taxonomy), taxonomy, flagConfig);
  }, [records, taxonomy]);

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
        filters={filters}
        onFiltersChange={setFilters}
        onRowClick={(r) => setDrawerBrandId(r.global_brand_id)}
      />
      {drawerRow && (
        <BrandDrawer row={drawerRow} taxonomy={taxonomy}
          onClose={() => setDrawerBrandId(null)} />
      )}
      <PendingChangesBar onReview={() => setReviewOpen(true)} onDiscardAll={clearPending} />
      <ReviewApplyModal open={reviewOpen} onClose={() => setReviewOpen(false)} />
    </div>
  );
}
