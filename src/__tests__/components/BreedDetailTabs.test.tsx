import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Linking } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { EMPTY_SYNC_META } from '@/db/repository';
import { GalleryTab } from '@/features/breedDetail/GalleryTab';
import { OverviewTab } from '@/features/breedDetail/OverviewTab';
import { TraitsTab } from '@/features/breedDetail/TraitsTab';
import { toBreed } from '@/domain/normalize';
import { useBreedStore } from '@/store/breedStore';

import { breedResource } from '../helpers/fixtures';

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

const breed = toBreed(breedResource('gsd', { name: 'German Shepherd Dog' }));

// The tabs pad themselves for the home indicator, which needs safe-area metrics.
const renderInSafeArea = (ui: ReactElement) =>
  render(<SafeAreaProvider initialMetrics={metrics}>{ui}</SafeAreaProvider>);

beforeAll(() => {
  useBreedStore.getState().setSnapshot({
    breeds: [],
    groups: [{ id: 'g-herding', name: 'Herding Group', label: 'Herding' }],
    syncMeta: EMPTY_SYNC_META,
  });
});

describe('OverviewTab', () => {
  it('shows the facts the brief asks for', async () => {
    await renderInSafeArea(<OverviewTab breed={breed} />);

    expect(screen.getByText('A dog.')).toBeOnTheScreen();
    expect(screen.getByLabelText('Group: Herding')).toBeOnTheScreen();
    expect(screen.getByLabelText('Life span: 10–14 years')).toBeOnTheScreen();
    expect(screen.getByLabelText('Male weight: 20–30 kg')).toBeOnTheScreen();
    expect(screen.getByLabelText('Female height: 46–51 cm')).toBeOnTheScreen();
    expect(screen.getByLabelText('Country: Germany')).toBeOnTheScreen();
    expect(screen.getByText('Alsatian')).toBeOnTheScreen();
    expect(screen.getByText('AKC')).toBeOnTheScreen();
  });

  it('marks missing values as Unknown instead of hiding them', async () => {
    // The fixture's origin region is blank, as it is for 50 real breeds.
    await renderInSafeArea(<OverviewTab breed={breed} />);
    expect(screen.getByLabelText('Region: Unknown')).toBeOnTheScreen();
  });

  it('handles a breed with no description or other names', async () => {
    const sparse = toBreed(breedResource('sparse', { description: null, other_names: [] }));
    await renderInSafeArea(<OverviewTab breed={sparse} />);

    expect(screen.getByText('No description available.')).toBeOnTheScreen();
    expect(screen.getByText('No other names')).toBeOnTheScreen();
  });
});

describe('TraitsTab', () => {
  it('renders all 11 traits as scales plus temperament', async () => {
    await renderInSafeArea(<TraitsTab breed={breed} />);

    expect(screen.getAllByRole('progressbar')).toHaveLength(11);
    expect(screen.getByLabelText('Energy: 4/5')).toBeOnTheScreen();
    expect(screen.getByLabelText('Daily exercise: 60 min a day')).toBeOnTheScreen();
    expect(screen.getByText('loyal')).toBeOnTheScreen();
  });

  it('says "No data" for a missing score', async () => {
    const noTraits = toBreed(breedResource('none', { traits: null }));
    await renderInSafeArea(<TraitsTab breed={noTraits} />);

    expect(screen.getByLabelText('Energy: No data')).toBeOnTheScreen();
    expect(screen.getByText('No temperament listed')).toBeOnTheScreen();
  });
});

describe('GalleryTab', () => {
  const renderGallery = (subject = breed) => renderInSafeArea(<GalleryTab breed={subject} />);

  it('shows the position and the photo credit', async () => {
    await renderGallery();

    expect(screen.getByText('1 of 1')).toBeOnTheScreen();
    expect(screen.getByText(/Photo by Jane Doe/)).toBeOnTheScreen();
    expect(screen.getByText('CC BY-SA 3.0')).toBeOnTheScreen();
    expect(screen.getByText('Wikimedia Commons')).toBeOnTheScreen();
  });

  it('opens the license link in the browser', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    await renderGallery();

    await fireEvent.press(screen.getByText('CC BY-SA 3.0'));

    expect(openURL).toHaveBeenCalledWith('https://creativecommons.org/licenses/by-sa/3.0/');
  });

  it('credits an unknown author rather than dropping the credit', async () => {
    const anonymous = toBreed(
      breedResource('anon', {
        images: [{ id: 'a', medium: 'https://x/m.webp', attribution: { author: '' } }],
      }),
    );
    await renderGallery(anonymous);

    expect(screen.getByText(/Photo by an unknown author/)).toBeOnTheScreen();
    expect(screen.getByText('License not stated')).toBeOnTheScreen();
  });

  it('opens the full-screen viewer on tap', async () => {
    await renderGallery();

    await fireEvent.press(screen.getByRole('imagebutton', { name: 'Photo 1 of 1' }));

    expect(screen.getByRole('button', { name: 'Close photo' })).toBeOnTheScreen();
  });

  it('shows an empty state without photos', async () => {
    await renderGallery(toBreed(breedResource('bare', { images: [] })));
    expect(screen.getByText('No photos yet')).toBeOnTheScreen();
  });
});
