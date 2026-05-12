import { useMemo, useState } from 'react';
import {
  useReactTable, getCoreRowModel, getSortedRowModel, flexRender,
} from '@tanstack/react-table';
import { priorityScore } from './sort.js';
import { applyFilters } from './filters.js';
import { ListSummary } from './ListSummary.jsx';
import { AmIndustryCell } from './AmIndustryCell.jsx';
import { FLAG_STYLES, flagKey } from './flagStyles.js';

const fmt = new Intl.NumberFormat('en-US');
const cur = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function ListView({ rows, taxonomy, filters = {}, onFiltersChange, onRowClick,
                          unresolvedV3Count = 0, resolving = null, onResolveV3, onCancelResolve }) {
  const [sorting, setSorting] = useState([]);
  const filtered = useMemo(() => applyFilters(rows, filters), [rows, filters]);
  // Default priority sort is applied to data before TS Table sorting kicks in.
  // When the user clicks a sortable header, TS Table's `sorting` state takes over.
  const data = useMemo(
    () => [...filtered].sort((a, b) => priorityScore(b) - priorityScore(a)),
    [filtered],
  );

  const sortNumericNullsLast = (a, b, id) => {
    const av = a.getValue(id);
    const bv = b.getValue(id);
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    return av - bv;
  };

  const columns = useMemo(() => ([
    { id: 'flags', header: 'Flags', enableSorting: false,
      cell: ({ row }) => <FlagBadges flags={row.original.flags} /> },
    { id: 'brand', header: 'Brand', enableSorting: false,
      accessorFn: (r) => r.global_brand_nm,
      cell: ({ getValue }) => <span className="text-blue-700 hover:underline">{getValue()}</span> },
    { id: 'advertiser', header: 'Advertiser', enableSorting: false,
      accessorFn: (r) => r.global_advertiser_nm ?? '—' },
    { id: 'am_industry', header: 'Advertiser Module industry', enableSorting: false,
      cell: ({ row }) => taxonomy
        ? <AmIndustryCell row={row.original} taxonomy={taxonomy} />
        : (row.original.am?.resolved_industry_name ?? '—') },
    { id: 'pg_industry', header: 'Programmatic Module industry', enableSorting: false,
      accessorFn: (r) => r.pg?.resolved_industry_name ?? '—' },
    { id: 'am_imp', header: 'Advertiser Module impressions',
      accessorFn: (r) => r.am?.impressions ?? null,
      sortingFn: sortNumericNullsLast,
      cell: ({ getValue }) => getValue() == null ? '—' : fmt.format(getValue()) },
    { id: 'pg_imp', header: 'Programmatic Module impressions',
      accessorFn: (r) => r.pg?.impressions ?? null,
      sortingFn: sortNumericNullsLast,
      cell: ({ getValue }) => getValue() == null ? '—' : fmt.format(getValue()) },
    { id: 'pg_rev', header: 'Programmatic Module revenue',
      accessorFn: (r) => r.pg?.revenue ?? null,
      sortingFn: sortNumericNullsLast,
      cell: ({ getValue }) => getValue() == null ? '—' : cur.format(getValue()) },
    { id: 'other', header: 'Other modules', enableSorting: false,
      accessorFn: (r) => r.other_modules.length,
      cell: ({ getValue }) => getValue() > 0 ? <span className="px-1 bg-slate-200 rounded">{getValue()}</span> : null },
    { id: 'pending', header: 'Pending', enableSorting: false, cell: () => null },
  ]), [taxonomy]);

  const table = useReactTable({
    data, columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div>
      <ListSummary rows={rows} filteredCount={filtered.length}
        filters={filters} onFiltersChange={onFiltersChange}
        unresolvedV3Count={unresolvedV3Count} resolving={resolving}
        onResolveV3={onResolveV3} onCancelResolve={onCancelResolve} />
      <FilterBar value={filters} onChange={onFiltersChange} />
      <table className="text-sm w-full">
        <thead className="bg-slate-100 text-left">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => {
                const sortable = h.column.getCanSort();
                const sorted = h.column.getIsSorted();
                return (
                  <th key={h.id}
                      className={`p-2 font-medium text-slate-700 ${sortable ? 'cursor-pointer select-none hover:bg-slate-200' : ''}`}
                      onClick={sortable ? h.column.getToggleSortingHandler() : undefined}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {sortable && (
                      <span className="ml-1 text-xs text-slate-400">
                        {sorted === 'asc' ? '▲' : sorted === 'desc' ? '▼' : '↕'}
                      </span>
                    )}
                  </th>
                );
              })}
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
