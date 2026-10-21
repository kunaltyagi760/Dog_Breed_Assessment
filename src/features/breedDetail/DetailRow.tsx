import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components';
import { spacing, useTheme } from '@/theme';

type Props = {
  label: string;
  value: string | null;
};

function DetailRowBase({ label, value }: Props) {
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value ?? 'Unknown'}`}
      style={[styles.row, { borderBottomColor: colors.border }]}
    >
      <AppText tone="muted" style={styles.label}>
        {label}
      </AppText>
      <AppText tone={value ? 'default' : 'muted'} style={styles.value}>
        {value ?? 'Unknown'}
      </AppText>
    </View>
  );
}

export const DetailRow = memo(DetailRowBase);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: { flexShrink: 0 },
  value: { flex: 1, textAlign: 'right', fontWeight: '500' },
});
