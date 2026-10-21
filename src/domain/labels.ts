import type { BreedListItem, CoatCategory, SizeBand } from './types';

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

/** One-line description for a list row, e.g. "Medium · Wire coat · Hypoallergenic". */
export function breedSummary(item: BreedListItem): string {
  const parts: string[] = [];
  if (item.sizeBand) parts.push(SIZE_LABELS[item.sizeBand]);
  if (item.coatCategory === 'hairless') parts.push('Hairless');
  else if (item.coatCategory !== 'unknown') parts.push(`${COAT_LABELS[item.coatCategory]} coat`);
  if (item.hypoallergenic) parts.push('Hypoallergenic');
  return parts.join(' · ');
}
