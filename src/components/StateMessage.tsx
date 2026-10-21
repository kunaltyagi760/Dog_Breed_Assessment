import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';

type Props = {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

// Shared layout for empty, error and not-found states.
function StateMessageBase({ title, message, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container} accessibilityRole="summary">
      <AppText variant="subtitle" style={styles.center}>
        {title}
      </AppText>
      {message ? (
        <AppText tone="muted" style={styles.center}>
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

export const StateMessage = memo(StateMessageBase);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  center: { textAlign: 'center' },
  action: { marginTop: spacing.md },
});
