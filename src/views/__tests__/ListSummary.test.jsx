import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ListSummary } from '../ListSummary.jsx';

const rows = [
  { global_brand_id: 1, flags: [{ type: 'F2', severity: 'high' }],
    total_revenue: 1_200_000, total_impressions: 50_000_000 },
  { global_brand_id: 2, flags: [{ type: 'F1', highImpact: true, side: 'pg', severity: 'high' }],
    total_revenue: 300_000, total_impressions: 2_000_000 },
  { global_brand_id: 3, flags: [], total_revenue: 5, total_impressions: 10 },
];

describe('ListSummary impact KPIs', () => {
  it('shows revenue and impressions at risk over flagged rows', () => {
    render(<ListSummary rows={rows} filteredCount={3} filters={{}} onFiltersChange={() => {}} />);
    expect(screen.getByText(/Revenue at risk/i)).toBeInTheDocument();
    expect(screen.getByText('$1.5M')).toBeInTheDocument();
    expect(screen.getByText(/Impressions at risk/i)).toBeInTheDocument();
    expect(screen.getByText('52M')).toBeInTheDocument();
  });

  it('shows flagged and high-impact brand counts', () => {
    render(<ListSummary rows={rows} filteredCount={3} filters={{}} onFiltersChange={() => {}} />);
    expect(screen.getByText(/Flagged brands/i)).toBeInTheDocument();
    expect(screen.getAllByText(/High-impact/i).length).toBeGreaterThanOrEqual(1);
  });
});
