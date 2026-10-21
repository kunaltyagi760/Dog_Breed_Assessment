import type { BreedResource, GroupResource } from '@/api/schemas';
import { foldText } from '@/lib/text';

import { coatCategoryFor, groupLabel, sizeBandFor, toRange, toScore } from './derive';
import { SCORE_TRAITS, type Breed, type BreedListItem, type Group, type ScoreTrait } from './types';

export function toBreed({ id, attributes: a, relationships }: BreedResource): Breed {
  const scores = Object.fromEntries(
    SCORE_TRAITS.map((trait) => [trait, toScore(a.traits?.[trait])]),
  ) as Record<ScoreTrait, number | null>;

  return {
    id,
    name: a.name,
    groupId: relationships?.group?.data?.id ?? null,
    description: a.description,
    hypoallergenic: a.hypoallergenic ?? false,
    lifeSpan: toRange(a.life),
    weight: { male: toRange(a.male_weight), female: toRange(a.female_weight) },
    height: { male: toRange(a.male_height), female: toRange(a.female_height) },
    origin: {
      country: a.origin?.country ?? null,
      region: a.origin?.region ?? null,
      era: a.origin?.era ?? null,
    },
    coat: {
      type: a.coat?.type ?? null,
      length: a.coat?.length ?? null,
      colors: a.coat?.colors ?? [],
    },
    scores,
    exerciseMinutes: a.traits?.exercise_minutes ?? null,
    temperament: a.traits?.temperament ?? [],
    otherNames: a.other_names,
    recognizedBy: a.recognized_by,
    sources: a.sources ?? [],
    // An image without any usable variant can't be shown, so it's dropped.
    images: (a.images ?? [])
      .filter((image) => image.thumb || image.medium || image.large)
      .map((image) => ({
        id: image.id,
        thumb: image.thumb,
        medium: image.medium,
        large: image.large,
        attribution: {
          author: image.attribution?.author ?? null,
          license: image.attribution?.license ?? null,
          licenseUrl: image.attribution?.license_url ?? null,
          source: image.attribution?.source ?? null,
          sourceUrl: image.attribution?.source_url ?? null,
        },
      })),
  };
}

export function toListItem(breed: Breed): BreedListItem {
  const firstImage = breed.images[0];
  return {
    id: breed.id,
    name: breed.name,
    groupId: breed.groupId,
    thumbUrl: firstImage?.thumb ?? firstImage?.medium ?? null,
    sizeBand: sizeBandFor(breed.weight, breed.height),
    coatCategory: coatCategoryFor(breed.coat),
    hypoallergenic: breed.hypoallergenic,
    goodWithChildren: breed.scores.good_with_children,
    goodWithDogs: breed.scores.good_with_dogs,
    goodWithStrangers: breed.scores.good_with_strangers,
    searchText: foldText([breed.name, ...breed.otherNames].join(' ')),
  };
}

export function toGroup({ id, attributes }: GroupResource): Group {
  return { id, name: attributes.name, label: groupLabel(attributes.name) };
}
