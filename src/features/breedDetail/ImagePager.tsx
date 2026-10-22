import type { ImageContentFit } from 'expo-image';
import { useCallback } from 'react';
import {
  FlatList,
  Pressable,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import type { BreedImage } from '@/domain/types';
import { CachedImage } from '@/images/CachedImage';
import { useTheme } from '@/theme';

import { imageUrl, type ImageVariant } from './images';

type Props = {
  images: readonly BreedImage[];
  variant: ImageVariant;
  width: number;
  height: number;
  contentFit: ImageContentFit;
  initialIndex?: number;
  onIndexChange: (index: number) => void;
  onPressImage?: (index: number) => void;
};

const keyExtractor = (image: BreedImage) => image.id;

/** Horizontally swipeable, one-image-per-page photo strip. */
export function ImagePager({
  images,
  variant,
  width,
  height,
  contentFit,
  initialIndex = 0,
  onIndexChange,
  onPressImage,
}: Props) {
  const { colors } = useTheme();

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({ length: width, offset: width * index, index }),
    [width],
  );

  const onScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / width);
      onIndexChange(Math.max(0, Math.min(images.length - 1, index)));
    },
    [width, images.length, onIndexChange],
  );

  const renderItem: ListRenderItem<BreedImage> = useCallback(
    ({ item, index }) => (
      <Pressable
        disabled={!onPressImage}
        onPress={() => onPressImage?.(index)}
        accessibilityRole={onPressImage ? 'imagebutton' : 'image'}
        accessibilityLabel={`Photo ${index + 1} of ${images.length}`}
        accessibilityHint={onPressImage ? 'Opens the photo full screen' : undefined}
      >
        <CachedImage
          url={imageUrl(item, variant)}
          contentFit={contentFit}
          // A contained photo is letterboxed; a placeholder colour there reads as grey bars.
          style={{
            width,
            height,
            backgroundColor: contentFit === 'cover' ? colors.surfaceMuted : 'transparent',
          }}
        />
      </Pressable>
    ),
    [variant, contentFit, width, height, colors.surfaceMuted, images.length, onPressImage],
  );

  return (
    <FlatList
      data={images}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      getItemLayout={getItemLayout}
      initialScrollIndex={initialIndex}
      onMomentumScrollEnd={onScrollEnd}
      // Keep only the current photo and its neighbours mounted; full-size photos are heavy.
      initialNumToRender={1}
      maxToRenderPerBatch={2}
      windowSize={3}
    />
  );
}
