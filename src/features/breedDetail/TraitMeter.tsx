import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components';
import { radius, spacing, useTheme } from '@/theme';

type Props = {
  label: string;
  /** Filled segments, from 0 to `max`; null when the API has no value. */
  value: number | null;
  max: number;
  valueLabel: string;
};

function TraitMeterBase({ label, value, max, valueLabel }: Props) {
  const { colors } = useTheme();
  const filled = value == null ? 0 : Math.max(0, Math.min(max, value));
  const text = value == null ? 'No data' : valueLabel;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${label}: ${text}`}
      accessibilityValue={value == null ? undefined : { min: 0, max, now: filled }}
      style={styles.container}
    >
      <View style={styles.labels}>
        <AppText style={styles.label}>{label}</AppText>
        <AppText variant="caption" tone="muted">
          {text}
        </AppText>
      </View>
      <View style={styles.track}>
        {Array.from({ length: max }, (_, index) => (
          <View
            key={index}
            style={[
              styles.segment,
              { backgroundColor: index < filled ? colors.primary : colors.surfaceMuted },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

export const TraitMeter = memo(TraitMeterBase);

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  labels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { fontWeight: '500' },
  track: { flexDirection: 'row', gap: spacing.xs },
  segment: { flex: 1, height: 8, borderRadius: radius.sm },
});
