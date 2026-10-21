import {
  activeFilterCount,
  createBreedMatcher,
  DEFAULT_FILTERS,
  searchTokens,
  type BreedFilters,
} from '@/domain/filters';

import { listItem } from '../helpers/fixtures';

const breeds = [
  listItem('Beagle', { groupId: 'hound', sizeBand: 'small', searchText: 'beagle english beagle' }),
  listItem('Poodle', {
    groupId: 'non-sporting',
    sizeBand: 'large',
    coatCategory: 'long',
    hypoallergenic: true,
    goodWithStrangers: 5,
  }),
  listItem('Airedale', { groupId: 'terrier', coatCategory: 'wire', goodWithChildren: 5 }),
  listItem('Mystery', { groupId: null, sizeBand: null, coatCategory: 'unknown' }),
];

const run = (filters: Partial<BreedFilters> = {}, query = '') => {
  const matches = createBreedMatcher({ ...DEFAULT_FILTERS, ...filters }, query);
  return breeds.filter(matches).map((breed) => breed.id);
};

describe('createBreedMatcher', () => {
  it('returns everything with no filters', () => {
    expect(run()).toHaveLength(4);
  });

  it('searches names and other names, ignoring case and accents', () => {
    expect(run({}, 'POOD')).toEqual(['Poodle']);
    expect(run({}, 'english')).toEqual(['Beagle']);
  });

  it('requires every search word to match', () => {
    expect(run({}, 'english beagle')).toEqual(['Beagle']);
    expect(run({}, 'english poodle')).toEqual([]);
  });

  it('ORs options within one filter', () => {
    expect(run({ groupIds: ['hound', 'terrier'] })).toEqual(['Beagle', 'Airedale']);
  });

  it('ANDs different filters', () => {
    expect(run({ groupIds: ['hound', 'terrier'], sizes: ['small'] })).toEqual(['Beagle']);
  });

  it('filters by coat category, including wire', () => {
    expect(run({ coats: ['wire'] })).toEqual(['Airedale']);
  });

  it('excludes breeds with no data only when that filter is active', () => {
    expect(run({ sizes: ['medium'] })).toEqual(['Airedale']);
    expect(run({ groupIds: ['hound'] })).not.toContain('Mystery');
    expect(run()).toContain('Mystery');
  });

  it('handles hypoallergenic yes and no', () => {
    expect(run({ hypoallergenic: 'yes' })).toEqual(['Poodle']);
    expect(run({ hypoallergenic: 'no' })).toEqual(['Beagle', 'Airedale', 'Mystery']);
  });

  it('applies trait thresholds as a minimum score', () => {
    expect(
      run({ minScores: { goodWithChildren: 4, goodWithDogs: 0, goodWithStrangers: 0 } }),
    ).toEqual(['Airedale']);
    expect(
      run({ minScores: { goodWithChildren: 0, goodWithDogs: 0, goodWithStrangers: 5 } }),
    ).toEqual(['Poodle']);
  });

  it('treats a missing trait score as not meeting a threshold', () => {
    const matches = createBreedMatcher(
      {
        ...DEFAULT_FILTERS,
        minScores: { goodWithChildren: 2, goodWithDogs: 0, goodWithStrangers: 0 },
      },
      '',
    );
    expect(matches(listItem('x', { goodWithChildren: null }))).toBe(false);
  });
});

describe('searchTokens', () => {
  it('splits on whitespace and drops empties', () => {
    expect(searchTokens('  Great   Dane ')).toEqual(['great', 'dane']);
    expect(searchTokens('   ')).toEqual([]);
  });
});

describe('activeFilterCount', () => {
  it('counts each selected chip but not the search', () => {
    expect(activeFilterCount(DEFAULT_FILTERS)).toBe(0);
    expect(
      activeFilterCount({
        groupIds: ['a', 'b'],
        sizes: ['small'],
        coats: [],
        hypoallergenic: 'yes',
        minScores: { goodWithChildren: 3, goodWithDogs: 0, goodWithStrangers: 0 },
      }),
    ).toBe(5);
  });
});
