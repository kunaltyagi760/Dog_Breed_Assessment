import type { BreedListItem, Group } from './types';

export type BreedSectionRow =
  | { type: 'header'; key: string; title: string; count: number }
  | { type: 'breed'; key: string; id: string };

const OTHER_KEY = 'other';

/**
 * Flattens breeds into one list of group headers and breed rows, which is the
 * shape FlashList needs for sticky headers. Groups are sorted by label; breeds
 * keep their incoming (alphabetical) order. Breeds without a known group go
 * into a trailing "Other" section.
 */
export function buildSections(
  items: readonly BreedListItem[],
  groupsById: Readonly<Record<string, Group>>,
): { rows: BreedSectionRow[]; stickyIndices: number[] } {
  const buckets = new Map<string, string[]>();
  for (const item of items) {
    const key = item.groupId && groupsById[item.groupId] ? item.groupId : OTHER_KEY;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(item.id);
    else buckets.set(key, [item.id]);
  }

  const sections = [...buckets.entries()]
    .map(([key, ids]) => ({ key, ids, title: groupsById[key]?.label ?? 'Other' }))
    .sort((a, b) => {
      if (a.key === OTHER_KEY) return 1;
      if (b.key === OTHER_KEY) return -1;
      return a.title.localeCompare(b.title);
    });

  const rows: BreedSectionRow[] = [];
  const stickyIndices: number[] = [];
  for (const section of sections) {
    stickyIndices.push(rows.length);
    rows.push({
      type: 'header',
      key: `group:${section.key}`,
      title: section.title,
      count: section.ids.length,
    });
    for (const id of section.ids) rows.push({ type: 'breed', key: id, id });
  }

  return { rows, stickyIndices };
}
