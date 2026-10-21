import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { AppText } from './AppText';

type Props = {
  title: string;
  caption?: string;
  children: ReactNode;
};

export function Section({ title, caption, children }: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <AppText variant="subtitle" accessibilityRole="header">
          {title}
        </AppText>
        {caption ? (
          <AppText variant="caption" tone="muted">
            {caption}
          </AppText>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  heading: { gap: 2 },
});
