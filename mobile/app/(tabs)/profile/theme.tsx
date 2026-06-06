import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Sun, Moon, Smartphone, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import ScreenHeader from '../../../components/ScreenHeader';

type Pref = 'light' | 'dark' | 'system';

export default function ThemeScreen() {
  const { t } = useTranslation();
  const { colors, preference, setPreference } = useTheme();

  const options: { key: Pref; label: string; icon: React.ReactNode }[] = [
    { key: 'light', label: t('personalization.light'), icon: <Sun size={20} color={colors.text} strokeWidth={1.8} /> },
    { key: 'dark', label: t('personalization.dark'), icon: <Moon size={20} color={colors.text} strokeWidth={1.8} /> },
    { key: 'system', label: t('personalization.system'), icon: <Smartphone size={20} color={colors.text} strokeWidth={1.8} /> },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('personalization.theme')} />
      <View style={{ padding: 16 }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, overflow: 'hidden' }}>
          {options.map((opt, i) => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setPreference(opt.key)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 16,
                paddingHorizontal: 16,
                borderBottomWidth: i < options.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
              }}
            >
              {opt.icon}
              <Text style={{ flex: 1, color: colors.text, fontSize: 15 }}>{opt.label}</Text>
              {preference === opt.key && <Check size={20} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}
