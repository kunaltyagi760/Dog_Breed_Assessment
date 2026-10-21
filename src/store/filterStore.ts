import { create } from 'zustand';

import {
  DEFAULT_FILTERS,
  type BreedFilters,
  type HypoallergenicFilter,
  type SocialTrait,
} from '@/domain/filters';
import type { CoatCategory, SizeBand } from '@/domain/types';

const toggle = <T>(list: readonly T[], value: T): T[] =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

type FilterState = {
  // Kept apart from `filters` so typing doesn't hand a new filters object
  // to everything that only cares about chips.
  query: string;
  filters: BreedFilters;
  setQuery(query: string): void;
  toggleGroup(groupId: string): void;
  toggleSize(size: SizeBand): void;
  toggleCoat(coat: CoatCategory): void;
  setHypoallergenic(value: HypoallergenicFilter): void;
  setMinScore(trait: SocialTrait, score: number): void;
  clearFilters(): void;
  reset(): void;
};

export const useFilterStore = create<FilterState>((set) => ({
  query: '',
  filters: DEFAULT_FILTERS,
  setQuery: (query) => set({ query }),
  toggleGroup: (groupId) =>
    set(({ filters }) => ({
      filters: { ...filters, groupIds: toggle(filters.groupIds, groupId) },
    })),
  toggleSize: (size) =>
    set(({ filters }) => ({ filters: { ...filters, sizes: toggle(filters.sizes, size) } })),
  toggleCoat: (coat) =>
    set(({ filters }) => ({ filters: { ...filters, coats: toggle(filters.coats, coat) } })),
  setHypoallergenic: (hypoallergenic) =>
    set(({ filters }) => ({ filters: { ...filters, hypoallergenic } })),
  setMinScore: (trait, score) =>
    set(({ filters }) => ({
      filters: { ...filters, minScores: { ...filters.minScores, [trait]: score } },
    })),
  clearFilters: () => set({ filters: DEFAULT_FILTERS }),
  reset: () => set({ query: '', filters: DEFAULT_FILTERS }),
}));
