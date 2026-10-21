import { foldText } from '@/lib/text';

import type { BreedListItem, CoatCategory, SizeBand } from './types';

export const SOCIAL_TRAITS = ['goodWithChildren', 'goodWithDogs', 'goodWithStrangers'] as const;
export type SocialTrait = (typeof SOCIAL_TRAITS)[number];

export type HypoallergenicFilter = 'any' | 'yes' | 'no';

export type BreedFilters = {
  groupIds: string[];
  sizes: SizeBand[];
  coats: CoatCategory[];
  hypoallergenic: HypoallergenicFilter;
  /** Minimum score per trait; 0 means "any". */
  minScores: Record<SocialTrait, number>;
};

export const DEFAULT_FILTERS: BreedFilters = {
  groupIds: [],
  sizes: [],
  coats: [],
  hypoallergenic: 'any',
  minScores: { goodWithChildren: 0, goodWithDogs: 0, goodWithStrangers: 0 },
};

export function searchTokens(query: string): string[] {
  return foldText(query).split(/\s+/).filter(Boolean);
}

/**
 * Builds a predicate for the current filters. Options within one filter are
 * OR'd (Herding or Toy); different filters are AND'd (and Small). Every search
 * word has to appear somewhere in the name or other names.
 */
export function createBreedMatcher(filters: BreedFilters, query: string) {
  const tokens = searchTokens(query);
  const groupIds = new Set(filters.groupIds);
  const sizes = new Set(filters.sizes);
  const coats = new Set(filters.coats);
  const traitLimits = SOCIAL_TRAITS.filter((trait) => filters.minScores[trait] > 0);

  return (item: BreedListItem): boolean => {
    if (tokens.length && !tokens.every((token) => item.searchText.includes(token))) return false;
    if (groupIds.size && !(item.groupId && groupIds.has(item.groupId))) return false;
    if (sizes.size && !(item.sizeBand && sizes.has(item.sizeBand))) return false;
    if (coats.size && !coats.has(item.coatCategory)) return false;
    if (filters.hypoallergenic === 'yes' && !item.hypoallergenic) return false;
    if (filters.hypoallergenic === 'no' && item.hypoallergenic) return false;
    return traitLimits.every((trait) => (item[trait] ?? 0) >= filters.minScores[trait]);
  };
}

export function activeFilterCount(filters: BreedFilters): number {
  return (
    filters.groupIds.length +
    filters.sizes.length +
    filters.coats.length +
    (filters.hypoallergenic === 'any' ? 0 : 1) +
    SOCIAL_TRAITS.filter((trait) => filters.minScores[trait] > 0).length
  );
}
