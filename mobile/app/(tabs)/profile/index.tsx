import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, TrendingUp, BarChart2, Car, Sun, Globe, LogOut } from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert(t('profile.logout'), t('profile.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('auth.signOut'), style: 'destructive', onPress: signOut },
    ]);
  };

  const MenuItem = ({
    icon, label, onPress, danger = false, badge,
  }: { icon: React.ReactNode; label: string; onPress: () => void; danger?: boolean; badge?: string }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}
    >
      <View style={{ width: 32 }}>{icon}</View>
      <Text style={{ flex: 1, color: danger ? colors.danger : colors.text, fontSize: 15 }}>{label}</Text>
      {badge && <Text style={{ color: colors.textMuted, fontSize: 13, marginRight: 6 }}>{badge}</Text>}
      {!danger && <ChevronRight size={16} color={colors.textMuted} />}
    </TouchableOpacity>
  );

  const iconProps = { size: 18, color: colors.textMuted, strokeWidth: 1.8 };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView>
        {/* User card */}
        <View style={{ padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
            <Text style={{ color: colors.primary, fontSize: 26, fontWeight: '700' }}>
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </Text>
          </View>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>{user?.name}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>{user?.email}</Text>
        </View>

        {/* Menu */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, margin: 16, overflow: 'hidden' }}>
          <MenuItem icon={<TrendingUp {...iconProps} />} label={t('nav.revenue')} onPress={() => router.push('/(tabs)/profile/revenue')} />
          <MenuItem icon={<BarChart2 {...iconProps} />} label={t('nav.reports')} onPress={() => router.push('/(tabs)/profile/reports')} />
          <MenuItem icon={<Car {...iconProps} />} label={t('profile.vehicles')} onPress={() => router.push('/(tabs)/profile/vehicles')} />
        </View>

        <View style={{ backgroundColor: colors.surface, borderRadius: 12, marginHorizontal: 16, overflow: 'hidden' }}>
          <MenuItem icon={<Sun {...iconProps} />} label={t('profile.theme')} onPress={() => router.push('/(tabs)/profile/theme')} />
          <MenuItem icon={<Globe {...iconProps} />} label={t('profile.language')} onPress={() => router.push('/(tabs)/profile/language')} />
        </View>

        <View style={{ backgroundColor: colors.surface, borderRadius: 12, margin: 16, overflow: 'hidden' }}>
          <MenuItem icon={<LogOut size={18} color={colors.danger} strokeWidth={1.8} />} label={t('profile.logout')} onPress={handleSignOut} danger />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
