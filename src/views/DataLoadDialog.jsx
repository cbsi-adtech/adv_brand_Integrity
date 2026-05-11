import { useState } from 'react';
import { loadCsv } from '../data/adapters/index.js';

export function DataLoadDialog({ onLoaded }) {
  const [bq, setBq] = useState('');
  const [fw, setFw] = useState('');
  const [error, setError] = useState(null);

  function handleParse() {
    setError(null);
    const records = [];
    try {
      if (bq.trim()) records.push(...loadCsv(bq));
      if (fw.trim()) records.push(...loadCsv(fw));
      if (records.length === 0) {
        setError('Paste at least one CSV.');
        return;
      }
      onLoaded(records);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold mb-2">Load data</h2>
      <p className="text-sm text-slate-600 mb-4">
        Paste the BigQuery export (Advertiser Module + secondary Programmatic Module from <code>ind_*</code> columns)
        and/or the FreeWheel Console Programmatic Module CSV. Both can be loaded together — the FreeWheel report
        wins for the Programmatic Module slot.
      </p>

      <label className="block mb-2 text-sm font-medium">
        BigQuery export
        <textarea className="w-full h-40 border rounded p-2 font-mono text-xs"
          value={bq} onChange={(e) => setBq(e.target.value)} />
      </label>

      <label className="block mb-2 text-sm font-medium">
        FreeWheel Console Analytics CSV (Programmatic Module)
        <div className="flex items-center gap-2 my-1">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setFw(await file.text());
            }}
            className="text-xs"
          />
          <span className="text-xs text-slate-500">— or paste below</span>
        </div>
        <textarea className="w-full h-40 border rounded p-2 font-mono text-xs"
          value={fw} onChange={(e) => setFw(e.target.value)} />
      </label>

      {error && <div className="text-red-700 text-sm mb-2">{error}</div>}

      <button className="px-4 py-2 bg-emerald-600 text-white rounded" onClick={handleParse}>
        Parse
      </button>
    </div>
  );
}
