import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ListView } from '../ListView.jsx';

const rows = [
  {
    global_brand_id: 1, global_brand_nm: 'Life360',
    global_advertiser_id: 10, global_advertiser_nm: 'Life360 Inc',
    am: { resolved_industry_id: 100, resolved_industry_name: 'Tech',
          resolved_industry_depth: 0, resolved_industry_path: 'Tech',
          impressions: 1000, revenue: 5 },
    pg: { resolved_industry_name: 'Software', impressions: 500, revenue: 2 },
    total_impressions: 1500, total_revenue: 7,
    other_modules: [], flags: [], pg_creatives: null,
  },
];

describe('ListView', () => {
  it('renders all 10 column headers using full module names', () => {
    render(<ListView rows={rows} onRowClick={() => {}} />);
    expect(screen.getByText('Flags')).toBeInTheDocument();
    expect(screen.getByText('Brand')).toBeInTheDocument();
    expect(screen.getByText('Advertiser')).toBeInTheDocument();
    expect(screen.getAllByText(/Advertiser Module industry/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Programmatic Module industry/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Advertiser Module impressions/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Programmatic Module impressions/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Programmatic Module revenue/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Other modules/)).toBeInTheDocument();
    expect(screen.getByText(/Pending/)).toBeInTheDocument();
  });

  it('renders one row per canonical row with brand name visible', () => {
    render(<ListView rows={rows} onRowClick={() => {}} />);
    expect(screen.getByText('Life360')).toBeInTheDocument();
    expect(screen.getByText('Life360 Inc')).toBeInTheDocument();
    expect(screen.getByText('Tech')).toBeInTheDocument();
    expect(screen.getByText('Software')).toBeInTheDocument();
  });

  it('shows the FW-canonical (gb) industry as a secondary line in the brand cell', () => {
    const withGb = [{
      ...rows[0],
      gb: { resolved_industry_id: 200, resolved_industry_name: 'Auto Canonical',
            resolved_industry_path: 'Auto Canonical' },
    }];
    render(<ListView rows={withGb} onRowClick={() => {}} />);
    expect(screen.getByText(/FW canonical: Auto Canonical/)).toBeInTheDocument();
  });

  it('falls back to the raw gb industry id when the gb slot has no resolved name', () => {
    const withGb = [{ ...rows[0], gb: { industry_id: 456 } }];
    render(<ListView rows={withGb} onRowClick={() => {}} />);
    expect(screen.getByText(/FW canonical: 456/)).toBeInTheDocument();
  });

  it('renders no FW canonical line when gb is null', () => {
    render(<ListView rows={rows} onRowClick={() => {}} />);
    expect(screen.queryByText(/FW canonical:/)).toBeNull();
  });

  it('virtualizes large row sets: only a viewport-sized slice is in the DOM', () => {
    const many = Array.from({ length: 500 }, (_, i) => ({
      ...rows[0],
      global_brand_id: i + 1,
      global_brand_nm: `Brand ${i + 1}`,
      global_advertiser_nm: `Advertiser ${i + 1}`,
    }));
    const { container } = render(<ListView rows={many} onRowClick={() => {}} />);

    const bodyRows = container.querySelectorAll('tbody tr[data-index]');
    expect(bodyRows.length).toBeGreaterThan(0);
    expect(bodyRows.length).toBeLessThan(120);   // ~viewport + overscan, not all 500

    // Summary still reports the full dataset ("Showing 500 of 500").
    expect(screen.getAllByText('500').length).toBeGreaterThanOrEqual(1);
  });

  it('module select shows "All" (no side filter) by default, distinct from "Both modules present"', () => {
    render(<ListView rows={rows} filters={{}} onFiltersChange={() => {}} onRowClick={() => {}} />);
    const allOption = screen.getByRole('option', { name: 'All' });
    expect(screen.getByRole('option', { name: 'Both modules present' })).toBeInTheDocument();
    expect(allOption.closest('select')).toHaveValue('');
  });

  it('returning the module select to "All" clears the side filter (round-trip)', () => {
    const onChange = vi.fn();
    render(<ListView rows={rows} filters={{ side: 'am' }} onFiltersChange={onChange} onRowClick={() => {}} />);
    const select = screen.getByRole('option', { name: 'All' }).closest('select');
    expect(select).toHaveValue('am');

    fireEvent.change(select, { target: { value: '' } });

    expect(onChange).toHaveBeenCalled();
    const patch = onChange.mock.calls.at(-1)[0];
    expect(patch.side).toBeUndefined();
  });
});
