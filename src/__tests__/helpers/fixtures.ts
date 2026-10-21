import { breedResourceSchema, type BreedResource } from '@/api/schemas';
import type { BreedListItem } from '@/domain/types';

type RawAttributes = Record<string, unknown>;

/** A breed in the exact shape the API returns, with overridable attributes. */
export function rawBreed(id: string, attributes: RawAttributes = {}, groupId = 'g-herding') {
  return {
    id,
    type: 'breed',
    attributes: {
      name: `Breed ${id}`,
      description: 'A dog.',
      hypoallergenic: false,
      life: { min: 10, max: 14 },
      male_weight: { min: 20, max: 30 },
      female_weight: { min: 18, max: 26 },
      male_height: { min: 50, max: 55 },
      female_height: { min: 46, max: 51 },
      origin: { country: 'Germany', region: '', era: '19th century' },
      coat: { type: 'double', length: 'medium', colors: ['black', 'tan'] },
      traits: {
        energy: 4,
        trainability: 5,
        barking: 3,
        grooming: 2,
        shedding: 4,
        drooling: 1,
        good_with_children: 5,
        good_with_dogs: 3,
        good_with_strangers: 2,
        apartment_friendly: 2,
        exercise_minutes: 60,
        temperament: ['loyal', 'alert'],
      },
      other_names: ['Alsatian'],
      recognized_by: ['AKC', 'FCI'],
      sources: [{ url: 'https://example.com', title: 'Example' }],
      images: [
        {
          id: `${id}-img`,
          url: 'https://images.example.com/full.jpg',
          thumb: 'https://images.example.com/thumb.webp',
          medium: 'https://images.example.com/medium.webp',
          large: 'https://images.example.com/large.webp',
          attribution: {
            author: 'Jane Doe',
            license: 'CC BY-SA 3.0',
            license_url: 'https://creativecommons.org/licenses/by-sa/3.0/',
            source: 'wikimedia_commons',
            source_url: 'https://commons.wikimedia.org/wiki/File:Dog.jpg',
          },
        },
      ],
      ...attributes,
    },
    relationships: { group: { data: { id: groupId, type: 'group' } } },
  };
}

export function breedResource(id: string, attributes?: RawAttributes): BreedResource {
  return breedResourceSchema.parse(rawBreed(id, attributes));
}

export function rawGroup(id: string, name: string) {
  return { id, type: 'group', attributes: { name }, relationships: { breeds: { data: [] } } };
}

export function listItem(id: string, overrides: Partial<BreedListItem> = {}): BreedListItem {
  return {
    id,
    name: id,
    groupId: 'g-herding',
    thumbUrl: null,
    sizeBand: 'medium',
    coatCategory: 'short',
    hypoallergenic: false,
    goodWithChildren: 3,
    goodWithDogs: 3,
    goodWithStrangers: 3,
    searchText: id.toLowerCase(),
    ...overrides,
  };
}
