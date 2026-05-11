import { useMemo, useState } from 'react';

export function IndustryPicker({ taxonomy, onPick }) {
  const [q, setQ] = useState('');
  const entries = useMemo(() => taxonomy.all(), [taxonomy]);
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return entries;
    return entries.filter((e) => e.path.toLowerCase().includes(ql));
  }, [entries, q]);

  return (
    <div className="border rounded p-2 max-h-80 overflow-auto">
      <input type="text" placeholder="Search industry…"
        value={q} onChange={(e) => setQ(e.target.value)}
        className="w-full border rounded px-2 py-1 mb-2" />
      <ul className="text-sm">
        {filtered.map((e) => (
          <li key={e.id} className="px-2 py-1 hover:bg-slate-100 cursor-pointer"
              onClick={() => onPick(e.id)}>
            {e.path}
          </li>
        ))}
      </ul>
    </div>
  );
}
