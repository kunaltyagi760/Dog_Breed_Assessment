import { groupResourceSchema } from '@/api/schemas';
import { toBreed, toGroup, toListItem } from '@/domain/normalize';

import { breedResource, rawGroup } from '../helpers/fixtures';

describe('toBreed', () => {
  it('maps a complete record', () => {
    const breed = toBreed(breedResource('gsd', { name: 'German Shepherd' }));

    expect(breed).toMatchObject({
      id: 'gsd',
      name: 'German Shepherd',
      groupId: 'g-herding',
      lifeSpan: { min: 10, max: 14 },
      scores: { energy: 4, good_with_children: 5 },
      exerciseMinutes: 60,
      temperament: ['loyal', 'alert'],
    });
    expect(breed.images[0]?.attribution.author).toBe('Jane Doe');
  });

  it('turns blank and missing values into null instead of empty strings', () => {
    const breed = toBreed(
      breedResource('messy', {
        description: '   ',
        male_height: null,
        origin: { country: 'Japan', region: '', era: null },
        traits: null,
        other_names: null,
      }),
    );

    expect(breed.description).toBeNull();
    expect(breed.height.male).toBeNull();
    expect(breed.origin).toEqual({ country: 'Japan', region: null, era: null });
    expect(breed.scores.energy).toBeNull();
    expect(breed.temperament).toEqual([]);
    expect(breed.otherNames).toEqual([]);
  });

  it('keeps images without an author but drops ones with no usable variant', () => {
    const breed = toBreed(
      breedResource('img', {
        images: [
          { id: 'a', thumb: 't.webp', medium: null, large: null, attribution: { author: '' } },
          { id: 'b', thumb: null, medium: null, large: null },
        ],
      }),
    );

    expect(breed.images.map((image) => image.id)).toEqual(['a']);
    expect(breed.images[0]?.attribution.author).toBeNull();
  });
});

describe('toListItem', () => {
  it('builds the slim row used by the list', () => {
    const item = toListItem(
      toBreed(breedResource('löw', { name: 'Löwchen', other_names: ['Little Lion Dog'] })),
    );

    expect(item).toEqual({
      id: 'löw',
      name: 'Löwchen',
      groupId: 'g-herding',
      thumbUrl: 'https://images.example.com/thumb.webp',
      sizeBand: 'large',
      coatCategory: 'medium',
      hypoallergenic: false,
      goodWithChildren: 5,
      goodWithDogs: 3,
      goodWithStrangers: 2,
      searchText: 'lowchen little lion dog',
    });
  });

  it('has no thumbnail when the breed has no images', () => {
    expect(toListItem(toBreed(breedResource('none', { images: [] }))).thumbUrl).toBeNull();
  });
});

describe('toGroup', () => {
  it('adds a short label', () => {
    const group = toGroup(groupResourceSchema.parse(rawGroup('g', 'Toy Group')));
    expect(group).toEqual({ id: 'g', name: 'Toy Group', label: 'Toy' });
  });
});
