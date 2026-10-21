import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ComponentProps } from 'react';

import { FilterBar } from '@/features/breeds/filters/FilterBar';

type Props = ComponentProps<typeof FilterBar>;

const baseProps: Props = {
  activeCount: 0,
  resultCount: 283,
  totalCount: 283,
  isNarrowed: false,
  onOpenFilters: jest.fn(),
  onClear: jest.fn(),
};

describe('FilterBar', () => {
  it('shows a plain Filters button when nothing is active', async () => {
    await render(<FilterBar {...baseProps} />);

    expect(screen.getByRole('button', { name: 'Filters' })).toBeOnTheScreen();
    expect(screen.queryByText('Clear')).toBeNull();
  });

  it('shows the active count, the result count and Clear', async () => {
    const onClear = jest.fn();
    await render(
      <FilterBar {...baseProps} activeCount={2} resultCount={12} isNarrowed onClear={onClear} />,
    );

    expect(screen.getByRole('button', { name: 'Filters, 2 active' })).toBeOnTheScreen();
    expect(screen.getByText('12 of 283')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Clear'));
    expect(onClear).toHaveBeenCalled();
  });

  it('opens the filter sheet', async () => {
    const onOpenFilters = jest.fn();
    await render(<FilterBar {...baseProps} onOpenFilters={onOpenFilters} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));
    expect(onOpenFilters).toHaveBeenCalled();
  });
});
