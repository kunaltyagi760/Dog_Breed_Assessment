import { QueryClient } from '@tanstack/react-query';

import { backoffDelay } from '@/lib/backoff';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 3,
        retryDelay: (attempt) => backoffDelay(attempt),
      },
    },
  });
}
