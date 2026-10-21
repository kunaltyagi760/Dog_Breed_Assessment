import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { createDogApi, type DogApi } from '@/api/dogApi';
import type { BreedRepository } from '@/db/repository';
import { toBreed, toListItem } from '@/domain/normalize';
import { useBreedDetail } from '@/features/breedDetail/useBreedDetail';
import { useBreedStore } from '@/store/breedStore';

import { createFakeServer } from '../helpers/fakeServer';
import { breedResource, rawBreed } from '../helpers/fixtures';
import { createMemoryRepository } from '../helpers/memoryRepository';

const mockRepo: { current: BreedRepository | null } = { current: null };
const mockApi: { current: DogApi | null } = { current: null };

jest.mock('@/db/database', () => ({
  getBreedRepository: async () => mockRepo.current,
}));
jest.mock('@/api/client', () => ({
  get dogApi() {
    return mockApi.current;
  },
}));

function setup(serverBreeds: unknown[] = []) {
  const server = createFakeServer(serverBreeds);
  const memory = createMemoryRepository();
  mockRepo.current = memory.repo;
  mockApi.current = createDogApi({ baseUrl: 'https://api.test', fetchFn: server.fetchFn });

  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { server, memory, wrapper };
}

describe('useBreedDetail', () => {
  afterEach(() => onlineManager.setOnline(true));

  it('shows the saved copy, then swaps in the fresh one from the API', async () => {
    const { memory, wrapper } = setup([rawBreed('gsd', { name: 'Fresh name' })]);
    const saved = breedResource('gsd', { name: 'Saved name' });
    memory.seedBreed(toListItem(toBreed(saved)), 1, saved);

    const { result } = await renderHook(() => useBreedDetail('gsd'), { wrapper });

    await waitFor(() => expect(result.current.breed?.name).toBe('Fresh name'));
    expect(result.current.status).toBe('ready');
    expect(useBreedStore.getState().breeds.byId.gsd?.name).toBe('Fresh name');
  });

  it('loads a breed that was never saved', async () => {
    const { wrapper } = setup([rawBreed('new', { name: 'Brand New' })]);

    const { result } = await renderHook(() => useBreedDetail('new'), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.breed?.name).toBe('Brand New');
  });

  it('reports a breed the API no longer has', async () => {
    const { wrapper } = setup([]);

    const { result } = await renderHook(() => useBreedDetail('gone'), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('missing'));
  });

  it('keeps the saved copy when the refresh fails', async () => {
    const { server, memory, wrapper } = setup([]);
    const saved = breedResource('gsd', { name: 'Saved name' });
    memory.seedBreed(toListItem(toBreed(saved)), 1, saved);
    server.failBreed('gsd', 404);

    const { result } = await renderHook(() => useBreedDetail('gsd'), { wrapper });

    await waitFor(() => expect(result.current.breed?.name).toBe('Saved name'));
    expect(result.current.status).toBe('ready');
  });

  it('shows the saved copy while offline', async () => {
    onlineManager.setOnline(false);
    const { memory, wrapper } = setup([]);
    const saved = breedResource('gsd', { name: 'Saved name' });
    memory.seedBreed(toListItem(toBreed(saved)), 1, saved);

    const { result } = await renderHook(() => useBreedDetail('gsd'), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.breed?.name).toBe('Saved name');
  });

  it('says so when offline and nothing is saved', async () => {
    onlineManager.setOnline(false);
    const { wrapper } = setup([rawBreed('new')]);

    const { result } = await renderHook(() => useBreedDetail('new'), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('offline'));
  });
});
