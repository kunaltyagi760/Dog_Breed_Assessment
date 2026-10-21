import type { DogApi } from '@/api/dogApi';
import { isRetryable } from '@/api/http';
import type { BreedRepository } from '@/db/repository';
import { toBreed, toListItem } from '@/domain/normalize';
import type { Breed, BreedListItem } from '@/domain/types';
import { withRetry, type RetryOptions } from '@/lib/retry';

type Deps = {
  api: DogApi;
  repo: BreedRepository;
  retry?: RetryOptions;
  now?: () => number;
};

/**
 * Fetches the latest copy of one breed and saves it, so the detail screen shows
 * fresh data even if the last full sync was hours ago. The list row is rebuilt
 * from the same record so the list and the detail screen never disagree.
 */
export async function refreshBreed(
  id: string,
  { api, repo, retry, now = Date.now }: Deps,
): Promise<{ breed: Breed; item: BreedListItem }> {
  const resource = await withRetry(() => api.getBreed(id), {
    retries: 2,
    shouldRetry: isRetryable,
    ...retry,
  });
  const breed = toBreed(resource);
  const item = toListItem(breed);
  await repo.saveBreeds([{ resource, item }], now());
  return { breed, item };
}
