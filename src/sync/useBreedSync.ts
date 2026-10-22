import { onlineManager, useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { dogApi } from '@/api/client';
import { env } from '@/config/env';
import { getBreedRepository } from '@/db/database';
import { useBreedStore } from '@/store/breedStore';

import { hydrateStore } from './hydrate';
import { shouldSyncOnReconnect } from './syncPolicy';
import { syncBreeds } from './syncBreeds';

const BREED_SYNC_KEY = ['breeds', 'sync'] as const;

const STALE_MS = env.staleAfterHours * 60 * 60 * 1000;
async function runSync() {
  const repo = await getBreedRepository();
  try {
    await syncBreeds({ api: dogApi, repo, pageSize: env.pageSize });
  } finally {
    // Pages saved before a failure are still worth showing.
    await hydrateStore(repo);
  }
  return useBreedStore.getState().syncMeta;
}

/**
 * React Query decides *when* to sync; syncBreeds decides *how*.
 * The query is seeded with the persisted sync time, so launching or returning
 * to the app only hits the network when the data is older than STALE_MS (or the
 * last sync failed). Reconnecting is different: the brief asks for a sync when
 * the network returns, so that happens regardless of age.
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
    refetchOnReconnect: () =>
      shouldSyncOnReconnect(useBreedStore.getState().syncMeta, Date.now()) ? 'always' : false,
    refetchOnWindowFocus: true,
  });

  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    // Offline, React Query would park the request until reconnect and leave the
    // pull-to-refresh spinner hanging; the offline banner already explains why.
    if (!onlineManager.isOnline()) return;
    setRefreshing(true);
    try {
      // Join a sync that's already running instead of starting a second one next to it.
      await refetch({ cancelRefetch: false });
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return { isSyncing: isFetching, error, refreshing, refresh };
}
