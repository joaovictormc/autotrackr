import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Home, Fuel, Wrench, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { VehicleProvider } from '../../contexts/VehicleContext';

function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
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
          tabBarIcon: ({ color, size }) => <Fuel size={size} color={color} strokeWidth={1.8} />,
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
