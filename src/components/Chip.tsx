import { memo } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { radius, spacing, useTheme } from '@/theme';

import { AppText } from './AppText';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function ChipBase({ label, selected, onPress }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected
          ? { backgroundColor: colors.primary, borderColor: colors.primary }
          : { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <AppText variant="caption" style={[styles.label, selected && { color: colors.onPrimary }]}>
        {label}
      </AppText>
    </Pressable>
  );
}

export const Chip = memo(ChipBase);

const styles = StyleSheet.create({
  chip: {
    minHeight: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  label: { fontWeight: '600' },
  pressed: { opacity: 0.7 },
});
