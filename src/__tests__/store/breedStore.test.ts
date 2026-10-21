import { EMPTY_SYNC_META } from '@/db/repository';
import { normalize, useBreedStore } from '@/store/breedStore';

import { listItem } from '../helpers/fixtures';

// Each test starts from a brand-new store, whatever order the tests run in.
const initialState = useBreedStore.getState();
beforeEach(() => useBreedStore.setState(initialState, true));

describe('normalize', () => {
  it('indexes by id and keeps the original order', () => {
    const result = normalize([
      { id: 'b', name: 'B' },
      { id: 'a', name: 'A' },
    ]);
    expect(result.allIds).toEqual(['b', 'a']);
    expect(result.byId.a).toEqual({ id: 'a', name: 'A' });
  });

  it('keeps one entry per id, with the latest value', () => {
    const result = normalize([
      { id: 'a', v: 1 },
      { id: 'a', v: 2 },
    ]);
    expect(result.allIds).toEqual(['a']);
    expect(result.byId.a?.v).toBe(2);
  });
});

describe('useBreedStore', () => {
  it('marks itself hydrated once a snapshot is set', () => {
    expect(useBreedStore.getState().hydrated).toBe(false);

    useBreedStore.getState().setSnapshot({
      breeds: [],
      groups: [{ id: 'g', name: 'Toy Group', label: 'Toy' }],
      syncMeta: EMPTY_SYNC_META,
    });

    const state = useBreedStore.getState();
    expect(state.hydrated).toBe(true);
    expect(state.groups.byId.g?.label).toBe('Toy');
  });
});

describe('upsertBreed', () => {
  beforeEach(() => {
    useBreedStore.getState().setSnapshot({
      breeds: [listItem('Akita'), listItem('Pug')],
      groups: [],
      syncMeta: EMPTY_SYNC_META,
    });
  });

  it('replaces an existing breed without reordering', () => {
    useBreedStore.getState().upsertBreed(listItem('Pug', { name: 'Pug', hypoallergenic: true }));

    const { breeds } = useBreedStore.getState();
    expect(breeds.allIds).toEqual(['Akita', 'Pug']);
    expect(breeds.byId.Pug?.hypoallergenic).toBe(true);
  });

  it('inserts a new breed in name order', () => {
    useBreedStore.getState().upsertBreed(listItem('Beagle'));
    expect(useBreedStore.getState().breeds.allIds).toEqual(['Akita', 'Beagle', 'Pug']);
  });
});
