import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components';
import { breedSummary } from '@/domain/labels';
import { useBreedStore } from '@/store/breedStore';
import { radius, spacing, useTheme } from '@/theme';

type Props = {
  id: string;
  onPress: (id: string) => void;
};

const THUMB_SIZE = 56;

// Each row subscribes to its own breed, so a store update only re-renders rows that changed.
function BreedRowBase({ id, onPress }: Props) {
  const { colors } = useTheme();
  const breed = useBreedStore((state) => state.breeds.byId[id]);

  if (!breed) return null;
  const summary = breedSummary(breed);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={summary ? `${breed.name}, ${summary}` : breed.name}
      onPress={() => onPress(id)}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.border },
        pressed && { backgroundColor: colors.surfaceMuted },
      ]}
    >
      <Image
        source={breed.thumbUrl}
        // Without this a recycled cell briefly shows the previous breed's photo.
        recyclingKey={id}
        cachePolicy="memory-disk"
        contentFit="cover"
        transition={150}
        style={[styles.thumb, { backgroundColor: colors.surfaceMuted }]}
        accessible={false}
      />
      <View style={styles.text}>
        <AppText numberOfLines={1} style={styles.name}>
          {breed.name}
        </AppText>
        {summary ? (
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {summary}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

export const BreedRow = memo(BreedRowBase);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: THUMB_SIZE + spacing.md * 2,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thumb: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: radius.md },
  text: { flex: 1, gap: 2 },
  name: { fontWeight: '600' },
});
