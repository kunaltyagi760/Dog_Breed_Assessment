import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing } from '@/theme';

type Props = {
  children: ReactNode;
  padded?: boolean;
};

/**
 * Scroll container for the detail tabs. The tabs already sit below the header,
 * so iOS's automatic inset adjustment is switched off: left on, it re-applies
 * the header height after a full-screen modal closes and shifts the content
 * up under the tab bar. The bottom inset keeps the last row clear of the
 * home indicator.
 */
export function TabScrollView({ children, padded = true }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="never"
      automaticallyAdjustContentInsets={false}
      contentContainerStyle={[
        padded && styles.padded,
        { paddingBottom: insets.bottom + spacing.xl },
      ]}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  padded: { padding: spacing.lg, gap: spacing.xl },
});
