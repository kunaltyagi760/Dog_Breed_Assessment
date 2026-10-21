import Ionicons from '@expo/vector-icons/Ionicons';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components';
import { radius, spacing, useTheme } from '@/theme';

type Props = {
  activeCount: number;
  resultCount: number;
  totalCount: number;
  isNarrowed: boolean;
  onOpenFilters: () => void;
  onClear: () => void;
};

function FilterBarBase({
  activeCount,
  resultCount,
  totalCount,
  isNarrowed,
  onOpenFilters,
  onClear,
}: Props) {
  const { colors } = useTheme();
  const hasFilters = activeCount > 0;

  return (
    <View style={styles.bar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={hasFilters ? `Filters, ${activeCount} active` : 'Filters'}
        onPress={onOpenFilters}
        style={({ pressed }) => [
          styles.filterButton,
          { borderColor: hasFilters ? colors.primary : colors.border },
          pressed && styles.pressed,
        ]}
      >
        <Ionicons
          name="options-outline"
          size={16}
          color={hasFilters ? colors.primary : colors.text}
        />
        <AppText variant="caption" tone={hasFilters ? 'primary' : 'default'} style={styles.bold}>
          {hasFilters ? `Filters (${activeCount})` : 'Filters'}
        </AppText>
      </Pressable>

      {isNarrowed ? (
        <>
          <AppText variant="caption" tone="muted" style={styles.count}>
            {resultCount} of {totalCount}
          </AppText>
          <Pressable accessibilityRole="button" onPress={onClear} hitSlop={8}>
            <AppText variant="caption" tone="primary" style={styles.bold}>
              Clear
            </AppText>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

export const FilterBar = memo(FilterBarBase);

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  count: { flex: 1, textAlign: 'right' },
  bold: { fontWeight: '600' },
  pressed: { opacity: 0.7 },
});
