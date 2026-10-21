import { Stack, useLocalSearchParams } from 'expo-router';

import { StateMessage } from '@/components';
import { useBreedStore } from '@/store/breedStore';

export default function BreedDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const breed = useBreedStore((state) => state.breeds.byId[id]);

  return (
    <>
      <Stack.Screen options={{ title: breed?.name ?? '' }} />
      {breed ? (
        <StateMessage title={breed.name} message="Details, traits and gallery come next." />
      ) : (
        <StateMessage
          title="Breed not found"
          message="It may have been removed in the last sync."
        />
      )}
    </>
  );
}
