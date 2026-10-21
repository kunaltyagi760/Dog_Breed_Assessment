import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { dogApi } from '@/api/client';
import { HttpError } from '@/api/http';
import { getBreedRepository } from '@/db/database';
import { toBreed } from '@/domain/normalize';
import type { Breed } from '@/domain/types';
import { useBreedStore } from '@/store/breedStore';
import { refreshBreed } from '@/sync/refreshBreed';

export const breedKeys = {
  saved: (id: string) => ['breed', id, 'saved'] as const,
  refresh: (id: string) => ['breed', id, 'refresh'] as const,
};

const REFRESH_STALE_MS = 10 * 60 * 1000;

export type DetailStatus = 'loading' | 'ready' | 'offline' | 'missing' | 'error';

async function loadSavedBreed(id: string): Promise<Breed | null> {
  const resource = await (await getBreedRepository()).loadBreed(id);
  return resource ? toBreed(resource) : null;
}

/**
 * Detail data comes from SQLite first, so the screen renders instantly and
 * works offline. A second query then asks the API for this one breed; when it
 * answers, the fresh copy is saved and swapped in. While offline that query
 * simply waits, and a failure just leaves the saved copy on screen.
 */
export function useBreedDetail(id: string) {
  const queryClient = useQueryClient();

  const saved = useQuery({
    queryKey: breedKeys.saved(id),
    queryFn: () => loadSavedBreed(id),
    staleTime: Infinity,
    // React Query pauses queries while offline by default; this one only reads SQLite.
    networkMode: 'always',
  });

  const refresh = useQuery({
    queryKey: breedKeys.refresh(id),
    queryFn: async () => {
      const { breed, item } = await refreshBreed(id, {
        api: dogApi,
        repo: await getBreedRepository(),
      });
      queryClient.setQueryData(breedKeys.saved(id), breed);
      useBreedStore.getState().upsertBreed(item);
      return Date.now();
    },
    staleTime: REFRESH_STALE_MS,
    // refreshBreed already retries with backoff.
    retry: false,
    // Only worth waiting for once we know whether a saved copy exists.
    enabled: saved.isSuccess,
  });

  const breed = saved.data ?? null;
  const { refetch: refetchSaved } = saved;
  const { refetch: refetchRemote } = refresh;
  const retry = useCallback(() => {
    void refetchSaved();
    void refetchRemote();
  }, [refetchSaved, refetchRemote]);

  // A saved copy always wins; the other states only matter when there isn't one.
  let status: DetailStatus = 'loading';
  if (breed) status = 'ready';
  else if (saved.isError) status = 'error';
  else if (refresh.isFetching) status = 'loading';
  else if (refresh.isPaused) status = 'offline';
  else if (refresh.error instanceof HttpError && refresh.error.status === 404) status = 'missing';
  else if (refresh.isError) status = 'error';

  return {
    breed,
    status,
    error: saved.error ?? refresh.error,
    retry,
  };
}
