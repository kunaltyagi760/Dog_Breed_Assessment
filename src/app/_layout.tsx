import { QueryClientProvider } from '@tanstack/react-query';
import {
  DarkTheme,
  DefaultTheme,
  router,
  Stack,
  ThemeProvider,
  type ErrorBoundaryProps,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useNativeQueryEvents } from '@/api/nativeQueryEvents';
import { createQueryClient } from '@/api/queryClient';
import { ErrorFallback, IconButton, ThemeToggle } from '@/components';
import { useHydration } from '@/hooks/useHydration';
import { useThumbnailPrefetch } from '@/images/useThumbnailPrefetch';
import { restoreThemePreference } from '@/store/themeStore';
import { useTheme } from '@/theme';

// Applied before the first render so a saved dark preference doesn't flash light.
restoreThemePreference();

const renderThemeToggle = () => <ThemeToggle />;
const openStorage = () => router.push('/storage');
const renderListActions = () => (
  <View style={styles.headerActions}>
    <IconButton
      icon="cloud-download-outline"
      accessibilityLabel="Offline storage"
      onPress={openStorage}
    />
    <ThemeToggle />
  </View>
);

// Keeps the list underneath a breed opened from a deep link, so "back" works.
export const unstable_settings = { initialRouteName: 'index' };

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return <ErrorFallback error={error} onRetry={retry} />;
}

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient);
  const { dark, colors } = useTheme();
  const { error, retry } = useHydration();
  useNativeQueryEvents();
  useThumbnailPrefetch();

  const navigationTheme = useMemo(() => {
    const base = dark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
      },
    };
  }, [dark, colors]);

  let content;
  if (error) {
    content = <ErrorFallback title="Couldn't open saved data" error={error} onRetry={retry} />;
  } else {
    content = (
      <Stack screenOptions={{ headerRight: renderThemeToggle }}>
        <Stack.Screen
          name="index"
          options={{ title: 'Dog Breeds', headerRight: renderListActions }}
        />
        <Stack.Screen name="breeds/[id]" options={{ title: '' }} />
        <Stack.Screen name="storage" options={{ title: 'Offline storage' }} />
      </Stack>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={navigationTheme}>
          <StatusBar style={dark ? 'light' : 'dark'} />
          {content}
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
