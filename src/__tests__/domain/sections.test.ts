import { buildSections } from '@/domain/sections';
import type { Group } from '@/domain/types';

import { listItem } from '../helpers/fixtures';

const groups: Record<string, Group> = {
  toy: { id: 'toy', name: 'Toy Group', label: 'Toy' },
  hound: { id: 'hound', name: 'Hound Group', label: 'Hound' },
};

describe('buildSections', () => {
  it('groups breeds under headers sorted by group label', () => {
    const { rows } = buildSections(
      [
        listItem('Afghan', { groupId: 'hound' }),
        listItem('Chihuahua', { groupId: 'toy' }),
        listItem('Pug', { groupId: 'toy' }),
      ],
      groups,
    );

    expect(rows).toEqual([
      { type: 'header', key: 'group:hound', title: 'Hound', count: 1 },
      { type: 'breed', key: 'Afghan', id: 'Afghan' },
      { type: 'header', key: 'group:toy', title: 'Toy', count: 2 },
      { type: 'breed', key: 'Chihuahua', id: 'Chihuahua' },
      { type: 'breed', key: 'Pug', id: 'Pug' },
    ]);
  });

  it('returns the header positions for sticky headers', () => {
    const { stickyIndices } = buildSections(
      [listItem('A', { groupId: 'hound' }), listItem('B', { groupId: 'toy' })],
      groups,
    );
    expect(stickyIndices).toEqual([0, 2]);
  });

  it('puts breeds with a missing or unknown group in a trailing Other section', () => {
    const { rows } = buildSections(
      [
        listItem('Lost', { groupId: null }),
        listItem('Stray', { groupId: 'not-a-group' }),
        listItem('Pug', { groupId: 'toy' }),
      ],
      groups,
    );

    expect(rows.at(-3)).toMatchObject({ type: 'header', title: 'Other', count: 2 });
  });

  it('skips groups with no matching breeds', () => {
    const { rows } = buildSections([listItem('Pug', { groupId: 'toy' })], groups);
    expect(rows.filter((row) => row.type === 'header')).toHaveLength(1);
  });

  it('handles an empty list', () => {
    expect(buildSections([], groups)).toEqual({ rows: [], stickyIndices: [] });
  });
});
