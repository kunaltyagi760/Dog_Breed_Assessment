import { memo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Section, TagList } from '@/components';
import { TRAIT_LABELS } from '@/domain/labels';
import type { Breed, ScoreTrait } from '@/domain/types';
import { spacing } from '@/theme';

import { TraitMeter } from './TraitMeter';

type Props = { breed: Breed };

const TRAIT_GROUPS: { title: string; traits: ScoreTrait[] }[] = [
  {
    title: 'Living with',
    traits: ['good_with_children', 'good_with_dogs', 'good_with_strangers', 'apartment_friendly'],
  },
  { title: 'Care', traits: ['grooming', 'shedding', 'drooling', 'barking'] },
  { title: 'Activity', traits: ['energy', 'trainability'] },
];

// The data tops out at 120 minutes a day, so each segment is 20 minutes.
const EXERCISE_STEP_MINUTES = 20;
const EXERCISE_SEGMENTS = 6;

function TraitsTabBase({ breed }: Props) {
  const minutes = breed.exerciseMinutes;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {TRAIT_GROUPS.map(({ title, traits }, index) => (
        <Section
          key={title}
          title={title}
          caption={index === 0 ? '1 = least, 5 = most' : undefined}
        >
          <View style={styles.meters}>
            {traits.map((trait) => {
              const score = breed.scores[trait];
              return (
                <TraitMeter
                  key={trait}
                  label={TRAIT_LABELS[trait]}
                  value={score}
                  max={5}
                  valueLabel={`${score}/5`}
                />
              );
            })}
            {title === 'Activity' ? (
              <TraitMeter
                label="Daily exercise"
                value={minutes == null ? null : Math.ceil(minutes / EXERCISE_STEP_MINUTES)}
                max={EXERCISE_SEGMENTS}
                valueLabel={`${minutes} min a day`}
              />
            ) : null}
          </View>
        </Section>
      ))}

      <Section title="Temperament">
        <TagList tags={breed.temperament} emptyText="No temperament listed" />
      </Section>
    </ScrollView>
  );
}

export const TraitsTab = memo(TraitsTabBase);

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.xl },
  meters: { gap: spacing.lg },
});
