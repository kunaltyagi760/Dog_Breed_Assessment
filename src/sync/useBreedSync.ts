import { onlineManager, useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { createDogApi } from '@/api/dogApi';
import { env } from '@/config/env';
import { getBreedRepository } from '@/db/database';
import { useBreedStore } from '@/store/breedStore';

import { hydrateStore } from './hydrate';
import { syncBreeds } from './syncBreeds';

export const BREED_SYNC_KEY = ['breeds', 'sync'] as const;

const STALE_MS = env.staleAfterHours * 60 * 60 * 1000;
const api = createDogApi({ baseUrl: env.apiBaseUrl });

async function runSync() {
  const repo = await getBreedRepository();
  try {
    await syncBreeds({ api, repo, pageSize: env.pageSize });
  } finally {
    // Pages saved before a failure are still worth showing.
    await hydrateStore(repo);
  }
  return useBreedStore.getState().syncMeta;
}

/**
 * React Query decides *when* to sync; syncBreeds decides *how*.
 * The query is seeded with the persisted sync time, so a fresh launch only hits
 * the network when the data is older than STALE_MS. A failed or partial sync
 * makes it stale immediately, so reconnecting or reopening the app retries it.
 */
export function useBreedSync() {
  const initialMeta = useBreedStore((state) => state.syncMeta);

  const { isFetching, error, refetch } = useQuery({
    queryKey: BREED_SYNC_KEY,
    queryFn: runSync,
    initialData: initialMeta,
    initialDataUpdatedAt: initialMeta.lastSyncedAt ?? 0,
    staleTime: () => (useBreedStore.getState().syncMeta.lastError ? 0 : STALE_MS),
    // Each page already retries with backoff inside syncBreeds.
    retry: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });

  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    // Offline, React Query would park the request until reconnect and leave the
    // pull-to-refresh spinner hanging; the offline banner already explains why.
    if (!onlineManager.isOnline()) return;
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return { isSyncing: isFetching, error, refreshing, refresh };
}
