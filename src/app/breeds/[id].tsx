import { Stack, useLocalSearchParams } from 'expo-router';

import { ErrorFallback, Loader, StateMessage } from '@/components';
import { BreedTabs } from '@/features/breedDetail/BreedTabs';
import { useBreedDetail } from '@/features/breedDetail/useBreedDetail';
import { HydrationGate } from '@/features/shared/HydrationGate';
import { useBreedStore } from '@/store/breedStore';

function BreedDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { breed, status, error, retry } = useBreedDetail(id);
  // The list row is already in memory, so the title shows before SQLite answers.
  const listName = useBreedStore((state) => state.breeds.byId[id]?.name);

  let content;
  if (status === 'ready' && breed) {
    content = <BreedTabs breed={breed} />;
  } else if (status === 'offline') {
    content = (
      <StateMessage
        title="Not saved on this device"
        message="Connect to the internet to load this breed."
      />
    );
  } else if (status === 'missing') {
    content = (
      <StateMessage title="Breed not found" message="It may have been removed from the Dog API." />
    );
  } else if (status === 'error') {
    content = <ErrorFallback title="Couldn't load this breed" error={error} onRetry={retry} />;
  } else {
    content = <Loader />;
  }

  return (
    <>
      <Stack.Screen options={{ title: breed?.name ?? listName ?? '' }} />
      {content}
    </>
  );
}

export default function BreedDetailScreen() {
  return (
    <HydrationGate>
      <BreedDetail />
    </HydrationGate>
  );
}
