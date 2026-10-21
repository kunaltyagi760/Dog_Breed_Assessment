import type { BreedResource } from '@/api/schemas';
import { EMPTY_SYNC_META, type BreedRepository, type SyncMeta } from '@/db/repository';
import type { BreedListItem, Group } from '@/domain/types';

/** BreedRepository backed by plain maps, for testing the sync engine without SQLite. */
export function createMemoryRepository() {
  const breeds = new Map<
    string,
    { item: BreedListItem; resource: BreedResource | null; syncedAt: number }
  >();
  let groups: Group[] = [];
  let meta: SyncMeta = EMPTY_SYNC_META;

  const repo: BreedRepository = {
    async saveGroups(next) {
      groups = next;
    },
    async saveBreeds(records, syncedAt) {
      for (const { item, resource } of records) breeds.set(item.id, { item, resource, syncedAt });
    },
    async deleteBreedsSyncedBefore(syncedAt) {
      for (const [id, entry] of breeds) {
        if (entry.syncedAt < syncedAt) breeds.delete(id);
      }
    },
    async loadListItems() {
      return [...breeds.values()].map((entry) => entry.item);
    },
    async loadBreed(id) {
      return breeds.get(id)?.resource ?? null;
    },
    async loadGroups() {
      return groups;
    },
    async getSyncMeta() {
      return meta;
    },
    async setSyncMeta(next) {
      meta = next;
    },
  };

  return {
    repo,
    seedBreed(item: BreedListItem, syncedAt: number, resource: BreedResource | null = null) {
      breeds.set(item.id, { item, resource, syncedAt });
    },
    syncedAtOf(id: string) {
      return breeds.get(id)?.syncedAt;
    },
    seedMeta(next: SyncMeta) {
      meta = next;
    },
    get breedIds() {
      return [...breeds.keys()].sort();
    },
    get groups() {
      return groups;
    },
    get meta() {
      return meta;
    },
  };
}
