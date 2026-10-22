import { Image, type ImageContentFit } from 'expo-image';
import { memo } from 'react';
import type { StyleProp, ImageStyle } from 'react-native';

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
 * expo-image backed by our own disk cache. Files on disk are already ours, so
 * expo-image only keeps decoded images in memory (no second copy on disk).
 * The style's background shows through as the placeholder while downloading.
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
      cachePolicy="memory"
      contentFit={contentFit}
      transition={150}
      recyclingKey={recyclingKey}
      onError={onError}
      style={style}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

export const CachedImage = memo(CachedImageBase);
