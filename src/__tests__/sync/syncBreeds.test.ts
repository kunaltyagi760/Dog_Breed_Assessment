import { createDogApi } from '@/api/dogApi';
import { toBreed, toListItem } from '@/domain/normalize';
import { SyncFailedError, syncBreeds } from '@/sync/syncBreeds';

import { createFakeServer } from '../helpers/fakeServer';
import { breedResource, rawBreed } from '../helpers/fixtures';
import { createMemoryRepository } from '../helpers/memoryRepository';

const PAGE_SIZE = 4;
const noWait = { sleep: async () => {} };

function setup(breedCount = 10) {
  const breeds = Array.from({ length: breedCount }, (_, i) =>
    rawBreed(`b${String(i).padStart(2, '0')}`),
  );
  const server = createFakeServer(breeds);
  const memory = createMemoryRepository();
  let clock = 1_000;

  const run = () =>
    syncBreeds({
      api: createDogApi({ baseUrl: 'https://api.test', fetchFn: server.fetchFn }),
      repo: memory.repo,
      pageSize: PAGE_SIZE,
      retry: noWait,
      now: () => clock++,
    });

  return { server, memory, run, breeds };
}

describe('syncBreeds', () => {
  it('fetches every page and merges them into one dataset', async () => {
    const { memory, run, server } = setup(10);

    const result = await run();

    expect(result).toMatchObject({ status: 'complete', saved: 10, failedPages: [] });
    expect(memory.breedIds).toHaveLength(10);
    // 1 groups request + 3 pages of 4/4/2
    expect(server.requests).toHaveLength(4);
    expect(memory.meta.lastSyncedAt).not.toBeNull();
    expect(memory.meta.lastError).toBeNull();
  });

  it('saves groups with readable labels', async () => {
    const { memory, run } = setup(2);
    await run();
    expect(memory.groups.map((group) => group.label)).toEqual(['Herding', 'Toy']);
  });

  it('retries a flaky page and still completes', async () => {
    const { memory, run, server } = setup(10);
    server.failPage(2, 2);

    const result = await run();

    expect(result.status).toBe('complete');
    expect(memory.breedIds).toHaveLength(10);
  });

  it('keeps the pages that worked when one page keeps failing', async () => {
    const { memory, run, server } = setup(10);
    memory.seedMeta({ lastSyncedAt: 500, lastAttemptAt: 500, failedPages: [], lastError: null });
    server.failPage(2);

    const result = await run();

    expect(result).toMatchObject({ status: 'partial', failedPages: [2], saved: 6 });
    expect(memory.breedIds).toHaveLength(6);
    expect(memory.meta).toMatchObject({
      lastSyncedAt: 500,
      failedPages: [2],
      lastError: "1 of 3 pages couldn't be refreshed",
    });
  });

  it('does not delete cached breeds after a partial sync', async () => {
    const { memory, run, server } = setup(10);
    const stale = toListItem(toBreed(breedResource('gone')));
    memory.seedBreed(stale, 0);
    server.failPage(3);

    await run();

    expect(memory.breedIds).toContain('gone');
  });

  it('removes breeds that no longer exist after a full sync', async () => {
    const { memory, run } = setup(4);
    memory.seedBreed(toListItem(toBreed(breedResource('gone'))), 0);

    await run();

    expect(memory.breedIds).not.toContain('gone');
    expect(memory.breedIds).toHaveLength(4);
  });

  it('throws and records the error when the first page fails', async () => {
    const { memory, run, server } = setup(10);
    server.failPage(1);

    await expect(run()).rejects.toBeInstanceOf(SyncFailedError);
    expect(memory.breedIds).toHaveLength(0);
    expect(memory.meta.lastError).toBe('Request failed with status 503');
  });

  it('treats a groups failure as partial but still saves breeds', async () => {
    const { memory, run, server } = setup(5);
    server.failGroups();

    const result = await run();

    expect(result).toMatchObject({ status: 'partial', groupsFailed: true });
    expect(memory.breedIds).toHaveLength(5);
    expect(memory.meta.lastError).toBe("Breed groups couldn't be refreshed");
  });

  it('skips a malformed record without losing the rest of its page', async () => {
    const breeds = [rawBreed('ok-1'), { id: 'broken', attributes: { name: '' } }, rawBreed('ok-2')];
    const server = createFakeServer(breeds);
    const memory = createMemoryRepository();

    const result = await syncBreeds({
      api: createDogApi({ baseUrl: 'https://api.test', fetchFn: server.fetchFn }),
      repo: memory.repo,
      pageSize: PAGE_SIZE,
      retry: noWait,
    });

    expect(result).toMatchObject({ status: 'complete', saved: 2, skippedRecords: 1 });
    expect(memory.breedIds).toEqual(['ok-1', 'ok-2']);
  });

  it('flags a short count as partial instead of trusting it', async () => {
    const { memory, run, server } = setup(6);
    memory.seedBreed(toListItem(toBreed(breedResource('maybe-shifted'))), 0);
    server.reportTotal(8);

    const result = await run();

    expect(result.status).toBe('partial');
    expect(memory.breedIds).toContain('maybe-shifted');
  });
});
