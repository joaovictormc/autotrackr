import '../global.css';
import '../lib/i18n';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// NativeWind: no web, usa class-based dark mode
if (Platform.OS === 'web') {
  (StyleSheet as any).setFlag?.('darkMode', 'class');
}
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, asyncStoragePersister } from '../lib/queryClient';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

function RootStack() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <View style={{ flex: 1 }}>
      <GestureHandlerRootView>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: asyncStoragePersister }}
        >
          <ThemeProvider>
            <AuthProvider>
              <RootStack />
            </AuthProvider>
          </ThemeProvider>
        </PersistQueryClientProvider>
      </GestureHandlerRootView>
    </View>
  );
}
