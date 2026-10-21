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
