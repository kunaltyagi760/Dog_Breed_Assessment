import { useCallback, useEffect, useState } from 'react';

import { getBreedRepository } from '@/db/database';
import { imageCache } from '@/images';
import { useBreedStore } from '@/store/breedStore';
import { hydrateStore } from '@/sync/hydrate';

/** Opens the database and loads cached breeds before the first screen renders. */
export function useHydration() {
  const hydrated = useBreedStore((state) => state.hydrated);
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // A broken image index only costs offline photos, so it must not block the app.
    const cacheReady = imageCache.init().catch(() => undefined);
    getBreedRepository()
      .then(async (repo) => {
        // The image index has to be loaded before rows render, or every row
        // would think its thumbnail is missing and download it again.
        await cacheReady;
        await hydrateStore(repo);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setError(null);
    setAttempt((value) => value + 1);
  }, []);

  return { hydrated, error, retry };
}
