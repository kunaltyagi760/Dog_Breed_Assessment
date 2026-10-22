import { thumbnailUrls } from '@/images/useThumbnailPrefetch';
import { normalize } from '@/store/breedStore';

import { listItem } from '../helpers/fixtures';

describe('thumbnailUrls', () => {
  it('lists every thumbnail in list order, skipping breeds without one', () => {
    const breeds = normalize([
      listItem('a', { thumbUrl: 'https://x/a.webp' }),
      listItem('b', { thumbUrl: null }),
      listItem('c', { thumbUrl: 'https://x/c.webp' }),
    ]);
    expect(thumbnailUrls(breeds)).toEqual(['https://x/a.webp', 'https://x/c.webp']);
  });
});
