import { useLocalSearchParams } from 'expo-router';

import { StateMessage } from '@/components';

export default function BreedDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <StateMessage title="Breed details" message={id} />;
}
