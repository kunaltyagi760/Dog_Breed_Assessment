export type Range = { min: number; max: number };

export const SCORE_TRAITS = [
  'energy',
  'barking',
  'drooling',
  'grooming',
  'shedding',
  'trainability',
  'good_with_dogs',
  'apartment_friendly',
  'good_with_children',
  'good_with_strangers',
] as const;

export type ScoreTrait = (typeof SCORE_TRAITS)[number];

export const SIZE_BANDS = ['small', 'medium', 'large', 'giant'] as const;
export type SizeBand = (typeof SIZE_BANDS)[number];

export const COAT_CATEGORIES = ['short', 'medium', 'long', 'wire', 'hairless', 'unknown'] as const;
export type CoatCategory = (typeof COAT_CATEGORIES)[number];

export type ImageAttribution = {
  author: string | null;
  license: string | null;
  licenseUrl: string | null;
  source: string | null;
  sourceUrl: string | null;
};

export type BreedImage = {
  id: string;
  thumb: string | null;
  medium: string | null;
  large: string | null;
  attribution: ImageAttribution;
};

export type Breed = {
  id: string;
  name: string;
  groupId: string | null;
  description: string | null;
  hypoallergenic: boolean;
  lifeSpan: Range | null;
  weight: { male: Range | null; female: Range | null };
  height: { male: Range | null; female: Range | null };
  origin: { country: string | null; region: string | null; era: string | null };
  coat: { type: string | null; length: string | null; colors: string[] };
  scores: Record<ScoreTrait, number | null>;
  exerciseMinutes: number | null;
  temperament: string[];
  otherNames: string[];
  recognizedBy: string[];
  sources: { url: string; title: string | null }[];
  images: BreedImage[];
};

/** The slim shape the list, search and filters work with. */
export type BreedListItem = {
  id: string;
  name: string;
  groupId: string | null;
  thumbUrl: string | null;
  sizeBand: SizeBand | null;
  coatCategory: CoatCategory;
  hypoallergenic: boolean;
  goodWithChildren: number | null;
  goodWithDogs: number | null;
  goodWithStrangers: number | null;
  searchText: string;
};

export type Group = {
  id: string;
  name: string;
  label: string;
};
