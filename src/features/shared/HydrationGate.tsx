import type { ReactNode } from 'react';

import { Loader } from '@/components';
import { useBreedStore } from '@/store/breedStore';

/**
 * Renders its children once saved data has been loaded from SQLite.
 *
 * This lives in each screen rather than in the root layout because the root
 * layout has to render the navigator from the very first frame; otherwise
 * Expo Router has nowhere to send a deep link the app was opened with.
 */
export function HydrationGate({ children }: { children: ReactNode }) {
  const hydrated = useBreedStore((state) => state.hydrated);
  return hydrated ? children : <Loader />;
}
