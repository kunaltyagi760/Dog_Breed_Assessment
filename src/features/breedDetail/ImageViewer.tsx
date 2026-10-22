import { useState } from 'react';
import { Modal, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, IconButton } from '@/components';
import type { BreedImage } from '@/domain/types';
import { spacing, useTheme } from '@/theme';

import { ImagePager } from './ImagePager';
import { PhotoCredit } from './PhotoCredit';

type Props = {
  images: readonly BreedImage[];
  initialIndex: number;
  onClose: () => void;
};

/**
 * Full-screen photos, the one screen that asks for the `large` (1200px) variant.
 * Mount it only while open, so it always starts on the tapped photo.
 */
export function ImageViewer({ images, initialIndex, onClose }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(initialIndex);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const current = images[index];

  const onLayout = ({ nativeEvent }: LayoutChangeEvent) =>
    setSize({ width: nativeEvent.layout.width, height: nativeEvent.layout.height });

  return (
    // statusBarTranslucent: on Android the modal otherwise starts below the status
    // bar, and the inset padding below would add a second gap.
    <Modal visible animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View
        accessibilityViewIsModal
        style={[
          styles.screen,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <View style={styles.header}>
          <AppText variant="caption" tone="muted">
            {index + 1} / {images.length}
          </AppText>
          <IconButton icon="close" accessibilityLabel="Close photo" onPress={onClose} />
        </View>

        <View style={styles.pager} onLayout={onLayout}>
          {size ? (
            <ImagePager
              images={images}
              variant="large"
              width={size.width}
              height={size.height}
              contentFit="contain"
              initialIndex={initialIndex}
              onIndexChange={setIndex}
            />
          ) : null}
        </View>

        {current ? (
          <View style={styles.footer}>
            <PhotoCredit attribution={current.attribution} />
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  pager: { flex: 1 },
  footer: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
});
