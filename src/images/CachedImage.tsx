import { Image, type ImageContentFit } from 'expo-image';
import { memo } from 'react';
import type { ImageStyle, StyleProp } from 'react-native';

import { useCachedImage } from './useCachedImage';

type Props = {
  url: string | null;
  /** Pinned images are kept regardless of the cache budget (list thumbnails). */
  pinned?: boolean;
  style: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
  recyclingKey?: string;
  accessibilityLabel?: string;
};

/**
 * expo-image backed by our own disk cache. Because files come from that cache,
 * expo-image keeps no cache of its own: images are decoded from the local file
 * when shown and released when their view goes away, which keeps memory flat no
 * matter how much of the list or how many galleries have been viewed.
 * Thumbnails skip the fade so a recycled list row doesn't flicker; the style's
 * background shows through as the placeholder while a file downloads.
 */
function CachedImageBase({
  url,
  pinned,
  style,
  contentFit = 'cover',
  recyclingKey,
  accessibilityLabel,
}: Props) {
  const { uri, onError } = useCachedImage(url, { pinned });

  return (
    <Image
      source={uri}
      cachePolicy="none"
      contentFit={contentFit}
      transition={pinned ? 0 : 150}
      recyclingKey={recyclingKey}
      onError={onError}
      style={style}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

export const CachedImage = memo(CachedImageBase);
