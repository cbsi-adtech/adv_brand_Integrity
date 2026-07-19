import { useId, useState } from 'react';
import { loadCsv } from '../data/adapters/index.js';

export function DataLoadDialog({ onLoaded }) {
  const [bq, setBq] = useState('');
  const [fw, setFw] = useState('');
  const [error, setError] = useState(null);
  const bqId = useId();
  const fwId = useId();

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
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="font-display text-2xl font-bold tracking-wide uppercase mb-2">Load data</h2>
      <p className="text-sm text-brand-grey mb-4">
        Paste the BigQuery export (Advertiser Module + secondary Programmatic Module from <code>ind_*</code> columns)
        and/or the FreeWheel Console Programmatic Module CSV. Both can be loaded together — the FreeWheel report
        wins for the Programmatic Module slot.
      </p>

      <div className="mb-3">
        <label htmlFor={bqId} className="block text-sm font-medium mb-1">BigQuery export</label>
        <div className="flex items-center gap-2 mb-1">
          <input
            type="file"
            accept=".csv,.tsv,text/csv,text/tab-separated-values"
            onChange={async (e) => {
              const input = e.target;
              const file = input.files?.[0];
              if (!file) return;
              setBq(await file.text());
              // Reset so re-selecting the same file fires onChange again.
              input.value = '';
            }}
            className="text-xs"
          />
          <span className="text-xs text-brand-grey/70">— or paste below</span>
        </div>
        <textarea id={bqId} className="w-full h-40 bg-brand-surface border border-white/20 rounded p-2 font-mono text-xs text-brand-grey focus:border-brand-peak focus:outline-none"
          value={bq} onChange={(e) => setBq(e.target.value)} />
      </div>

      <div className="mb-3">
        <label htmlFor={fwId} className="block text-sm font-medium mb-1">
          FreeWheel Console Analytics CSV (Programmatic Module)
        </label>
        <div className="flex items-center gap-2 mb-1">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={async (e) => {
              const input = e.target;
              const file = input.files?.[0];
              if (!file) return;
              setFw(await file.text());
              // Reset so re-selecting the same file fires onChange again.
              input.value = '';
            }}
            className="text-xs"
          />
          <span className="text-xs text-brand-grey/70">— or paste below</span>
        </div>
        <textarea id={fwId} className="w-full h-40 bg-brand-surface border border-white/20 rounded p-2 font-mono text-xs text-brand-grey focus:border-brand-peak focus:outline-none"
          value={fw} onChange={(e) => setFw(e.target.value)} />
      </div>

      {error && <div className="text-brand-horizon text-sm mb-2">{error}</div>}

      <button className="px-5 py-2 bg-brand-peak hover:bg-brand-peakhover text-white font-semibold rounded" onClick={handleParse}>
        Parse
      </button>
    </div>
  );
}
