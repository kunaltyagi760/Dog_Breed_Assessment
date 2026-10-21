import { QueryClientProvider } from '@tanstack/react-query';
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  type ErrorBoundaryProps,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useNativeQueryEvents } from '@/api/nativeQueryEvents';
import { createQueryClient } from '@/api/queryClient';
import { ErrorFallback, Loader, ThemeToggle } from '@/components';
import { useHydration } from '@/hooks/useHydration';
import { restoreThemePreference } from '@/store/themeStore';
import { useTheme } from '@/theme';

// Applied before the first render so a saved dark preference doesn't flash light.
restoreThemePreference();

const renderThemeToggle = () => <ThemeToggle />;

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return <ErrorFallback error={error} onRetry={retry} />;
}

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient);
  const { dark, colors } = useTheme();
  const { hydrated, error, retry } = useHydration();
  useNativeQueryEvents();

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
  } else if (!hydrated) {
    content = <Loader />;
  } else {
    content = (
      <Stack screenOptions={{ headerRight: renderThemeToggle }}>
        <Stack.Screen name="index" options={{ title: 'Dog Breeds' }} />
        <Stack.Screen name="breeds/[id]" options={{ title: '' }} />
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
