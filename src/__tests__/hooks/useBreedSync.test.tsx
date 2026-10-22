import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { EMPTY_SYNC_META, type BreedRepository } from '@/db/repository';
import { useBreedStore } from '@/store/breedStore';
import { useBreedSync } from '@/sync/useBreedSync';

import { createMemoryRepository } from '../helpers/memoryRepository';

const mockRepo: { current: BreedRepository | null } = { current: null };
const mockSyncBreeds = jest.fn();

jest.mock('@/db/database', () => ({
  getBreedRepository: async () => mockRepo.current,
}));
jest.mock('@/sync/syncBreeds', () => ({
  syncBreeds: (...args: unknown[]) => mockSyncBreeds(...args),
}));

describe('useBreedSync', () => {
  it('joins a running sync on pull-to-refresh instead of starting a second one', async () => {
    mockRepo.current = createMemoryRepository().repo;
    useBreedStore.getState().setSnapshot({ breeds: [], groups: [], syncMeta: EMPTY_SYNC_META });

    let finishSync = () => {};
    mockSyncBreeds.mockImplementation(() => new Promise<void>((resolve) => (finishSync = resolve)));

    const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result } = await renderHook(() => useBreedSync(), { wrapper });

    // Never synced, so the launch sync starts straight away and stays pending.
    await waitFor(() => expect(mockSyncBreeds).toHaveBeenCalledTimes(1));

    let refreshed = false;
    await act(async () => {
      void result.current.refresh().then(() => (refreshed = true));
    });
    expect(mockSyncBreeds).toHaveBeenCalledTimes(1);

    await act(async () => finishSync());
    await waitFor(() => expect(refreshed).toBe(true));
    expect(mockSyncBreeds).toHaveBeenCalledTimes(1);
  });
});
