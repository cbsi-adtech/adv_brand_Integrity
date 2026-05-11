import { SideBySide } from './SideBySide.jsx';
import { EditAmPanel } from './EditAmPanel.jsx';
import { ProgrammaticZendeskPanel } from './ProgrammaticZendeskPanel.jsx';

export function BrandDrawer({ row, onClose, taxonomy }) {
  if (!row) return null;
  return (
    <aside className="fixed top-0 right-0 h-full w-[60vw] bg-white border-l shadow-xl overflow-auto p-4">
      <header className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-semibold">{row.global_brand_nm}</h2>
          <div className="text-sm text-slate-600">
            Advertiser: {row.global_advertiser_nm ?? '—'} · Brand ID: {row.global_brand_id}
          </div>
          <div className="text-xs text-slate-500">
            V3 advertiser: {row.v3_advertiser_id ?? '—'} · V3 brand: {row.v3_brand_id ?? '—'}
          </div>
        </div>
        <button onClick={onClose} aria-label="close" className="text-slate-500 hover:text-slate-900">✕</button>
      </header>

      <SideBySide row={row} />
      {taxonomy && <EditAmPanel row={row} taxonomy={taxonomy} />}
      <ProgrammaticZendeskPanel row={row} />
    </aside>
  );
}
