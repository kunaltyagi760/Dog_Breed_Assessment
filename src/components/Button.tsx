import { memo } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { radius, spacing, useTheme } from '@/theme';

import { AppText } from './AppText';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

function ButtonBase({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
  accessibilityHint,
}: Props) {
  const { colors } = useTheme();
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isPrimary
          ? { backgroundColor: colors.primary }
          : { borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth },
        (pressed || disabled) && styles.dimmed,
        style,
      ]}
    >
      <AppText
        variant="body"
        style={[styles.label, { color: isPrimary ? colors.onPrimary : colors.text }]}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

export const Button = memo(ButtonBase);

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontWeight: '600' },
  dimmed: { opacity: 0.6 },
});
