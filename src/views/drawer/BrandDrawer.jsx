import { useEffect } from 'react';
import { SideBySide } from './SideBySide.jsx';
import { EditAmPanel } from './EditAmPanel.jsx';
import { ProgrammaticZendeskPanel } from './ProgrammaticZendeskPanel.jsx';
import { SuggestionsPanel } from './SuggestionsPanel.jsx';

export function BrandDrawer({ row, onClose, taxonomy }) {
  useEffect(() => {
    if (!row) return undefined;
    function onKey(e) { if (e.key === 'Escape') onClose?.(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [row, onClose]);

  if (!row) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-20"
        onClick={onClose}
        aria-label="close drawer backdrop"
      />
      <aside className="fixed top-0 right-0 h-full w-[60vw] bg-brand-surface border-l border-white/15 text-white shadow-xl overflow-auto z-30">
        <header className="sticky top-0 bg-brand-surface border-b border-white/10 px-4 py-3 flex justify-between items-start gap-4 z-10">
          <div>
            <h2 className="font-display text-xl font-bold tracking-wide">{row.global_brand_nm}</h2>
            <div className="text-sm text-brand-grey">
              Advertiser: {row.global_advertiser_nm ?? '—'} · Brand ID: {row.global_brand_id}
            </div>
            <div className="text-xs text-brand-grey/70">
              V3 advertiser: {row.v3_advertiser_id ?? '—'} · V3 brand: {row.v3_brand_id ?? '—'}
            </div>
          </div>
          <button onClick={onClose} aria-label="close"
            className="text-2xl leading-none text-brand-grey hover:text-white px-2">
            ×
          </button>
        </header>

        <div className="p-4">
          <SideBySide row={row} />
          {taxonomy && <SuggestionsPanel row={row} taxonomy={taxonomy} />}
          {taxonomy && <EditAmPanel row={row} taxonomy={taxonomy} />}
          {taxonomy && <ProgrammaticZendeskPanel row={row} taxonomy={taxonomy} />}
        </div>
      </aside>
    </>
  );
}
