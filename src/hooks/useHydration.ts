import { useCallback, useEffect, useState } from 'react';

import { getBreedRepository } from '@/db/database';
import { useBreedStore } from '@/store/breedStore';
import { hydrateStore } from '@/sync/hydrate';

/** Opens the database and loads cached breeds before the first screen renders. */
export function useHydration() {
  const hydrated = useBreedStore((state) => state.hydrated);
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getBreedRepository()
      .then(hydrateStore)
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
