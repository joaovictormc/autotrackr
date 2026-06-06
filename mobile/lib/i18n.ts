import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { pt, en } from '@autotrackr/shared';

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

export default i18next;
