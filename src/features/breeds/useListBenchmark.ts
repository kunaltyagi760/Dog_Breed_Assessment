import { useBenchmark, type BenchmarkResult, type FlashListRef } from '@shopify/flash-list';
import type { RefObject } from 'react';
import { Alert } from 'react-native';

import { env } from '@/config/env';

function describe({ js, interrupted, suggestions }: BenchmarkResult): string {
  if (interrupted) return 'Interrupted: the list was touched while the benchmark ran.';
  const fps = js
    ? `JS FPS  average ${js.averageFPS.toFixed(1)} · min ${js.minFPS.toFixed(1)} · max ${js.maxFPS.toFixed(1)}`
    : 'No FPS samples';
  return [fps, ...suggestions].join('\n\n');
}

/**
 * FlashList's own scroll benchmark: when EXPO_PUBLIC_LIST_BENCHMARK=1 it
 * auto-scrolls the full list after launch and reports JS-thread FPS and blank
 * area. Off by default; used to produce the numbers in docs/PERFORMANCE.md.
 */
export function useListBenchmark<T>(listRef: RefObject<FlashListRef<T> | null>) {
  useBenchmark(
    listRef as RefObject<FlashListRef<T>>,
    (result) => Alert.alert('List benchmark', describe(result)),
    { startManually: !env.listBenchmark, startDelayInMs: 2000, repeatCount: 2 },
  );
}
