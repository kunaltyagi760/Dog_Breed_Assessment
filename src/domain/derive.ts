import type { RawRange } from '@/api/schemas';

import type { CoatCategory, Range, SizeBand } from './types';

/** Fills in a missing bound from the other one and fixes swapped min/max. */
export function toRange(raw: RawRange): Range | null {
  const min = raw?.min ?? raw?.max;
  const max = raw?.max ?? raw?.min;
  if (min == null || max == null || min <= 0) return null;
  return { min: Math.min(min, max), max: Math.max(min, max) };
}

const average = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

const maxOf = (...ranges: (Range | null)[]) =>
  average(ranges.flatMap((range) => (range ? [range.max] : [])));

// Thresholds and the reasoning behind them are in docs/DECISIONS.md.
const WEIGHT_BANDS_KG: [number, SizeBand][] = [
  [10, 'small'],
  [25, 'medium'],
  [45, 'large'],
];

const HEIGHT_BANDS_CM: [number, SizeBand][] = [
  [35, 'small'],
  [53, 'medium'],
  [65, 'large'],
];

function band(value: number, thresholds: [number, SizeBand][]): SizeBand {
  return thresholds.find(([limit]) => value < limit)?.[1] ?? 'giant';
}

export function sizeBandFor(
  weight: { male: Range | null; female: Range | null },
  height: { male: Range | null; female: Range | null },
): SizeBand | null {
  const kg = maxOf(weight.male, weight.female);
  if (kg != null) return band(kg, WEIGHT_BANDS_KG);

  const cm = maxOf(height.male, height.female);
  return cm != null ? band(cm, HEIGHT_BANDS_CM) : null;
}

// "wire" is a coat type in the data, not a length, so it's checked first.
export function coatCategoryFor(
  coat: { type: string | null; length: string | null } | null | undefined,
): CoatCategory {
  const type = coat?.type?.toLowerCase();
  const length = coat?.length?.toLowerCase();

  if (type === 'wire') return 'wire';
  if (type === 'hairless' || length === 'hairless') return 'hairless';
  if (length === 'short' || length === 'medium' || length === 'long') return length;
  return 'unknown';
}

/** "Herding Group" -> "Herding", "Miscellaneous Class" -> "Miscellaneous". */
export function groupLabel(name: string): string {
  return name.replace(/\s+(group|class)$/i, '').trim() || name;
}

/** Scores are documented as 1-5; anything outside that is treated as missing. */
export function toScore(value: number | null | undefined): number | null {
  return value != null && value >= 1 && value <= 5 ? Math.round(value) : null;
}
