import { usePendingStore } from '../state/pendingStore.js';

const TYPE_LABEL = {
  'am-industry': 'Advertiser Module edits',
  'creative-industry': 'Creative edits',
  'zendesk-draft': 'Zendesk drafts',
};

export function PendingChangesBar({ onReview, onDiscardAll }) {
  const items = usePendingStore((s) => s.items);
  const list = Object.values(items);
  if (list.length === 0) return null;

  const counts = list.reduce((acc, it) => {
    acc[it.type] = (acc[it.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-white px-4 py-2 flex justify-between items-center text-sm">
      <div>
        <strong>{list.length} pending changes</strong>
        {' · '}
        {Object.entries(counts).map(([t, n]) => `${n} ${TYPE_LABEL[t] ?? t}`).join(' · ')}
      </div>
      <div className="flex gap-2">
        <button className="px-3 py-1 bg-emerald-600 rounded" onClick={onReview}>Review & Apply</button>
        <button className="px-3 py-1 bg-slate-700 rounded" onClick={() => {
          if (window.confirm('Discard all pending changes?')) onDiscardAll?.();
        }}>Discard all</button>
      </div>
    </div>
  );
}
