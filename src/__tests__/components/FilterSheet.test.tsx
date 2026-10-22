import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { EMPTY_SYNC_META } from '@/db/repository';
import { FilterSheet } from '@/features/breeds/filters/FilterSheet';
import { useBreedStore } from '@/store/breedStore';
import { useFilterStore } from '@/store/filterStore';

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

const renderSheet = (props: { resultCount?: number; onClose?: () => void } = {}) =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <FilterSheet
        visible
        resultCount={props.resultCount ?? 42}
        onClose={props.onClose ?? jest.fn()}
      />
    </SafeAreaProvider>,
  );

describe('FilterSheet', () => {
  beforeEach(() => {
    useFilterStore.getState().reset();
    useBreedStore.getState().setSnapshot({
      breeds: [],
      groups: [
        { id: 'toy', name: 'Toy Group', label: 'Toy' },
        { id: 'herding', name: 'Herding Group', label: 'Herding' },
      ],
      syncMeta: EMPTY_SYNC_META,
    });
  });

  it('lists the breed groups sorted by label', async () => {
    await renderSheet();

    // The store holds Toy first; the sheet should still show Herding before Toy.
    const chips = screen.getAllByRole('button');
    const herding = chips.indexOf(screen.getByRole('button', { name: 'Herding' }));
    const toy = chips.indexOf(screen.getByRole('button', { name: 'Toy' }));

    expect(herding).toBeGreaterThanOrEqual(0);
    expect(herding).toBeLessThan(toy);
  });

  it('toggles a group chip in the store', async () => {
    await renderSheet();

    await fireEvent.press(screen.getByRole('button', { name: 'Toy' }));
    expect(useFilterStore.getState().filters.groupIds).toEqual(['toy']);
    expect(screen.getByRole('button', { name: 'Toy' })).toBeSelected();

    await fireEvent.press(screen.getByRole('button', { name: 'Toy' }));
    expect(useFilterStore.getState().filters.groupIds).toEqual([]);
  });

  it('sets a trait threshold for the right trait', async () => {
    await renderSheet();

    // Each trait section has its own "4+" chip; the second one is "Good with other dogs".
    await fireEvent.press(screen.getAllByRole('button', { name: '4+' })[1]!);

    expect(useFilterStore.getState().filters.minScores).toEqual({
      goodWithChildren: 0,
      goodWithDogs: 4,
      goodWithStrangers: 0,
    });
  });

  it('shows the live result count and closes', async () => {
    const onClose = jest.fn();
    await renderSheet({ resultCount: 7, onClose });

    await fireEvent.press(screen.getByRole('button', { name: 'Show 7 breeds' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('clears every filter but leaves the search alone', async () => {
    useFilterStore.getState().setQuery('pug');
    useFilterStore.getState().toggleCoat('wire');
    await renderSheet();

    await fireEvent.press(screen.getByRole('button', { name: 'Clear all' }));

    expect(useFilterStore.getState().filters.coats).toEqual([]);
    expect(useFilterStore.getState().query).toBe('pug');
  });
});
