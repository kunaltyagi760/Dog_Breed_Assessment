import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { radius, useTheme } from '@/theme';

type Props = {
  /** 0 to 1. */
  progress: number;
  accessibilityLabel: string;
};

function ProgressBarBase({ progress, accessibilityLabel }: Props) {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={[styles.track, { backgroundColor: colors.surfaceMuted }]}
    >
      <View
        style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: colors.primary }]}
      />
    </View>
  );
}

export const ProgressBar = memo(ProgressBarBase);

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: radius.sm, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.sm },
});
