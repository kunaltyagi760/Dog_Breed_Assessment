import { z } from 'zod';

// The source data has gaps (blank authors, missing heights, null coat lengths),
// so almost everything below "name" is optional. Blank strings become null here
// so the rest of the app only has to handle one kind of "missing".
const text = z
  .string()
  .nullish()
  .transform((value) => (value?.trim() ? value.trim() : null));

const number = z.number().nullish();

const stringList = z
  .array(z.string())
  .nullish()
  .transform((list) => list?.map((item) => item.trim()).filter(Boolean) ?? []);

const rangeSchema = z.object({ min: number, max: number }).nullish();

const imageSchema = z.object({
  id: z.string(),
  thumb: text,
  medium: text,
  large: text,
  attribution: z
    .object({
      author: text,
      license: text,
      license_url: text,
      source: text,
      source_url: text,
    })
    .nullish(),
});

const traitsSchema = z.object({
  energy: number,
  barking: number,
  drooling: number,
  grooming: number,
  shedding: number,
  trainability: number,
  good_with_dogs: number,
  apartment_friendly: number,
  good_with_children: number,
  good_with_strangers: number,
  exercise_minutes: number,
  temperament: stringList,
});

const breedAttributesSchema = z.object({
  name: z.string().trim().min(1),
  description: text,
  hypoallergenic: z.boolean().nullish(),
  life: rangeSchema,
  male_weight: rangeSchema,
  female_weight: rangeSchema,
  male_height: rangeSchema,
  female_height: rangeSchema,
  origin: z.object({ country: text, region: text, era: text }).nullish(),
  coat: z.object({ type: text, length: text, colors: stringList }).nullish(),
  traits: traitsSchema.nullish(),
  other_names: stringList,
  recognized_by: stringList,
  sources: z.array(z.object({ url: z.string(), title: text })).nullish(),
  images: z.array(imageSchema).nullish(),
});

export const breedResourceSchema = z.object({
  id: z.string().min(1),
  attributes: breedAttributesSchema,
  relationships: z
    .object({
      group: z.object({ data: z.object({ id: z.string() }).nullish() }).nullish(),
    })
    .nullish(),
});

export type BreedResource = z.infer<typeof breedResourceSchema>;
export type RawRange = z.infer<typeof rangeSchema>;

// Records are validated one by one (see dogApi) so a single bad breed
// doesn't throw away the other 47 on the page.
export const breedPageSchema = z.object({
  data: z.array(z.unknown()),
  meta: z.object({
    pagination: z.object({
      current: z.number().int(),
      last: z.number().int().optional(),
      records: z.number().int().optional(),
    }),
  }),
});

export const groupResourceSchema = z.object({
  id: z.string().min(1),
  attributes: z.object({ name: z.string().trim().min(1) }),
});

export type GroupResource = z.infer<typeof groupResourceSchema>;

export const groupListSchema = z.object({ data: z.array(groupResourceSchema) });

export const singleBreedSchema = z.object({ data: breedResourceSchema });
