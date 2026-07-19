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
    <div className="border border-white/15 rounded p-2 max-h-80 overflow-auto bg-brand-card">
      <input type="text" placeholder="Search industry…"
        value={q} onChange={(e) => setQ(e.target.value)}
        className="w-full bg-brand-navy border border-white/20 rounded px-2 py-1 mb-2 text-white placeholder:text-brand-grey/50 focus:border-brand-peak focus:outline-none" />
      <ul className="text-sm text-brand-grey">
        {filtered.map((e) => (
          <li key={e.id} className="px-2 py-1 hover:bg-brand-peak/20 hover:text-white cursor-pointer"
              onClick={() => onPick(e.id)}>
            {e.path}
          </li>
        ))}
      </ul>
    </div>
  );
}
