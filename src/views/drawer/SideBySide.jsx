export function SideBySide({ row }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <SidePanel title="Advertiser Module" side={row.am} />
      <SidePanel title="Programmatic Module" side={row.pg} />
    </div>
  );
}

function SidePanel({ title, side }) {
  return (
    <div className="border rounded p-3">
      <h3 className="font-medium mb-2">{title}</h3>
      {side ? (
        <>
          <div><strong>Industry:</strong> {side.resolved_industry_path ?? '—'}</div>
          <div><strong>Impressions:</strong> {side.impressions ?? 0}</div>
          <div><strong>Revenue:</strong> {side.revenue ?? 0}</div>
        </>
      ) : <div className="text-slate-500">No data</div>}
    </div>
  );
}
