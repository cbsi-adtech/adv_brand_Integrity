import { useMemo } from 'react';
import {
  useReactTable, getCoreRowModel, flexRender,
} from '@tanstack/react-table';
import { priorityScore } from './sort.js';
import { applyFilters } from './filters.js';
import { ListSummary } from './ListSummary.jsx';
import { AmIndustryCell } from './AmIndustryCell.jsx';
import { FLAG_STYLES, flagKey } from './flagStyles.js';

const fmt = new Intl.NumberFormat('en-US');
const cur = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function ListView({ rows, taxonomy, filters = {}, onFiltersChange, onRowClick }) {
  const filtered = useMemo(() => applyFilters(rows, filters), [rows, filters]);
  const data = useMemo(
    () => [...filtered].sort((a, b) => priorityScore(b) - priorityScore(a)),
    [filtered],
  );

  const columns = useMemo(() => ([
    { id: 'flags', header: 'Flags', cell: ({ row }) => <FlagBadges flags={row.original.flags} /> },
    { id: 'brand', header: 'Brand',
      accessorFn: (r) => r.global_brand_nm,
      cell: ({ getValue }) => <span className="text-blue-700 hover:underline">{getValue()}</span> },
    { id: 'advertiser', header: 'Advertiser', accessorFn: (r) => r.global_advertiser_nm ?? '—' },
    { id: 'am_industry', header: 'Advertiser Module industry',
      cell: ({ row }) => taxonomy
        ? <AmIndustryCell row={row.original} taxonomy={taxonomy} />
        : (row.original.am?.resolved_industry_name ?? '—') },
    { id: 'pg_industry', header: 'Programmatic Module industry', accessorFn: (r) => r.pg?.resolved_industry_name ?? '—' },
    { id: 'am_imp', header: 'Advertiser Module impressions',
      accessorFn: (r) => r.am?.impressions ?? null,
      cell: ({ getValue }) => getValue() == null ? '—' : fmt.format(getValue()) },
    { id: 'pg_imp', header: 'Programmatic Module impressions',
      accessorFn: (r) => r.pg?.impressions ?? null,
      cell: ({ getValue }) => getValue() == null ? '—' : fmt.format(getValue()) },
    { id: 'pg_rev', header: 'Programmatic Module revenue',
      accessorFn: (r) => r.pg?.revenue ?? null,
      cell: ({ getValue }) => getValue() == null ? '—' : cur.format(getValue()) },
    { id: 'other', header: 'Other modules',
      accessorFn: (r) => r.other_modules.length,
      cell: ({ getValue }) => getValue() > 0 ? <span className="px-1 bg-slate-200 rounded">{getValue()}</span> : null },
    { id: 'pending', header: 'Pending', cell: () => null },
  ]), [taxonomy]);

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div>
      <ListSummary rows={rows} filteredCount={filtered.length}
        filters={filters} onFiltersChange={onFiltersChange} />
      <FilterBar value={filters} onChange={onFiltersChange} />
      <table className="text-sm w-full">
        <thead className="bg-slate-100 text-left">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th key={h.id} className="p-2 font-medium text-slate-700">
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((r) => (
            <tr key={r.id} className="border-b hover:bg-slate-50 cursor-pointer"
                onClick={() => onRowClick?.(r.original)}>
              {r.getVisibleCells().map((cell) => (
                <td key={cell.id} className="p-2 align-top">
                  {flexRender(cell.column.columnDef.cell ?? ((x) => x.getValue()), cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FlagBadges({ flags }) {
  if (!flags || flags.length === 0) return null;
  return (
    <span className="inline-flex gap-1 flex-wrap">
      {flags.map((f, i) => {
        const key = flagKey(f);
        const style = FLAG_STYLES[key] ?? { label: f.type, color: 'bg-slate-200 text-slate-800 border-slate-300' };
        return (
          <span key={i} title={f.note}
                className={`text-[10px] px-1.5 py-0.5 rounded border ${style.color}`}>
            {f.type === 'F1' && f.highImpact ? '🔥 F1' : f.type}
          </span>
        );
      })}
    </span>
  );
}

function FilterBar({ value, onChange }) {
  const set = (patch) => onChange?.({ ...value, ...patch });
  return (
    <div className="p-2 flex gap-2 flex-wrap items-center text-sm border-b">
      <input type="text" placeholder="Search brand or advertiser…"
        value={value.search ?? ''} onChange={(e) => set({ search: e.target.value })}
        className="border rounded px-2 py-1" />
      <select value={value.side ?? 'both'} onChange={(e) => set({ side: e.target.value })}
        className="border rounded px-2 py-1">
        <option value="both">Both modules</option>
        <option value="am">Advertiser Module only</option>
        <option value="pg-only">Programmatic Module only</option>
      </select>
      <input type="number" placeholder="Min Programmatic Module impressions"
        value={value.minPgImpressions ?? ''}
        onChange={(e) => set({ minPgImpressions: e.target.value ? Number(e.target.value) : null })}
        className="border rounded px-2 py-1 w-56" />
    </div>
  );
}
