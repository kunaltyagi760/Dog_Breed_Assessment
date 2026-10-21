import type { BreedRepository } from '@/db/repository';
import { useBreedStore } from '@/store/breedStore';

/** Loads everything the list needs from SQLite into the in-memory store. */
export async function hydrateStore(repo: BreedRepository): Promise<void> {
  const [breeds, groups, syncMeta] = await Promise.all([
    repo.loadListItems(),
    repo.loadGroups(),
    repo.getSyncMeta(),
  ]);
  useBreedStore.getState().setSnapshot({ breeds, groups, syncMeta });
}
