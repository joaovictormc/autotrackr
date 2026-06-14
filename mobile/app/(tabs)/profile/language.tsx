import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../contexts/ThemeContext';
import ScreenHeader from '../../../components/ScreenHeader';

const LANGUAGE_KEY = 'autotrackr-language';

export default function LanguageScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const current = i18n.language?.startsWith('pt') ? 'pt' : 'en';

  const options = [
    { key: 'pt', label: t('language.portuguese'), flag: '🇧🇷' },
    { key: 'en', label: t('language.english'), flag: '🇺🇸' },
  ];

  const change = async (lng: string) => {
    await i18n.changeLanguage(lng);
    await AsyncStorage.setItem(LANGUAGE_KEY, lng);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('language.title')} />
      <View style={{ padding: 16 }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, overflow: 'hidden' }}>
          {options.map((opt, i) => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => change(opt.key)}
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
              <Text style={{ fontSize: 22 }}>{opt.flag}</Text>
              <Text style={{ flex: 1, color: colors.text, fontSize: 15 }}>{opt.label}</Text>
              {current === opt.key && <Check size={20} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}
