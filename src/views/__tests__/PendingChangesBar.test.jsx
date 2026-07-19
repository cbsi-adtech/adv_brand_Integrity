import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PendingChangesBar } from '../PendingChangesBar.jsx';
import { usePendingStore } from '../../state/pendingStore.js';

beforeEach(() => { usePendingStore.setState({ items: {} }); });

describe('PendingChangesBar', () => {
  it('does not render when no items', () => {
    const { container } = render(<PendingChangesBar onReview={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows count of staged items grouped by type', () => {
    const stage = usePendingStore.getState().stage;
    const brand = { global_brand_id: 1, global_brand_nm: 'A', global_advertiser_id: 10, global_advertiser_nm: 'AdvA' };
    const brand2 = { global_brand_id: 2, global_brand_nm: 'B', global_advertiser_id: 11, global_advertiser_nm: 'AdvB' };
    // Distinct brands: am-industry items dedupe per brand on stage().
    stage({ type: 'am-industry', brand, payload: {} });
    stage({ type: 'am-industry', brand: brand2, payload: {} });
    stage({ type: 'zendesk-draft', brand, payload: {} });
    render(<PendingChangesBar onReview={() => {}} />);
    expect(screen.getByText(/3 pending changes/)).toBeInTheDocument();
    expect(screen.getByText(/2 Advertiser Module edits/)).toBeInTheDocument();
    expect(screen.getByText(/1 Zendesk draft/)).toBeInTheDocument();
  });
});
