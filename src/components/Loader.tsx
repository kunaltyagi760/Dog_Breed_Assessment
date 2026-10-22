import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { spacing, useTheme } from '@/theme';

import { AppText } from './AppText';

export function Loader({ message }: { message?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator
        color={colors.primary}
        accessibilityLabel={message ?? 'Loading'}
        accessibilityLiveRegion="polite"
      />
      {message ? <AppText tone="muted">{message}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
});
