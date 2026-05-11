import { useState } from 'react';

export function ProgrammaticZendeskPanel({ row }) {
  const [open, setOpen] = useState(false);
  const body = `Brand: ${row.global_brand_nm} (id ${row.global_brand_id})
Current Programmatic Module industry: ${row.pg?.resolved_industry_path ?? '—'}
Suggested correction: <enter taxonomy entry here>
Impressions (last reporting window): ${row.pg?.impressions ?? 0}
Revenue: ${row.pg?.revenue ?? 0}
Reason: Programmatic Module mapping is too generic; please reassign to a more specific industry.`;

  return (
    <section className="mt-4 border rounded p-3">
      {!open ? (
        <button onClick={() => setOpen(true)} className="px-3 py-1 bg-slate-200 rounded">
          Draft Programmatic Module mapping request
        </button>
      ) : (
        <>
          <h3 className="font-medium mb-2">Programmatic Module mapping request (draft)</h3>
          <textarea readOnly className="w-full h-48 border rounded p-2 font-mono text-xs" value={body} />
          <div className="mt-2">
            <button className="px-3 py-1 bg-emerald-600 text-white rounded"
              onClick={() => navigator.clipboard.writeText(body)}>
              Copy to clipboard
            </button>
          </div>
        </>
      )}
    </section>
  );
}
