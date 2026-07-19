// Single source of truth for flag-badge appearance and short labels.
// `key` distinguishes F1-Programmatic vs. F1-Programmatic-high-impact,
// since they have different visual treatment but share the type code.

// Dark-theme badges on the Paramount palette: critical → Horizon,
// warning → Sunrise, info → Sky, neutral → Mountain Grey.
export const FLAG_STYLES = {
  F2:           { label: 'Root mismatch',         color: 'bg-brand-horizon/15 text-brand-horizon border-brand-horizon/50' },
  F1_high:      { label: '🔥 Generic + high-impact', color: 'bg-brand-sunrise/20 text-brand-sunrise border-brand-sunrise/60 font-semibold' },
  F1:           { label: 'Generic Programmatic',  color: 'bg-brand-sunrise/10 text-brand-sunrise border-brand-sunrise/40' },
  F1_AM:        { label: 'Generic Advertiser Module', color: 'bg-brand-sunrisetint/10 text-brand-sunrisetint border-brand-sunrisetint/40' },
  F3a:          { label: 'Lateral mismatch',      color: 'bg-brand-sky/10 text-brand-sky border-brand-sky/40' },
  F3b:          { label: 'Ancestor mismatch',     color: 'bg-brand-skytint/10 text-brand-skytint border-brand-skytint/40' },
  F4a:          { label: 'Group-ID misuse',       color: 'bg-brand-horizontint/20 text-brand-horizon border-brand-horizontint/60' },
  F4b:          { label: 'Advertiser Module unmapped', color: 'bg-white/5 text-brand-grey border-white/20' },
  F4c:          { label: 'Programmatic unresolved',    color: 'bg-white/5 text-brand-grey/80 border-white/15' },
};

export const FLAG_FILTER_ORDER = ['F2', 'F1_high', 'F1', 'F1_AM', 'F3a', 'F3b', 'F4a', 'F4b', 'F4c'];

export function flagKey(flag) {
  if (flag.type === 'F1' && flag.highImpact) return 'F1_high';
  return flag.type;
}
