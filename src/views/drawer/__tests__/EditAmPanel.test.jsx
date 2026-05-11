import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditAmPanel } from '../EditAmPanel.jsx';
import { createTaxonomy } from '../../../data/taxonomy.js';
import { usePendingStore } from '../../../state/pendingStore.js';

const taxonomy = createTaxonomy({
  assignable: [
    { id: 100, name: 'Tech', depth: 0, parentId: null, path: 'Tech' },
    { id: 101, name: 'Software', depth: 1, parentId: 100, path: 'Tech › Software' },
  ],
  groupIds: [999],
});

const row = {
  global_brand_id: 1, global_brand_nm: 'A',
  global_advertiser_id: 10, global_advertiser_nm: 'AdvA',
  v3_advertiser_id: 1000, v3_brand_id: 2000,
  am: { resolved_industry_id: 100, resolved_industry_name: 'Tech',
        resolved_industry_depth: 0, resolved_industry_path: 'Tech' },
  pg: null, other_modules: [], flags: [],
};

beforeEach(() => {
  usePendingStore.setState({ items: {} });
});

describe('EditAmPanel', () => {
  it('stages an am-industry pending item when a new industry is picked', () => {
    render(<EditAmPanel row={row} taxonomy={taxonomy} />);
    fireEvent.click(screen.getByRole('button', { name: /Edit Advertiser Module industry/i }));
    fireEvent.click(screen.getByText('Tech › Software'));
    fireEvent.click(screen.getByRole('button', { name: /Stage change/i }));

    const items = Object.values(usePendingStore.getState().items);
    expect(items).toHaveLength(1);
    expect(items[0].type).toBe('am-industry');
    expect(items[0].payload.after.industry_id).toBe(101);
  });

  it('rejects same-as-current selection', () => {
    render(<EditAmPanel row={row} taxonomy={taxonomy} />);
    fireEvent.click(screen.getByRole('button', { name: /Edit Advertiser Module industry/i }));
    fireEvent.click(screen.getByText('Tech', { exact: true }));
    fireEvent.click(screen.getByRole('button', { name: /Stage change/i }));
    expect(screen.getByText(/unchanged/i)).toBeInTheDocument();
    expect(Object.keys(usePendingStore.getState().items)).toHaveLength(0);
  });
});
