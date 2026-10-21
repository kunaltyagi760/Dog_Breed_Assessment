import type { BreedResource } from '@/api/schemas';
import type { BreedListItem, Group } from '@/domain/types';

export type SyncMeta = {
  /** When the last sync that fetched every page finished. */
  lastSyncedAt: number | null;
  lastAttemptAt: number | null;
  failedPages: number[];
  /** Set when the last attempt failed or only partly succeeded. */
  lastError: string | null;
};

export const EMPTY_SYNC_META: SyncMeta = {
  lastSyncedAt: null,
  lastAttemptAt: null,
  failedPages: [],
  lastError: null,
};

export type BreedRecord = {
  resource: BreedResource;
  item: BreedListItem;
};

export type BreedRepository = {
  saveGroups(groups: Group[]): Promise<void>;
  saveBreeds(records: BreedRecord[], syncedAt: number): Promise<void>;
  /** Removes breeds that weren't seen by the sync that started at `syncedAt`. */
  deleteBreedsSyncedBefore(syncedAt: number): Promise<void>;
  loadListItems(): Promise<BreedListItem[]>;
  /** The full validated API record for one breed, or null if it isn't cached. */
  loadBreed(id: string): Promise<BreedResource | null>;
  loadGroups(): Promise<Group[]>;
  getSyncMeta(): Promise<SyncMeta>;
  setSyncMeta(meta: SyncMeta): Promise<void>;
};
