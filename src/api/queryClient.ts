import { QueryClient } from '@tanstack/react-query';

import { backoffDelay } from '@/lib/backoff';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 3,
        retryDelay: (attempt) => backoffDelay(attempt),
        // SQLite is the source of truth, so the network copy can stay fresh for a while.
        staleTime: 5 * 60 * 1000,
        // The cached breed list is already in memory; refetching on every mount is wasteful.
        refetchOnMount: false,
      },
    },
  });
}
