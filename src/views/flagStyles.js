// Single source of truth for flag-badge appearance and short labels.
// `key` distinguishes F1-Programmatic vs. F1-Programmatic-high-impact,
// since they have different visual treatment but share the type code.

export const FLAG_STYLES = {
  F2:           { label: 'Root mismatch',         color: 'bg-red-100 text-red-800 border-red-300' },
  F1_high:      { label: '🔥 Generic + high-impact', color: 'bg-orange-200 text-orange-900 border-orange-400 font-semibold' },
  F1:           { label: 'Generic Programmatic',  color: 'bg-orange-100 text-orange-800 border-orange-300' },
  F3a:          { label: 'Lateral mismatch',      color: 'bg-purple-100 text-purple-800 border-purple-300' },
  F3b:          { label: 'Ancestor mismatch',     color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  F4a:          { label: 'Group-ID misuse',       color: 'bg-rose-100 text-rose-800 border-rose-300' },
  F4b:          { label: 'Advertiser Module unmapped', color: 'bg-slate-200 text-slate-700 border-slate-300' },
  F4c:          { label: 'Programmatic unresolved',    color: 'bg-slate-100 text-slate-600 border-slate-300' },
};

export const FLAG_FILTER_ORDER = ['F2', 'F1_high', 'F1', 'F3a', 'F3b', 'F4a', 'F4b', 'F4c'];

export function flagKey(flag) {
  if (flag.type === 'F1' && flag.highImpact) return 'F1_high';
  return flag.type;
}
