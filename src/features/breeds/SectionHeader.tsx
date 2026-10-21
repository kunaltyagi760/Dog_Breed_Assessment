import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components';
import { spacing, useTheme } from '@/theme';

type Props = {
  title: string;
  count: number;
};

function SectionHeaderBase({ title, count }: Props) {
  const { colors } = useTheme();
  return (
    // Opaque background because the header sticks on top of scrolling rows.
    <View
      accessibilityRole="header"
      style={[
        styles.header,
        { backgroundColor: colors.background, borderBottomColor: colors.border },
      ]}
    >
      <AppText variant="subtitle">{title}</AppText>
      <AppText variant="caption" tone="muted">
        {count}
      </AppText>
    </View>
  );
}

export const SectionHeader = memo(SectionHeaderBase);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
