import type { BreedsPage, DogApi } from '@/api/dogApi';
import { isRetryable } from '@/api/http';
import type { BreedRecord, BreedRepository, SyncMeta } from '@/db/repository';
import { toBreed, toGroup, toListItem } from '@/domain/normalize';
import { mapSettledWithLimit } from '@/lib/concurrency';
import { withRetry, type RetryOptions } from '@/lib/retry';

export type SyncResult = {
  status: 'complete' | 'partial';
  saved: number;
  totalRecords: number | null;
  failedPages: number[];
  groupsFailed: boolean;
  skippedRecords: number;
};

export class SyncFailedError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'SyncFailedError';
  }
}

type SyncDeps = {
  api: DogApi;
  repo: BreedRepository;
  pageSize: number;
  concurrency?: number;
  retry?: RetryOptions;
  now?: () => number;
};

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Unknown error');

function toRecords(page: BreedsPage): BreedRecord[] {
  return page.breeds.map((resource) => ({ resource, item: toListItem(toBreed(resource)) }));
}

function describePartial(result: SyncResult, totalPages: number): string {
  if (result.failedPages.length) {
    return `${result.failedPages.length} of ${totalPages} pages couldn't be refreshed`;
  }
  if (result.groupsFailed) return "Breed groups couldn't be refreshed";
  return 'Some breeds were missing from the response';
}

/**
 * Fetches every breed page and writes each one to the repository as it arrives.
 * Page 1 tells us how many pages exist; the rest are fetched a few at a time,
 * each with its own retries, so one bad page doesn't cost the others.
 * Throws SyncFailedError only when nothing could be fetched.
 */
export async function syncBreeds({
  api,
  repo,
  pageSize,
  concurrency = 3,
  retry,
  now = Date.now,
}: SyncDeps): Promise<SyncResult> {
  const startedAt = now();
  const previous = await repo.getSyncMeta();
  const retrying = <T>(task: () => Promise<T>) =>
    withRetry(task, { shouldRetry: isRetryable, ...retry });

  const [groupsResult, firstResult] = await Promise.allSettled([
    retrying(() => api.getGroups()),
    retrying(() => api.getBreedsPage(1, pageSize)),
  ]);

  if (firstResult.status === 'rejected') {
    const message = errorMessage(firstResult.reason);
    await repo.setSyncMeta({ ...previous, lastAttemptAt: startedAt, lastError: message });
    throw new SyncFailedError(message, { cause: firstResult.reason });
  }

  const groupsFailed = groupsResult.status === 'rejected';
  if (groupsResult.status === 'fulfilled') {
    await repo.saveGroups(groupsResult.value.map(toGroup));
  }

  const firstPage = firstResult.value;
  const seenIds = new Set<string>();
  let skippedRecords = 0;

  const store = async (page: BreedsPage) => {
    const records = toRecords(page);
    await repo.saveBreeds(records, startedAt);
    records.forEach(({ item }) => seenIds.add(item.id));
    skippedRecords += page.invalid;
  };

  await store(firstPage);

  const remainingPages = Array.from({ length: firstPage.lastPage - 1 }, (_, i) => i + 2);
  const settled = await mapSettledWithLimit(remainingPages, concurrency, async (page) =>
    store(await retrying(() => api.getBreedsPage(page, pageSize))),
  );
  const failedPages = remainingPages.filter((_, i) => settled[i]?.status === 'rejected');

  // Records can shift between pages if the dataset changes mid-sync. If the
  // count comes up short, keep what we have and try again next time.
  const { totalRecords } = firstPage;
  const countMatches = totalRecords == null || seenIds.size + skippedRecords >= totalRecords;
  const allBreedsFetched = failedPages.length === 0 && countMatches;

  // Only a full pass can tell which cached breeds no longer exist.
  if (allBreedsFetched) await repo.deleteBreedsSyncedBefore(startedAt);

  const result: SyncResult = {
    status: allBreedsFetched && !groupsFailed ? 'complete' : 'partial',
    saved: seenIds.size,
    totalRecords,
    failedPages,
    groupsFailed,
    skippedRecords,
  };

  const finishedAt = now();
  const meta: SyncMeta =
    result.status === 'complete'
      ? { lastSyncedAt: finishedAt, lastAttemptAt: finishedAt, failedPages: [], lastError: null }
      : {
          lastSyncedAt: previous.lastSyncedAt,
          lastAttemptAt: finishedAt,
          failedPages,
          lastError: describePartial(result, firstPage.lastPage),
        };
  await repo.setSyncMeta(meta);

  return result;
}
