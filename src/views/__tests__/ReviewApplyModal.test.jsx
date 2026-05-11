import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReviewApplyModal } from '../ReviewApplyModal.jsx';
import { usePendingStore } from '../../state/pendingStore.js';

beforeEach(() => {
  usePendingStore.setState({ items: {} });
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ results: [{ status: 'ok' }] }),
  });
});

describe('ReviewApplyModal', () => {
  it('shows staged am-industry items grouped under their section', () => {
    const stage = usePendingStore.getState().stage;
    stage({
      type: 'am-industry',
      brand: { global_brand_id: 1, global_brand_nm: 'Life360', global_advertiser_id: 10, global_advertiser_nm: 'AdvA' },
      payload: { before: { industry_id: 1, industry_name: 'Tech', depth: 0, path: 'Tech' },
                 after:  { industry_id: 2, industry_name: 'Software', depth: 1, path: 'Tech › Software' },
                 v3_advertiser_id: 1000, v3_brand_id: 2000 },
    });
    render(<ReviewApplyModal open onClose={() => {}} />);
    expect(screen.getByText(/Advertiser Module industry edits/)).toBeInTheDocument();
    expect(screen.getByText(/Life360/)).toBeInTheDocument();
    expect(screen.getByText(/Tech.*Software/)).toBeInTheDocument();
  });

  it('POSTs to /api/changes/apply when Apply is clicked', async () => {
    const stage = usePendingStore.getState().stage;
    stage({
      type: 'am-industry',
      brand: { global_brand_id: 1, global_brand_nm: 'Life360', global_advertiser_id: 10, global_advertiser_nm: 'AdvA' },
      payload: { before: { industry_id: 1, industry_name: 'Tech', depth: 0, path: 'Tech' },
                 after:  { industry_id: 2, industry_name: 'Software', depth: 1, path: 'Tech › Software' },
                 v3_advertiser_id: 1000, v3_brand_id: 2000 },
    });
    render(<ReviewApplyModal open onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /^Apply$/i }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/changes/apply', expect.objectContaining({
        method: 'POST',
      }));
    });
  });
});
