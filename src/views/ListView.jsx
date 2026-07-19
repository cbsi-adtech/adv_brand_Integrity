import { useMemo, useRef, useState } from 'react';
import {
  useReactTable, getCoreRowModel, getSortedRowModel, flexRender,
} from '@tanstack/react-table';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
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
  // Priority-sort ONCE per dataset, then filter the pre-sorted array (filter
  // preserves order). Sorting after filtering re-sorted on every keystroke.
  // When the user clicks a sortable header, TS Table's `sorting` state takes over.
  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => priorityScore(b) - priorityScore(a)),
    [rows],
  );
  const filtered = useMemo(() => applyFilters(sortedRows, filters), [sortedRows, filters]);
  const data = filtered;

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
      cell: ({ row, getValue }) => (
        <div>
          <span className="text-brand-sky hover:underline">{getValue()}</span>
          {row.original.gb && (
            <div className="text-[11px] text-brand-grey/60 mt-0.5"
                 title="FreeWheel canonical (Global Brand) industry">
              FW canonical: {row.original.gb.resolved_industry_name ?? row.original.gb.industry_id}
            </div>
          )}
        </div>
      ) },
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
      cell: ({ getValue }) => (
        <span className="block text-right tabular-nums text-brand-grey">
          {getValue() == null ? '—' : fmt.format(getValue())}
        </span>
      ) },
    { id: 'pg_imp', header: 'Programmatic Module impressions',
      accessorFn: (r) => r.pg?.impressions ?? null,
      sortingFn: sortNumericNullsLast,
      cell: ({ getValue }) => (
        <span className="block text-right tabular-nums text-white font-medium">
          {getValue() == null ? '—' : fmt.format(getValue())}
        </span>
      ) },
    { id: 'pg_rev', header: 'Programmatic Module revenue',
      accessorFn: (r) => r.pg?.revenue ?? null,
      sortingFn: sortNumericNullsLast,
      cell: ({ getValue }) => (
        <span className="block text-right tabular-nums text-white font-semibold">
          {getValue() == null ? '—' : cur.format(getValue())}
        </span>
      ) },
    { id: 'other', header: 'Other modules', enableSorting: false,
      accessorFn: (r) => r.other_modules.length,
      cell: ({ getValue }) => getValue() > 0 ? <span className="px-1 bg-white/10 rounded">{getValue()}</span> : null },
    { id: 'pending', header: 'Pending', enableSorting: false, cell: () => null },
  ]), [taxonomy]);

  const table = useReactTable({
    data, columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Window-scroll virtualization: only render the rows near the viewport.
  // Spacer <tr>s above/below keep the scrollbar geometry of the full list.
  const tableRows = table.getRowModel().rows;
  const listRef = useRef(null);
  const virtualizer = useWindowVirtualizer({
    count: tableRows.length,
    estimateSize: () => 48,
    overscan: 12,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });
  // jsdom (tests) reports zero heights; measuring those would collapse the list.
  const measureRow = (el) => {
    if (el && el.getBoundingClientRect().height > 0) virtualizer.measureElement(el);
  };
  const vItems = virtualizer.getVirtualItems();
  const scrollMargin = virtualizer.options.scrollMargin;
  const paddingTop = vItems.length > 0 ? Math.max(0, vItems[0].start - scrollMargin) : 0;
  const paddingBottom = vItems.length > 0
    ? Math.max(0, virtualizer.getTotalSize() - (vItems[vItems.length - 1].end - scrollMargin))
    : 0;

  return (
    <div>
      <ListSummary rows={rows} filteredCount={filtered.length}
        filters={filters} onFiltersChange={onFiltersChange}
        unresolvedV3Count={unresolvedV3Count} resolving={resolving}
        onResolveV3={onResolveV3} onCancelResolve={onCancelResolve} />
      <FilterBar value={filters} onChange={onFiltersChange} rows={rows} />
      <div ref={listRef}>
      <table className="text-sm w-full table-fixed">
        <colgroup>
          <col style={{ width: '110px' }} />{/* flags */}
          <col />{/* brand */}
          <col style={{ width: '14%' }} />{/* advertiser */}
          <col style={{ width: '18%' }} />{/* am industry */}
          <col style={{ width: '14%' }} />{/* pg industry */}
          <col style={{ width: '110px' }} />
          <col style={{ width: '110px' }} />
          <col style={{ width: '110px' }} />
          <col style={{ width: '64px' }} />{/* other */}
          <col style={{ width: '64px' }} />{/* pending */}
        </colgroup>
        <thead className="bg-brand-surface text-left">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => {
                const sortable = h.column.getCanSort();
                const sorted = h.column.getIsSorted();
                return (
                  <th key={h.id}
                      className={`p-2 font-semibold text-brand-grey text-xs uppercase tracking-wide ${sortable ? 'cursor-pointer select-none hover:text-brand-peak' : ''}`}
                      onClick={sortable ? h.column.getToggleSortingHandler() : undefined}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {sortable && (
                      <span className={`ml-1 text-xs ${sorted ? 'text-brand-peak' : 'text-brand-grey/50'}`}>
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
          {paddingTop > 0 && <tr aria-hidden="true" style={{ height: `${paddingTop}px` }} />}
          {vItems.map((vi) => {
            const r = tableRows[vi.index];
            // Critical rows (root mismatch or high-impact generic) get a
            // Horizon accent bar — impressions size the impact.
            const critical = (r.original.flags ?? []).some(
              (f) => f.type === 'F2' || (f.type === 'F1' && f.highImpact),
            );
            return (
              <tr key={r.id} data-index={vi.index} ref={measureRow}
                  className={`border-b border-white/10 hover:bg-white/5 cursor-pointer ${critical ? 'shadow-[inset_2px_0_0_0_theme(colors.brand.horizon)]' : ''}`}
                  onClick={() => onRowClick?.(r.original)}>
                {r.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-2 align-top">
                    {flexRender(cell.column.columnDef.cell ?? ((x) => x.getValue()), cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
          {paddingBottom > 0 && <tr aria-hidden="true" style={{ height: `${paddingBottom}px` }} />}
        </tbody>
      </table>
      </div>
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

function FilterBar({ value, onChange, rows = [] }) {
  const set = (patch) => onChange?.({ ...value, ...patch });

  // Unique Programmatic Module industries in the current dataset, with brand counts.
  const pgIndustries = useMemo(() => {
    const counts = new Map();
    for (const r of rows) {
      const nm = r.pg?.resolved_industry_name;
      if (!nm) continue;
      counts.set(nm, (counts.get(nm) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))   // alphabetical
      .map(([name, count]) => ({ name, count }));
  }, [rows]);

  return (
    <div className="p-2 flex gap-2 flex-wrap items-center text-sm border-b border-white/10">
      <input type="text" placeholder="Search brand or advertiser…"
        value={value.search ?? ''} onChange={(e) => set({ search: e.target.value })}
        className="bg-brand-surface border border-white/20 rounded px-2 py-1 text-white placeholder:text-brand-grey/50 focus:border-brand-peak focus:outline-none" />
      <select value={value.side ?? ''} onChange={(e) => set({ side: e.target.value || undefined })}
        className="bg-brand-surface border border-white/20 rounded px-2 py-1 text-white"
        title="Filter rows by which modules are present">
        <option value="">All</option>
        <option value="both">Both modules present</option>
        <option value="am">Advertiser Module only</option>
        <option value="pg-only">Programmatic Module only</option>
      </select>
      <select
        value={value.pgIndustryName ?? ''}
        onChange={(e) => set({ pgIndustryName: e.target.value || null })}
        className="bg-brand-surface border border-white/20 rounded px-2 py-1 max-w-xs text-white"
        title="Filter to brands whose Programmatic Module resolves to this industry">
        <option value="">Programmatic industry: any</option>
        {pgIndustries.map(({ name, count }) => (
          <option key={name} value={name}>{name} ({count.toLocaleString()})</option>
        ))}
      </select>
      <input type="number" placeholder="Min Programmatic Module impressions"
        value={value.minPgImpressions ?? ''}
        onChange={(e) => set({ minPgImpressions: e.target.value ? Number(e.target.value) : null })}
        className="bg-brand-surface border border-white/20 rounded px-2 py-1 w-56 text-white placeholder:text-brand-grey/50 focus:border-brand-peak focus:outline-none" />
    </div>
  );
}
