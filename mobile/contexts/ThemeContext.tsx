import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemePreference = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  preference: ThemePreference;
  theme: ResolvedTheme;
  isDark: boolean;
  setPreference: (p: ThemePreference) => void;
  colors: typeof darkColors;
}

const darkColors = {
  background: '#0f172a',
  surface: '#1e293b',
  surfaceHigh: '#293548',
  border: '#334155',
  text: '#e2e8f0',
  textMuted: '#64748b',
  textSecondary: '#94a3b8',
  primary: '#0ea5e9',
  success: '#10b981',
  warning: '#f97316',
  danger: '#ef4444',
  tabBar: '#0a0f1a',
  tabBarBorder: '#1e293b',
};

const lightColors: typeof darkColors = {
  background: '#ffffff',
  surface: '#f8fafc',
  surfaceHigh: '#f1f5f9',
  border: '#e2e8f0',
  text: '#0f172a',
  textMuted: '#64748b',
  textSecondary: '#94a3b8',
  primary: '#0ea5e9',
  success: '#10b981',
  warning: '#f97316',
  danger: '#ef4444',
  tabBar: '#ffffff',
  tabBarBorder: '#e2e8f0',
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'autotrackr-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setPreferenceState(stored);
      }
    });
  }, []);

  const setPreference = (p: ThemePreference) => {
    setPreferenceState(p);
    AsyncStorage.setItem(STORAGE_KEY, p);
  };

  const resolvedSystem: ResolvedTheme =
    systemScheme === 'light' ? 'light' : 'dark';
  const theme: ResolvedTheme =
    preference === 'system' ? resolvedSystem : preference;
  const isDark = theme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ preference, theme, isDark, setPreference, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
