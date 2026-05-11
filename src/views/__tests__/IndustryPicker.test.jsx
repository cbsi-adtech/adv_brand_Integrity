import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IndustryPicker } from '../IndustryPicker.jsx';
import { createTaxonomy } from '../../data/taxonomy.js';

const taxonomy = createTaxonomy({
  assignable: [
    { id: 1, name: 'Tech', depth: 0, parentId: null, path: 'Tech' },
    { id: 2, name: 'Software', depth: 1, parentId: 1, path: 'Tech › Software' },
  ],
  groupIds: [],
});

describe('IndustryPicker', () => {
  it('filters list by search input', () => {
    render(<IndustryPicker taxonomy={taxonomy} onPick={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/Search/i), { target: { value: 'soft' } });
    expect(screen.getByText('Tech › Software')).toBeInTheDocument();
    expect(screen.queryByText('Tech', { exact: true })).not.toBeInTheDocument();
  });

  it('calls onPick with id when an entry is clicked', () => {
    const onPick = vi.fn();
    render(<IndustryPicker taxonomy={taxonomy} onPick={onPick} />);
    fireEvent.click(screen.getByText('Tech › Software'));
    expect(onPick).toHaveBeenCalledWith(2);
  });
});
