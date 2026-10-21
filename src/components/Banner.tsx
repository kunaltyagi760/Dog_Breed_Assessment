import Ionicons from '@expo/vector-icons/Ionicons';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { radius, spacing, useTheme, type Palette } from '@/theme';

import { AppText } from './AppText';
import type { IconName } from './IconButton';

type Tone = 'warning' | 'danger';

type Props = {
  tone: Tone;
  message: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
};

const toneColors: Record<Tone, { text: keyof Palette; surface: keyof Palette }> = {
  warning: { text: 'warning', surface: 'warningSurface' },
  danger: { text: 'danger', surface: 'dangerSurface' },
};

function BannerBase({
  tone,
  message,
  icon = 'alert-circle-outline',
  actionLabel,
  onAction,
}: Props) {
  const { colors } = useTheme();
  const color = colors[toneColors[tone].text];

  return (
    <View
      accessibilityRole="alert"
      style={[styles.banner, { backgroundColor: colors[toneColors[tone].surface] }]}
    >
      <Ionicons name={icon} size={18} color={color} />
      <AppText variant="caption" tone={tone} style={styles.message}>
        {message}
      </AppText>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <AppText variant="caption" tone={tone} style={styles.action}>
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

export const Banner = memo(BannerBase);

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  message: { flex: 1 },
  action: { fontWeight: '700' },
});
