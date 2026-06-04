import React, { createContext, useContext, useMemo, useState } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material';
import { PaletteMode } from '@mui/material';

export interface AccentOption {
  key: string;
  label: string;
  main: string;
  dark: string;
  light: string;
}

export const ACCENT_OPTIONS: AccentOption[] = [
  { key: 'orange', label: 'Laranja', main: '#f97316', dark: '#ea580c', light: '#fb923c' },
  { key: 'blue', label: 'Azul', main: '#3b82f6', dark: '#2563eb', light: '#60a5fa' },
  { key: 'green', label: 'Verde', main: '#22c55e', dark: '#16a34a', light: '#4ade80' },
  { key: 'violet', label: 'Violeta', main: '#8b5cf6', dark: '#7c3aed', light: '#a78bfa' },
  { key: 'red', label: 'Vermelho', main: '#ef4444', dark: '#dc2626', light: '#f87171' },
  { key: 'teal', label: 'Turquesa', main: '#14b8a6', dark: '#0d9488', light: '#2dd4bf' },
];

interface ThemeContextType {
  mode: PaletteMode;
  toggleColorMode: () => void;
  accent: string;
  setAccent: (key: string) => void;
  accentOptions: AccentOption[];
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  toggleColorMode: () => {},
  accent: 'orange',
  setAccent: () => {},
  accentOptions: ACCENT_OPTIONS,
});

export const useThemeContext = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setMode] = useState<PaletteMode>(
    () => (localStorage.getItem('themeMode') as PaletteMode) ?? 'dark'
  );
  const [accent, setAccentState] = useState<string>(
    () => localStorage.getItem('themeAccent') ?? 'orange'
  );

  const accentDef = useMemo(
    () => ACCENT_OPTIONS.find((a) => a.key === accent) ?? ACCENT_OPTIONS[0],
    [accent]
  );

  const colorMode = useMemo(
    () => ({
      mode,
      accent,
      accentOptions: ACCENT_OPTIONS,
      toggleColorMode: () => {
        setMode((prev) => {
          const next = prev === 'light' ? 'dark' : 'light';
          localStorage.setItem('themeMode', next);
          return next;
        });
      },
      setAccent: (key: string) => {
        localStorage.setItem('themeAccent', key);
        setAccentState(key);
      },
    }),
    [mode, accent]
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: accentDef.main,
            dark: accentDef.dark,
            light: accentDef.light,
            contrastText: '#ffffff',
          },
          secondary: {
            main: '#94a3b8',
          },
          background: {
            default: mode === 'light' ? '#f8fafc' : '#0f172a',
            paper: mode === 'light' ? '#ffffff' : '#1e293b',
          },
          text: {
            primary: mode === 'light' ? '#0f172a' : '#f1f5f9',
            secondary: mode === 'light' ? '#64748b' : '#94a3b8',
          },
          divider: mode === 'light' ? '#e2e8f0' : '#334155',
          error: { main: '#ef4444' },
          warning: { main: '#f59e0b' },
          success: { main: '#22c55e' },
          info: { main: '#38bdf8' },
        },
        shape: {
          borderRadius: 8,
        },
        components: {
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                border: mode === 'light' ? '1px solid #e2e8f0' : '1px solid #334155',
                backgroundImage: 'none',
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                borderRadius: 8,
                fontWeight: 600,
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
                backgroundColor: mode === 'light' ? '#ffffff' : '#0f172a',
                color: mode === 'light' ? '#0f172a' : '#f1f5f9',
                borderBottom: mode === 'light' ? '1px solid #e2e8f0' : '1px solid #334155',
                boxShadow: 'none',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
          MuiMenu: {
            styleOverrides: {
              paper: {
                border: mode === 'light' ? '1px solid #e2e8f0' : '1px solid #334155',
              },
            },
          },
          MuiTextField: {
            defaultProps: {
              variant: 'outlined',
            },
          },
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          button: {
            textTransform: 'none',
            fontWeight: 600,
          },
        },
      }),
    [mode, accentDef]
  );

  return (
    <ThemeContext.Provider value={colorMode}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
