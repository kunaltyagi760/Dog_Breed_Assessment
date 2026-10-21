import { createDogApi } from '@/api/dogApi';
import { HttpError } from '@/api/http';
import { refreshBreed } from '@/sync/refreshBreed';

import { createFakeServer } from '../helpers/fakeServer';
import { rawBreed } from '../helpers/fixtures';
import { createMemoryRepository } from '../helpers/memoryRepository';

const noWait = { sleep: async () => {} };

function setup() {
  const server = createFakeServer([rawBreed('gsd', { name: 'German Shepherd Dog' })]);
  const memory = createMemoryRepository();
  const deps = {
    api: createDogApi({ baseUrl: 'https://api.test', fetchFn: server.fetchFn }),
    repo: memory.repo,
    retry: noWait,
    now: () => 5_000,
  };
  return { server, memory, deps };
}

describe('refreshBreed', () => {
  it('returns the fresh breed and saves it with its list row', async () => {
    const { memory, deps } = setup();

    const { breed, item } = await refreshBreed('gsd', deps);

    expect(breed.name).toBe('German Shepherd Dog');
    expect(item).toMatchObject({ id: 'gsd', name: 'German Shepherd Dog' });
    expect((await memory.repo.loadBreed('gsd'))?.attributes.name).toBe('German Shepherd Dog');
    expect(memory.syncedAtOf('gsd')).toBe(5_000);
  });

  it('picks up changes made since the last full sync', async () => {
    const { server, memory, deps } = setup();
    server.setBreed('gsd', rawBreed('gsd', { name: 'German Shepherd', hypoallergenic: true }));

    const { item } = await refreshBreed('gsd', deps);

    expect(item.hypoallergenic).toBe(true);
    expect((await memory.repo.loadListItems())[0]?.name).toBe('German Shepherd');
  });

  it('does not retry or save anything on a 404', async () => {
    const { server, memory, deps } = setup();
    server.failBreed('gsd', 404);

    await expect(refreshBreed('gsd', deps)).rejects.toBeInstanceOf(HttpError);
    expect(server.requests).toHaveLength(1);
    expect(memory.breedIds).toEqual([]);
  });

  it('retries server errors', async () => {
    const { server, deps } = setup();
    server.failBreed('gsd', 503);

    await expect(refreshBreed('gsd', deps)).rejects.toMatchObject({ status: 503 });
    expect(server.requests).toHaveLength(3);
  });
});
