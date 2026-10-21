import { DEFAULT_FILTERS } from '@/domain/filters';
import { useFilterStore } from '@/store/filterStore';

const store = () => useFilterStore.getState();

describe('useFilterStore', () => {
  beforeEach(() => store().reset());

  it('toggles multi-select options on and off', () => {
    store().toggleGroup('toy');
    store().toggleGroup('hound');
    expect(store().filters.groupIds).toEqual(['toy', 'hound']);

    store().toggleGroup('toy');
    expect(store().filters.groupIds).toEqual(['hound']);
  });

  it('sets single-choice filters', () => {
    store().setHypoallergenic('yes');
    store().setMinScore('goodWithDogs', 4);

    expect(store().filters.hypoallergenic).toBe('yes');
    expect(store().filters.minScores).toEqual({
      goodWithChildren: 0,
      goodWithDogs: 4,
      goodWithStrangers: 0,
    });
  });

  it('keeps the filters object stable while typing a search', () => {
    const before = store().filters;
    store().setQuery('bea');
    expect(store().filters).toBe(before);
  });

  it('clearFilters keeps the search; reset clears both', () => {
    store().setQuery('poodle');
    store().toggleSize('small');

    store().clearFilters();
    expect(store().filters).toEqual(DEFAULT_FILTERS);
    expect(store().query).toBe('poodle');

    store().reset();
    expect(store().query).toBe('');
  });
});
