import type { BreedListItem, CoatCategory, ScoreTrait, SizeBand } from './types';

export const SIZE_LABELS: Record<SizeBand, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  giant: 'Giant',
};

export const COAT_LABELS: Record<CoatCategory, string> = {
  short: 'Short',
  medium: 'Medium',
  long: 'Long',
  wire: 'Wire',
  hairless: 'Hairless',
  unknown: 'Unknown',
};

export const TRAIT_LABELS: Record<ScoreTrait, string> = {
  energy: 'Energy',
  trainability: 'Trainability',
  barking: 'Barking',
  grooming: 'Grooming needs',
  shedding: 'Shedding',
  drooling: 'Drooling',
  good_with_children: 'Good with children',
  good_with_dogs: 'Good with other dogs',
  good_with_strangers: 'Good with strangers',
  apartment_friendly: 'Apartment friendly',
};

/** One-line description for a list row, e.g. "Medium · Wire coat · Hypoallergenic". */
export function breedSummary(item: BreedListItem): string {
  const parts: string[] = [];
  if (item.sizeBand) parts.push(SIZE_LABELS[item.sizeBand]);
  if (item.coatCategory === 'hairless') parts.push('Hairless');
  else if (item.coatCategory !== 'unknown') parts.push(`${COAT_LABELS[item.coatCategory]} coat`);
  if (item.hypoallergenic) parts.push('Hypoallergenic');
  return parts.join(' · ');
}
