import React, { createContext, useContext, useState, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

interface ThemeContextType {
  mode: PaletteMode;
  toggleColorMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>('light');

  const colorMode = useMemo(
    () => ({
      mode,
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    [mode]
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#1976d2',
            light: '#42a5f5',
            dark: '#1565c0',
          },
          secondary: {
            main: '#9c27b0',
            light: '#ba68c8',
            dark: '#7b1fa2',
          },
          background: {
            default: mode === 'dark' ? '#121212' : '#f5f5f5',
            paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
          },
        },
        components: {
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                boxShadow: mode === 'dark' 
                  ? '0px 4px 20px rgba(0, 0, 0, 0.3)'
                  : '0px 4px 20px rgba(0, 0, 0, 0.05)',
                backgroundColor: mode === 'dark' ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: mode === 'dark' ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                color: mode === 'dark' ? '#ffffff' : 'inherit',
              },
            },
          },
          MuiDataGrid: {
            styleOverrides: {
              root: {
                backgroundColor: mode === 'dark' ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                color: mode === 'dark' ? '#ffffff' : 'inherit',
                '& .MuiDataGrid-cell': {
                  color: mode === 'dark' ? '#ffffff' : 'inherit',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: mode === 'dark' ? 'rgba(25, 25, 25, 0.9)' : 'inherit',
                  color: mode === 'dark' ? '#ffffff' : 'inherit',
                },
              },
            },
          },
          MuiMenu: {
            styleOverrides: {
              paper: {
                backgroundColor: mode === 'dark' ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={colorMode}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}