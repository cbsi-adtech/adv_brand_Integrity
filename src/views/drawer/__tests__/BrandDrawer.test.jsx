import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrandDrawer } from '../BrandDrawer.jsx';
import { createTaxonomy } from '../../../data/taxonomy.js';

const taxonomy = createTaxonomy({
  assignable: [
    { id: 100, name: 'Tech', depth: 0, parentId: null, path: 'Tech' },
    { id: 101, name: 'Software', depth: 1, parentId: 100, path: 'Tech › Software' },
  ],
  groupIds: [],
});

const row = {
  global_brand_id: 1378215, global_brand_nm: 'Life360',
  global_advertiser_id: 5001, global_advertiser_nm: 'Life360 Inc',
  v3_advertiser_id: 4291, v3_brand_id: 8821,
  am: { resolved_industry_id: 100, resolved_industry_name: 'Tech', resolved_industry_depth: 0, resolved_industry_path: 'Tech', impressions: 100, revenue: 5 },
  pg: { resolved_industry_id: 101, resolved_industry_name: 'Software', resolved_industry_depth: 1, resolved_industry_path: 'Tech › Software', impressions: 50, revenue: 2 },
  other_modules: [], flags: [{ type: 'F2', severity: 'high', note: 'mismatch' }],
};

describe('BrandDrawer', () => {
  it('renders brand identity in header', () => {
    render(<BrandDrawer row={row} taxonomy={taxonomy} onClose={() => {}} />);
    expect(screen.getByText('Life360')).toBeInTheDocument();
    expect(screen.getByText(/Life360 Inc/)).toBeInTheDocument();
    expect(screen.getByText(/1378215/)).toBeInTheDocument();
  });

  it('renders both side-by-side panels with full module names', () => {
    render(<BrandDrawer row={row} taxonomy={taxonomy} onClose={() => {}} />);
    expect(screen.getAllByText(/Advertiser Module/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Programmatic Module/).length).toBeGreaterThan(0);
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<BrandDrawer row={row} taxonomy={taxonomy} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
