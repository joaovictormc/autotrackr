import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pt, en } from '@autotrackr/shared';

const LANGUAGE_KEY = 'autotrackr-language';
const deviceLang = getLocales()[0]?.languageCode ?? 'pt';

i18next.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: {
    pt: { translation: pt },
    en: { translation: en },
  },
  lng: deviceLang.startsWith('pt') ? 'pt' : 'en',
  fallbackLng: 'pt',
  interpolation: { escapeValue: false },
});

// Aplica o idioma salvo pelo usuário (sobrepõe o locale do dispositivo)
AsyncStorage.getItem(LANGUAGE_KEY).then((saved) => {
  if (saved && saved !== i18next.language) {
    i18next.changeLanguage(saved);
  }
});

export default i18next;
