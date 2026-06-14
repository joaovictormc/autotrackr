import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Megaphone } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

/**
 * Banner de anúncio placeholder — exibido apenas para usuários do plano Free.
 * A rede de anúncios real (AdMob) será integrada futuramente.
 */
export default function AdBanner() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isPro } = useAuth();
  const router = useRouter();

  if (isPro) return null;

  return (
    <TouchableOpacity
      onPress={() => router.push('/(tabs)/profile/upgrade')}
      activeOpacity={0.7}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: colors.border,
        padding: 14,
        marginBottom: 12,
        alignItems: 'center',
        gap: 4,
      }}
    >
      <Text style={{ color: colors.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6 }}>
        {t('plan.adLabel')}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Megaphone size={15} color={colors.textMuted} />
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{t('plan.adUpgrade')}</Text>
      </View>
    </TouchableOpacity>
  );
}
