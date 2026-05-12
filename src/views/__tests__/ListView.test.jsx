import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
