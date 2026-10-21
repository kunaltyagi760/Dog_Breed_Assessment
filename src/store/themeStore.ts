import Storage from 'expo-sqlite/kv-store';
import { Appearance } from 'react-native';
import { create } from 'zustand';

export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'theme-preference';

function readPreference(): ThemePreference {
  try {
    const value = Storage.getItemSync(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

// Overriding the app-wide scheme (instead of keeping our own flag) means
// useColorScheme, native alerts and the keyboard all follow the toggle.
function applyPreference(preference: ThemePreference) {
  Appearance.setColorScheme(preference === 'system' ? 'auto' : preference);
}

type ThemeState = {
  preference: ThemePreference;
  setPreference(preference: ThemePreference): void;
};

export const useThemeStore = create<ThemeState>((set) => ({
  preference: readPreference(),
  setPreference: (preference) => {
    applyPreference(preference);
    try {
      Storage.setItemSync(STORAGE_KEY, preference);
    } catch {
      // Not persisting is fine; the choice still applies for this session.
    }
    set({ preference });
  },
}));

export function restoreThemePreference() {
  applyPreference(useThemeStore.getState().preference);
}
