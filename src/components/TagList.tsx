import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { radius, spacing, useTheme } from '@/theme';

import { AppText } from './AppText';

type Props = {
  tags: readonly string[];
  /** Shown instead of the tags when the list is empty. */
  emptyText?: string;
};

// Read-only pills; Chip is the pressable version used for filters.
function TagListBase({ tags, emptyText = 'None listed' }: Props) {
  const { colors } = useTheme();

  if (tags.length === 0) {
    return (
      <AppText variant="caption" tone="muted">
        {emptyText}
      </AppText>
    );
  }

  return (
    <View style={styles.list}>
      {tags.map((tag, index) => (
        <View
          key={`${tag}-${index}`}
          style={[styles.tag, { backgroundColor: colors.surfaceMuted }]}
        >
          <AppText variant="caption">{tag}</AppText>
        </View>
      ))}
    </View>
  );
}

export const TagList = memo(TagListBase);

const styles = StyleSheet.create({
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill },
});
