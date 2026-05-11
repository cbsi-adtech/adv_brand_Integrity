import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataLoadDialog } from '../DataLoadDialog.jsx';

const BQ_CSV = 'global_brand_id,global_brand_nm,am_applied_industry_ids_raw,am_impressions,am_revenue,ind_applied_industry_ids_raw,ind_impressions,ind_revenue\n1,Brand,100,1000,10,200,500,5';

describe('DataLoadDialog', () => {
  it('renders two textareas (BQ + FW) and a Parse button', () => {
    render(<DataLoadDialog onLoaded={() => {}} />);
    expect(screen.getByLabelText(/BigQuery/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/FreeWheel/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Parse/i })).toBeInTheDocument();
  });

  it('calls onLoaded with parsed RawRecord[] when Parse is clicked with BQ content', () => {
    const onLoaded = vi.fn();
    render(<DataLoadDialog onLoaded={onLoaded} />);
    const ta = screen.getByLabelText(/BigQuery/i);
    fireEvent.change(ta, { target: { value: BQ_CSV } });
    fireEvent.click(screen.getByRole('button', { name: /Parse/i }));
    expect(onLoaded).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ source: 'bq-sql', global_brand_id: 1 }),
    ]));
  });

  it('shows an error when CSV format cannot be detected', () => {
    render(<DataLoadDialog onLoaded={() => {}} />);
    fireEvent.change(screen.getByLabelText(/BigQuery/i), { target: { value: 'foo,bar\n1,2' } });
    fireEvent.click(screen.getByRole('button', { name: /Parse/i }));
    expect(screen.getByText(/Unrecognized/i)).toBeInTheDocument();
  });
});
