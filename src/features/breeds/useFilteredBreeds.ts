import { useMemo } from 'react';

import { createBreedMatcher } from '@/domain/filters';
import { buildSections } from '@/domain/sections';
import type { BreedListItem } from '@/domain/types';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useBreedStore } from '@/store/breedStore';
import { useFilterStore } from '@/store/filterStore';

export const SEARCH_DEBOUNCE_MS = 250;

/** The list's rows for the current search and filters, grouped into sections. */
export function useFilteredBreeds() {
  const breeds = useBreedStore((state) => state.breeds);
  const groups = useBreedStore((state) => state.groups);
  const filters = useFilterStore((state) => state.filters);
  const query = useFilterStore((state) => state.query);

  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  // Clearing the search should feel instant; only typing is debounced.
  const appliedQuery = query === '' ? '' : debouncedQuery;

  return useMemo(() => {
    const matches = createBreedMatcher(filters, appliedQuery);
    const items: BreedListItem[] = [];
    for (const id of breeds.allIds) {
      const item = breeds.byId[id];
      if (item && matches(item)) items.push(item);
    }
    return {
      ...buildSections(items, groups.byId),
      appliedQuery,
      resultCount: items.length,
      totalCount: breeds.allIds.length,
    };
  }, [breeds, groups, filters, appliedQuery]);
}
