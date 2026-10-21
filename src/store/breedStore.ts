import { create } from 'zustand';

import { EMPTY_SYNC_META, type SyncMeta } from '@/db/repository';
import type { BreedListItem, Group } from '@/domain/types';

export type Normalized<T> = {
  byId: Record<string, T>;
  allIds: string[];
};

export function normalize<T extends { id: string }>(items: readonly T[]): Normalized<T> {
  const byId: Record<string, T> = {};
  const allIds: string[] = [];
  for (const item of items) {
    if (!(item.id in byId)) allIds.push(item.id);
    byId[item.id] = item;
  }
  return { byId, allIds };
}

export type BreedSnapshot = {
  breeds: BreedListItem[];
  groups: Group[];
  syncMeta: SyncMeta;
};

type BreedState = {
  breeds: Normalized<BreedListItem>;
  groups: Normalized<Group>;
  syncMeta: SyncMeta;
  hydrated: boolean;
  setSnapshot(snapshot: BreedSnapshot): void;
};

export const useBreedStore = create<BreedState>((set) => ({
  breeds: normalize([]),
  groups: normalize([]),
  syncMeta: EMPTY_SYNC_META,
  hydrated: false,
  setSnapshot: ({ breeds, groups, syncMeta }) =>
    set({ breeds: normalize(breeds), groups: normalize(groups), syncMeta, hydrated: true }),
}));
