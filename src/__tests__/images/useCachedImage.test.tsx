import { onlineManager } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { imageCache } from '@/images';
import { useCachedImage } from '@/images/useCachedImage';

// A cache whose downloads this test controls, replacing the global mock.
const mockDownloads = new Map<string, { resolve: (bytes: number) => void; reject: () => void }>();

jest.mock('@/images', () => {
  const { createImageCache } = jest.requireActual('@/images/imageCache');
  return {
    imageCache: createImageCache({
      index: { load: async () => [], save: async () => {}, remove: async () => {} },
      files: {
        uriFor: (name: string) => `file:///cache/${name}`,
        download: (url: string) =>
          new Promise<number>((resolve, reject) => mockDownloads.set(url, { resolve, reject })),
        remove: () => {},
      },
      budgetBytes: 10 * 1024 * 1024,
    }),
  };
});

describe('useCachedImage', () => {
  afterEach(() => {
    onlineManager.setOnline(true);
    mockDownloads.clear();
  });

  it('shows nothing while downloading, then the local file', async () => {
    const { result } = await renderHook(() => useCachedImage('https://x/a.webp'));
    expect(result.current.uri).toBeNull();

    await act(async () => mockDownloads.get('https://x/a.webp')?.resolve(1000));

    expect(result.current.uri).toMatch(/^file:\/\/\/cache\//);
  });

  it('uses an already cached file straight away', async () => {
    const pending = imageCache.ensure('https://x/cached.webp');
    mockDownloads.get('https://x/cached.webp')?.resolve(1000);
    const local = await pending;

    const { result } = await renderHook(() => useCachedImage('https://x/cached.webp'));

    expect(result.current.uri).toBe(local);
  });

  it('does not try to download while offline', async () => {
    onlineManager.setOnline(false);

    const { result } = await renderHook(() => useCachedImage('https://x/offline.webp'));

    expect(result.current.uri).toBeNull();
    expect(mockDownloads.has('https://x/offline.webp')).toBe(false);
  });

  it('falls back to the remote URL if the download fails', async () => {
    const { result } = await renderHook(() => useCachedImage('https://x/broken.webp'));

    await act(async () => mockDownloads.get('https://x/broken.webp')?.reject());

    await waitFor(() => expect(result.current.uri).toBe('https://x/broken.webp'));
  });

  it('handles a breed without an image', async () => {
    const { result } = await renderHook(() => useCachedImage(null));
    expect(result.current.uri).toBeNull();
  });
});
