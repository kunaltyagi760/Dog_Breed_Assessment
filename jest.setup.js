jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js'),
);

jest.mock('expo-sqlite/kv-store', () => {
  const values = new Map();
  return {
    __esModule: true,
    default: {
      getItemSync: (key) => values.get(key) ?? null,
      setItemSync: (key, value) => values.set(key, value),
    },
  };
});

// Icon fonts load through expo-asset, which has no registry under Jest.
jest.mock('@expo/vector-icons/Ionicons', () => {
  const { createElement } = require('react');
  const { Text } = require('react-native');
  return { __esModule: true, default: ({ name }) => createElement(Text, null, name) };
});

// The real image cache needs expo-file-system and SQLite. Tests get the same
// cache logic with an empty index and downloads that never finish, so images
// simply stay on their placeholder.
jest.mock('@/images', () => {
  const { createImageCache } = jest.requireActual('@/images/imageCache');
  return {
    imageCache: createImageCache({
      index: { load: async () => [], save: async () => {}, remove: async () => {} },
      files: {
        uriFor: (fileName) => `file:///image-cache/${fileName}`,
        download: () => new Promise(() => {}),
        remove: () => {},
      },
      budgetBytes: 100 * 1024 * 1024,
    }),
  };
});
