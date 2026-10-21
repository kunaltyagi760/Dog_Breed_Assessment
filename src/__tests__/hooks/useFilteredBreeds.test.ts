import { act, renderHook } from '@testing-library/react-native';

import { EMPTY_SYNC_META } from '@/db/repository';
import { SEARCH_DEBOUNCE_MS, useFilteredBreeds } from '@/features/breeds/useFilteredBreeds';
import { useBreedStore } from '@/store/breedStore';
import { useFilterStore } from '@/store/filterStore';

import { listItem } from '../helpers/fixtures';

describe('useFilteredBreeds', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useFilterStore.getState().reset();
    useBreedStore.getState().setSnapshot({
      breeds: [
        listItem('Beagle', { groupId: 'hound', searchText: 'beagle' }),
        listItem('Pug', { groupId: 'toy', searchText: 'pug', sizeBand: 'small' }),
        listItem('Whippet', { groupId: 'hound', searchText: 'whippet' }),
      ],
      groups: [
        { id: 'hound', name: 'Hound Group', label: 'Hound' },
        { id: 'toy', name: 'Toy Group', label: 'Toy' },
      ],
      syncMeta: EMPTY_SYNC_META,
    });
  });

  afterEach(() => jest.useRealTimers());

  it('groups every breed when nothing is filtered', async () => {
    const { result } = await renderHook(() => useFilteredBreeds());

    expect(result.current).toMatchObject({ resultCount: 3, totalCount: 3, stickyIndices: [0, 3] });
  });

  it('applies chip filters straight away', async () => {
    const { result } = await renderHook(() => useFilteredBreeds());

    await act(() => useFilterStore.getState().toggleSize('small'));

    expect(result.current.resultCount).toBe(1);
    expect(result.current.rows.map((row) => row.key)).toEqual(['group:toy', 'Pug']);
  });

  it('waits for typing to pause before searching', async () => {
    const { result } = await renderHook(() => useFilteredBreeds());

    await act(() => useFilterStore.getState().setQuery('pug'));
    expect(result.current.resultCount).toBe(3);

    await act(() => jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS));
    expect(result.current.resultCount).toBe(1);
  });

  it('changes the list key when results change, and only then', async () => {
    const { result, rerender } = await renderHook(() => useFilteredBreeds());
    const initialKey = result.current.listKey;

    await rerender({});
    expect(result.current.listKey).toBe(initialKey);

    await act(() => useFilterStore.getState().toggleSize('small'));
    const filteredKey = result.current.listKey;
    expect(filteredKey).not.toBe(initialKey);

    await act(() => useFilterStore.getState().clearFilters());
    expect(result.current.listKey).toBe(initialKey);
  });

  it('clears the search without waiting', async () => {
    const { result } = await renderHook(() => useFilteredBreeds());
    await act(() => useFilterStore.getState().setQuery('pug'));
    await act(() => jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS));

    await act(() => useFilterStore.getState().setQuery(''));

    expect(result.current.resultCount).toBe(3);
  });
});
