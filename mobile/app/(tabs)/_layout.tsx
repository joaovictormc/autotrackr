import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Home, Droplets, Wrench, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { VehicleProvider } from '../../contexts/VehicleContext';

function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  // Garante que a tab bar não fique atrás da barra de gestos/home indicator
  const tabBarHeight = 56 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: insets.bottom + 4,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.dashboard'),
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="fuel"
        options={{
          title: t('nav.fuel'),
          tabBarIcon: ({ color, size }) => <Droplets size={size} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="maintenance"
        options={{
          title: t('nav.maintenance'),
          tabBarIcon: ({ color, size }) => <Wrench size={size} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav.profile'),
          tabBarIcon: ({ color, size }) => <User size={size} color={color} strokeWidth={1.8} />,
        }}
      />
    </Tabs>
  );
}

export default function TabsRoot() {
  const { isAuthenticated, loading } = useAuth();
  if (!loading && !isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <VehicleProvider>
      <TabsLayout />
    </VehicleProvider>
  );
}
