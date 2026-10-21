import { z } from 'zod';

import { breedResourceSchema, type BreedResource } from '@/api/schemas';
import { COAT_CATEGORIES, SIZE_BANDS, type BreedListItem } from '@/domain/types';

import { EMPTY_SYNC_META, type BreedRecord, type SyncMeta } from './repository';

// SQLite hands rows back untyped, so they're validated on the way out too.
export const listRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  group_id: z.string().nullable(),
  thumb_url: z.string().nullable(),
  size_band: z.enum(SIZE_BANDS).nullable(),
  coat_category: z.enum(COAT_CATEGORIES),
  hypoallergenic: z.number(),
  good_with_children: z.number().nullable(),
  good_with_dogs: z.number().nullable(),
  good_with_strangers: z.number().nullable(),
  search_text: z.string(),
});

export type ListRow = z.infer<typeof listRowSchema>;

export const LIST_COLUMNS = Object.keys(listRowSchema.shape).join(', ');

export function rowToListItem(row: ListRow): BreedListItem {
  return {
    id: row.id,
    name: row.name,
    groupId: row.group_id,
    thumbUrl: row.thumb_url,
    sizeBand: row.size_band,
    coatCategory: row.coat_category,
    hypoallergenic: row.hypoallergenic === 1,
    goodWithChildren: row.good_with_children,
    goodWithDogs: row.good_with_dogs,
    goodWithStrangers: row.good_with_strangers,
    searchText: row.search_text,
  };
}

export function recordToParams({ resource, item }: BreedRecord, syncedAt: number) {
  return {
    $id: item.id,
    $name: item.name,
    $group_id: item.groupId,
    $thumb_url: item.thumbUrl,
    $size_band: item.sizeBand,
    $coat_category: item.coatCategory,
    $hypoallergenic: item.hypoallergenic ? 1 : 0,
    $good_with_children: item.goodWithChildren,
    $good_with_dogs: item.goodWithDogs,
    $good_with_strangers: item.goodWithStrangers,
    $search_text: item.searchText,
    $payload: JSON.stringify(resource),
    $synced_at: syncedAt,
  };
}

const syncMetaSchema = z.object({
  lastSyncedAt: z.number().nullable(),
  lastAttemptAt: z.number().nullable(),
  failedPages: z.array(z.number()),
  lastError: z.string().nullable(),
});

export function parseSyncMeta(value: string | null | undefined): SyncMeta {
  if (!value) return EMPTY_SYNC_META;
  try {
    const result = syncMetaSchema.safeParse(JSON.parse(value));
    return result.success ? result.data : EMPTY_SYNC_META;
  } catch {
    return EMPTY_SYNC_META;
  }
}

// The payload is the API record as it was validated on the way in. It's checked
// again on read, so a schema change can't let an old row crash the detail screen.
export function parseBreedPayload(payload: string): BreedResource | null {
  try {
    const result = breedResourceSchema.safeParse(JSON.parse(payload));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
