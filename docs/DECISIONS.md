# Technical decisions

This file records the choices I made, what I compared them against, and what each one costs. Where the brief left something open, I made the call myself and wrote it down here rather than guessing quietly in the code.

## The live API vs. the brief

I hit the API before writing any code, because the brief and the API docs disagree with each other. What it returned on 21 Oct 2026:

|                   | Brief                  | API docs   | Live API                                   |
| ----------------- | ---------------------- | ---------- | ------------------------------------------ |
| Breeds            | 283                    | 340        | **283**                                    |
| Default page size | 48                     | 1000       | **30** (10 pages)                          |
| Groups            | 9                      | ~20        | **9**                                      |
| Images per breed  | up to 9                | not stated | **1 to 10** (78 breeds have 10)            |
| Coat lengths      | short/medium/long/wire | not stated | **short/medium/long/hairless**, one `null` |

Other things worth knowing: 61 images have no `attribution.author`, 4 to 6 breeds have no height range, `origin.era` is empty for 104 breeds, and group names come with a suffix (`"Herding Group"`, `"Miscellaneous Class"`).

My takeaway was that the client can't trust any hardcoded number. Several of the decisions below follow from that.

## Data decisions

### Page size: `page[size]=48`, page count read from the response

I always request 48 per page, so the app fetches exactly the 6 pages the brief describes and doesn't depend on whatever the server default happens to be this month. The page count isn't hardcoded, though. I fetch page 1, read `meta.pagination.last`, and then fetch the remaining pages. If the dataset grows to 300 breeds, the app picks up a seventh page without a code change. After merging, I dedupe by `id` and compare the count against `meta.pagination.records`, so a page that shifted mid-sync shows up as a mismatch instead of a silent gap.

The page size lives in `.env` (`EXPO_PUBLIC_PAGE_SIZE`) so it can be changed without touching code.

### Coat filter: a derived "coat category", including Hairless

The brief asks for short/medium/long/wire, but in the data "wire" is a coat type (35 breeds), not a length. A wire-haired terrier has `length: "short"` and `type: "wire"`. I derive one category per breed:

- `wire` if `coat.type === "wire"`
- otherwise `coat.length` (`short`, `medium`, `long`)
- `hairless` for the 4 hairless breeds
- `unknown` for the one breed with no coat data. It isn't offered as a chip, but the breed still shows up when no coat filter is active.

I added Hairless as a fifth chip. Folding those breeds into "short" would be wrong, and someone filtering for low grooming would want to find them. The category is computed once when breeds are saved, not on every render.

### Background sync: on reconnect and on foreground, not OS background tasks

A sync runs when:

1. the app launches with no cached data, or with data older than `EXPO_PUBLIC_STALE_AFTER_HOURS`;
2. NetInfo reports the device coming back online while the app is open;
3. the app returns to the foreground and the data is stale;
4. the user pulls to refresh.

I chose not to register an OS background task (`expo-background-task`). Breed data changes rarely, and iOS decides on its own when background tasks run, so it's a poor fit for "sync when the network returns". It would also add a native capability the app doesn't need. Syncing on reconnect while the app is open covers the user story. If this needed fresher data, OS background sync is the next step.

### What "last synced" means

"Last synced" is the time of the last sync that fetched every page. A partial sync still saves the pages that worked, but it doesn't move that timestamp, and it records which pages failed. Showing "Last synced just now" when two pages are a week old would be misleading. A partial or failed sync also marks the data as stale, so the next reconnect or foreground retries it straight away instead of waiting out the 6 hours.

A single malformed breed is skipped and counted instead of failing its whole page. Losing one breed until the next sync is better than losing 48.

### Size bands from weight, falling back to height

The API has no size field. For each breed I average the male and female maximum weight and bucket it:

| Band   | Weight      |
| ------ | ----------- |
| Small  | < 10 kg     |
| Medium | 10 to 25 kg |
| Large  | 25 to 45 kg |
| Giant  | > 45 kg     |

The cut-offs come from the real distribution of male max weight (quartiles roughly 12 / 25 / 35 kg, max 113 kg), with Giant sitting above the usual "large dog" line. When weight is missing, I fall back to height at the withers (under 35 cm small, under 53 medium, under 65 large, otherwise giant). On the live data this gives 54 small, 88 medium, 104 large and 37 giant breeds.

### Filter semantics

Within one filter, chips combine with OR (Herding or Toy). Across filters they combine with AND (Herding or Toy, and also Small). This is what people expect from e-commerce style filters. The trait threshold is a single minimum score from 1 to 5 for good with children, dogs and strangers.

## Performance: how heavy each row is

Any virtualized list copes with 283 rows. The cost here comes from the size of each record: nested traits, a coat object, origin, kennel clubs, sources and up to 10 images, each with four URLs and an attribution block. I measured the live data at a median of about 7 KB of JSON per breed (2.4 KB to 11 KB), 1.8 MB for the whole set.

Passing that whole object to every list row hurts in a few ways. `React.memo` ends up comparing deep objects, and any new reference re-renders the row. FlashList hands recycled cells new props as you scroll, so large props mean more work per frame. And all 283 full objects stay in memory just to draw a name and a thumbnail.

So the list never sees the full breed. When I save to SQLite, I also compute a slim list row: `id`, `name`, group label, the first `thumb` URL, size band, coat category, hypoallergenic, and the three "good with" scores the filters use. The list, search and filters work only on these rows. The full `payload` is read when the detail screen opens.

The cost is a little duplication between the projection and the payload, plus a write path that has to keep them in sync. Both are built in the same function inside the same transaction, so they can't diverge.

Filtering runs in memory over the 283 slim rows in a memoized selector, not as SQL queries. One pass takes well under a millisecond, and SQL would add a query builder and async round-trips without any measurable benefit.

## Stack

### Expo, running in Expo Go

The brief says `npm run ios` should work in under three minutes. A native build on a cold machine (CocoaPods install plus an Xcode compile) takes longer than that. So I picked Expo and limited myself to libraries that ship inside Expo Go. That way `npm run ios` is just `expo start --ios`: the simulator opens Expo Go and loads the JS bundle, with no native compile.

The cost is that I can't use libraries with custom native code: MMKV, op-sqlite, @gorhom/bottom-sheet and FastImage are all out. None of them were essential, and Expo's own modules cover the same ground. If the project ever needs one, `npx expo prebuild` turns it into a regular native project without a rewrite.

Bare React Native was the alternative. It would give me full control I don't need, and it breaks the quick-start requirement.

### Navigation: Expo Router

It's built on React Navigation, so the behaviour is the same, but routes are files and `experiments.typedRoutes` makes `router.push('/breeds/[id]')` type-checked, including the params. With plain React Navigation I'd be maintaining a `RootStackParamList` by hand to get the same safety.

### Server state: TanStack Query

The brief asks for retry with exponential backoff. TanStack Query has that built in, along with request deduplication, an `onlineManager` I wire to NetInfo, and a `focusManager` I wire to AppState. That's most of the sync triggers for free. I use my own `backoffDelay` (full jitter, capped at 30s) so React Query and the per-page retry in the sync engine back off the same way.

SWR would work too, but hooking its reconnect and focus revalidation up to NetInfo and AppState means writing a custom cache provider, where TanStack Query already exposes `onlineManager` and `focusManager` for exactly that. A hand-rolled hook would mean re-implementing caching and deduplication myself.

### Client state: Zustand

The breed data is stored normalized (`byId` + `allIds` for breeds, `byId` for groups), and the filters live in a separate small store. I picked Zustand because:

- selectors subscribe to a slice, so changing a filter doesn't re-render list rows whose data didn't change;
- it's about 1 KB, with no providers or reducers;
- the store can be read outside React, which the sync engine needs when it writes fresh data.

I seriously considered Redux Toolkit, since `createEntityAdapter` gives you a normalized cache out of the box. For one entity type and a filter object, though, the action/reducer/slice ceremony isn't worth it, and RTK Query would duplicate what TanStack Query already does. Context plus a reducer re-renders every consumer on each change, which matters on a 283-row list. Jotai would be fine, but a normalized entity map fits a single store more naturally than a set of atoms.

### Persistence: expo-sqlite

It ships in Expo Go, so the quick start still works. Each page of 48 breeds is written in one transaction, so a crash mid-write never leaves half a page behind. With AsyncStorage I'd be rewriting one 1.8 MB JSON blob on every save. SQLite also gives me a real schema: typed columns for the fields the list and filters need, and the validated API record in a `payload` column for the detail screen. The schema is in `ARCHITECTURE.md`.

Images don't get their own table. They're only ever read together with their breed, so they stay inside `payload`; the list's thumbnail URL is copied into a column because the list never opens the payload.

I ruled out WatermelonDB because it needs a native build and its sync protocol expects a backend that speaks it. MMKV and op-sqlite are faster but also need a native build. With 283 rows, read speed is not the bottleneck.

### Runtime validation: zod

The brief rules out `any`, and the data is messy, so every API response enters the app as `unknown` and goes through a zod schema that turns it into typed data. Missing heights, `null` coat lengths and blank authors are handled once, in the schema, instead of with `?.` scattered across components. The TypeScript types come from the schemas, so the types can't drift from what's actually validated. I also use zod for the env config.

Valibot would be smaller. I went with zod because more reviewers will know it, and the bundle difference is small next to React Native itself.

### List: FlashList

FlashList recycles row views instead of mounting new ones as you scroll, and it handles mixed item types (group headers and breed rows) with `getItemType`. FlatList with good `getItemLayout` tuning can come close, but FlashList gets there with less tuning, and it ships in Expo Go.

### Images: expo-image plus a small cache I manage

expo-image does the decoding, downsampling and memory caching (SDWebImage on iOS, Glide on Android), and it supports `recyclingKey` for list rows. What it doesn't have is a disk size limit, and the brief asks for one. So the images that need to be available offline go through a small LRU cache on top of expo-file-system, with the budget set by `EXPO_PUBLIC_IMAGE_CACHE_MB`.

Which variant is used where:

- List rows use `thumb` (200×200 WebP) for each breed's first image. A sample came in at 9 to 27 KB each, so all 283 are around 5 MB. They're pinned and never evicted.
- The detail header and gallery use `medium` (600px, roughly 75 to 120 KB).
- The full-screen viewer upgrades to `large` (1200px, 165 to 320 KB), but only when the user opens an image full-screen.

Medium and large images count against the LRU budget. At the default 100 MB that's on the order of a thousand medium images, more than enough for someone who browses a few dozen breeds.

- The original `url` is never downloaded. It can be several MB and no screen needs it.

### Error handling

`react-error-boundary` wraps the list, each detail tab and the gallery separately, so a broken gallery image doesn't take the Overview tab down with it. Expo Router's `ErrorBoundary` export on the root layout catches anything that escapes those.

## Code quality

- TypeScript `strict`, plus `noUncheckedIndexedAccess`, so a `byId[id]` lookup is typed as possibly `undefined` and the compiler makes you handle that case.
- ESLint (`eslint-config-expo`) with `@typescript-eslint/no-explicit-any` as an error, and Prettier through ESLint so formatting problems fail lint.
- UI pieces used in three or more places live in `src/components` (`AppText`, `Button`, `StateMessage`, …) instead of being copied between screens.

## Testing

Jest (`jest-expo`) with React Native Testing Library. The sync engine takes its fetch function as a parameter, so tests pass a stub instead of mocking the network globally. I chose that over MSW because it keeps the tests fast and deterministic, and it pushed the engine into a cleaner shape. The bonus E2E test uses Maestro rather than Detox: a Maestro flow is a short YAML file, and it runs against Expo Go without a custom build.
