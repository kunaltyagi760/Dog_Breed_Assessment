import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { useEffect } from 'react';

import { isMeteredConnection } from '@/api/nativeQueryEvents';
import type { BreedListItem } from '@/domain/types';
import { useIsOnline } from '@/hooks/useIsOnline';
import { useBreedStore, type Normalized } from '@/store/breedStore';

import { imageCache } from './index';

export function thumbnailUrls(breeds: Normalized<BreedListItem>): string[] {
  return breeds.allIds.flatMap((id) => {
    const url = breeds.byId[id]?.thumbUrl;
    return url ? [url] : [];
  });
}

/**
 * Downloads every list thumbnail in the background so the whole list works
 * offline, not just the rows someone happened to scroll past. Runs after
 * launch and after each sync, skips metered connections (cellular, hotspots),
 * and stops as soon as the device goes offline.
 */
export function useThumbnailPrefetch() {
  const hydrated = useBreedStore((state) => state.hydrated);
  const breeds = useBreedStore((state) => state.breeds);
  const isOnline = useIsOnline();

  useEffect(() => {
    const urls = thumbnailUrls(breeds);
    if (!hydrated || !isOnline || urls.length === 0) return;

    let cancelled = false;
    void (async () => {
      const network = await NetInfo.fetch();
      if (cancelled || isMeteredConnection(network)) return;
      await imageCache.releasePinnedExcept(new Set(urls));
      await imageCache.prefetchPinned(urls, {
        shouldContinue: () => !cancelled && onlineManager.isOnline(),
      });
    })().catch(() => {
      // Thumbnails also download one by one as rows appear, so this can fail quietly.
    });

    return () => {
      cancelled = true;
    };
  }, [hydrated, isOnline, breeds]);
}
