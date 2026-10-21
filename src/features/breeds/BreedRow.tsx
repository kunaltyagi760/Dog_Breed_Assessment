import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components';
import { useBreedStore } from '@/store/breedStore';
import { spacing, useTheme } from '@/theme';

type Props = {
  id: string;
  onPress: (id: string) => void;
};

export const BREED_ROW_HEIGHT = 64;

// Each row subscribes to its own breed, so a store update only re-renders rows that changed.
function BreedRowBase({ id, onPress }: Props) {
  const { colors } = useTheme();
  const breed = useBreedStore((state) => state.breeds.byId[id]);
  const groupLabel = useBreedStore((state) =>
    breed?.groupId ? state.groups.byId[breed.groupId]?.label : undefined,
  );

  if (!breed) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={groupLabel ? `${breed.name}, ${groupLabel} group` : breed.name}
      onPress={() => onPress(id)}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.border },
        pressed && { backgroundColor: colors.surfaceMuted },
      ]}
    >
      <View style={styles.text}>
        <AppText numberOfLines={1} style={styles.name}>
          {breed.name}
        </AppText>
        {groupLabel ? (
          <AppText variant="caption" tone="muted">
            {groupLabel}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

export const BreedRow = memo(BreedRowBase);

const styles = StyleSheet.create({
  row: {
    height: BREED_ROW_HEIGHT,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  text: { gap: 2 },
  name: { fontWeight: '600' },
});
