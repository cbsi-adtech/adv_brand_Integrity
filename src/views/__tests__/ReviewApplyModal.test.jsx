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

  it('clicking Apply twice does not re-send already-applied items', async () => {
    const stage = usePendingStore.getState().stage;
    const id = stage({
      type: 'am-industry',
      brand: { global_brand_id: 1, global_brand_nm: 'Life360', global_advertiser_id: 10, global_advertiser_nm: 'AdvA' },
      payload: { before: { industry_id: 1, industry_name: 'Tech', depth: 0, path: 'Tech' },
                 after:  { industry_id: 2, industry_name: 'Software', depth: 1, path: 'Tech › Software' },
                 v3_advertiser_id: 1000, v3_brand_id: 2000 },
    });
    render(<ReviewApplyModal open onClose={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: /^Apply/i }));
    await waitFor(() => {
      expect(usePendingStore.getState().items[id].status).toBe('applied');
    });

    fireEvent.click(screen.getByRole('button', { name: /^Apply/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Apply/i })).not.toBeDisabled();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(usePendingStore.getState().items[id].status).toBe('applied');
  });

  it('removing one staged item leaves the other staged, and Apply skips the removed one', async () => {
    const stage = usePendingStore.getState().stage;
    const idA = stage({
      type: 'am-industry',
      brand: { global_brand_id: 1, global_brand_nm: 'Life360', global_advertiser_id: 10, global_advertiser_nm: 'AdvA' },
      payload: { before: { industry_id: 1, industry_name: 'Tech', depth: 0, path: 'Tech' },
                 after:  { industry_id: 2, industry_name: 'Software', depth: 1, path: 'Tech › Software' },
                 v3_advertiser_id: 1000, v3_brand_id: 2000 },
    });
    const idB = stage({
      type: 'am-industry',
      brand: { global_brand_id: 2, global_brand_nm: 'Midas', global_advertiser_id: 11, global_advertiser_nm: 'AdvB' },
      payload: { before: { industry_id: 1, industry_name: 'Tech', depth: 0, path: 'Tech' },
                 after:  { industry_id: 3, industry_name: 'Auto', depth: 0, path: 'Auto' },
                 v3_advertiser_id: 1001, v3_brand_id: 2001 },
    });
    render(<ReviewApplyModal open onClose={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: /remove life360/i }));

    expect(usePendingStore.getState().items[idA]).toBeUndefined();
    expect(usePendingStore.getState().items[idB].status).toBe('staged');

    fireEvent.click(screen.getByRole('button', { name: /^Apply/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.changes).toHaveLength(1);
    expect(body.changes[0].brand_name).toBe('Midas');
  });

  it('hides the remove button while an item is applying', () => {
    const stage = usePendingStore.getState().stage;
    const id = stage({
      type: 'am-industry',
      brand: { global_brand_id: 1, global_brand_nm: 'Life360', global_advertiser_id: 10, global_advertiser_nm: 'AdvA' },
      payload: { after: { industry_id: 2, industry_name: 'Software', depth: 1, path: 'Tech › Software' },
                 v3_advertiser_id: 1000, v3_brand_id: 2000 },
    });
    usePendingStore.getState().setStatus(id, 'applying');
    render(<ReviewApplyModal open onClose={() => {}} />);
    expect(screen.queryByRole('button', { name: /remove life360/i })).toBeNull();
  });

  it('shows visible feedback when copying the Zendesk draft to clipboard fails', async () => {
    const stage = usePendingStore.getState().stage;
    stage({
      type: 'zendesk-draft',
      brand: { global_brand_id: 1, global_brand_nm: 'Life360', global_advertiser_id: 10, global_advertiser_nm: 'AdvA' },
      payload: { from_industry: 'Tech', to_industry: 'Software' },
    });
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    render(<ReviewApplyModal open onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /copy to clipboard/i }));

    await waitFor(() => {
      expect(screen.getByText(/copy failed/i)).toBeInTheDocument();
    });
    expect(writeText).toHaveBeenCalled();
  });

  it('shows confirmation when copying the Zendesk draft succeeds', async () => {
    const stage = usePendingStore.getState().stage;
    stage({
      type: 'zendesk-draft',
      brand: { global_brand_id: 1, global_brand_nm: 'Life360', global_advertiser_id: 10, global_advertiser_nm: 'AdvA' },
      payload: { from_industry: 'Tech', to_industry: 'Software' },
    });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    render(<ReviewApplyModal open onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /copy to clipboard/i }));

    await waitFor(() => {
      expect(screen.getByText(/copied/i)).toBeInTheDocument();
    });
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
