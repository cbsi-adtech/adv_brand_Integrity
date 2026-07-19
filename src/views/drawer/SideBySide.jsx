export function SideBySide({ row }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <SidePanel title="Advertiser Module" side={row.am} />
      <SidePanel title="Programmatic Module" side={row.pg} />
    </div>
  );
}

const fmtNum = new Intl.NumberFormat('en-US');
const fmtCur = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function SidePanel({ title, side }) {
  return (
    <div className="border border-white/15 rounded p-3 bg-brand-card">
      <h3 className="font-semibold mb-2 text-brand-grey text-xs uppercase tracking-widest">{title}</h3>
      {side ? (
        <>
          <div className="text-sm mb-1">{side.resolved_industry_path ?? '—'}</div>
          <div className="font-display font-bold text-2xl tabular-nums">{fmtNum.format(side.impressions ?? 0)}</div>
          <div className="text-[11px] text-brand-grey uppercase tracking-widest">Impressions</div>
          <div className="font-display font-bold text-2xl tabular-nums mt-2 text-brand-success">{fmtCur.format(side.revenue ?? 0)}</div>
          <div className="text-[11px] text-brand-grey uppercase tracking-widest">Revenue</div>
        </>
      ) : <div className="text-brand-grey/60">No data</div>}
    </div>
  );
}
