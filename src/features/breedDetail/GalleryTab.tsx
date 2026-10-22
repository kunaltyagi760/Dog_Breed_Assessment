import { memo, useCallback, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText, StateMessage } from '@/components';
import type { Breed } from '@/domain/types';
import { spacing } from '@/theme';

import { ImagePager } from './ImagePager';
import { ImageViewer } from './ImageViewer';
import { PhotoCredit } from './PhotoCredit';
import { TabScrollView } from './TabScrollView';

type Props = { breed: Breed };

function GalleryTabBase({ breed }: Props) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const images = breed.images;
  // A background refresh can bring back fewer photos than were there when swiping started.
  const position = Math.min(index, Math.max(images.length - 1, 0));
  const current = images[position];

  const closeViewer = useCallback(() => setViewerIndex(null), []);

  if (images.length === 0) {
    return <StateMessage title="No photos yet" message="This breed doesn't have any images." />;
  }

  return (
    <>
      <TabScrollView padded={false}>
        <ImagePager
          images={images}
          variant="medium"
          width={width}
          height={width * 0.75}
          contentFit="cover"
          onIndexChange={setIndex}
          onPressImage={setViewerIndex}
        />

        <View style={styles.info}>
          <AppText variant="subtitle">
            {position + 1} of {images.length}
          </AppText>
          {current ? <PhotoCredit attribution={current.attribution} /> : null}
          <AppText variant="caption" tone="muted">
            Swipe for more photos. Tap a photo to see it full size.
          </AppText>
        </View>
      </TabScrollView>

      {viewerIndex !== null ? (
        <ImageViewer images={images} initialIndex={viewerIndex} onClose={closeViewer} />
      ) : null}
    </>
  );
}

export const GalleryTab = memo(GalleryTabBase);

const styles = StyleSheet.create({
  info: { padding: spacing.lg, gap: spacing.sm },
});
